const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Crear nueva alerta
router.post('/', async (req, res) => {
  const { id_zona, nombre_estudiante, genero, edad, tipo_emergencia } = req.body;

  const { data, error } = await supabase
    .from('alertas')
    .insert([{ id_zona, nombre_estudiante, genero, edad, tipo_emergencia, estado: 'activa' }])
    .select();

  if (error) { console.log('Error alertas:', error); return res.status(500).json({ error }); }
  res.json(data[0]);
});

// Obtener todas las alertas
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('alertas')
    .select('*, zonas(nombre_zona, edificio)')
    .order('hora_alerta', { ascending: false });

  if (error) return res.status(500).json({ error });
  res.json(data);
});

// Marcar alerta como atendida
router.put('/:id/atender', async (req, res) => {
  const { data, error } = await supabase
    .from('alertas')
    .update({ estado: 'atendida', hora_atencion: new Date() })
    .eq('id_alerta', req.params.id)
    .select();

  if (error) return res.status(500).json({ error });
  res.json(data[0]);
});

// Marcar en camino
router.put('/:id/en-camino', async (req, res) => {
  const { tomada_por } = req.body;

  const { data, error } = await supabase
    .from('alertas')
    .update({ tomada_por })
    .eq('id_alerta', req.params.id)
    .select();

  if (error) { console.log('Error en camino:', error); return res.status(500).json({ error }); }
  res.json(data[0]);
});

// Métricas
router.get('/metricas/resumen', async (req, res) => {
  try {
    const { data: alertas, error } = await supabase
      .from('alertas')
      .select('*, zonas(nombre_zona, edificio), resoluciones(tiempo_respuesta, doctor, medicamento, lugar)');

    if (error) return res.status(500).json({ error });

    const ahora = new Date();
    const hoy    = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    const semana = new Date(hoy - 7 * 24 * 60 * 60 * 1000);
    const mes    = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

    const porDia    = alertas.filter(a => new Date(a.hora_alerta) >= hoy).length;
    const porSemana = alertas.filter(a => new Date(a.hora_alerta) >= semana).length;
    const porMes    = alertas.filter(a => new Date(a.hora_alerta) >= mes).length;

    const conTiempo = alertas.filter(a => a.resoluciones?.tiempo_respuesta > 0);
    const tiempoPromedio = conTiempo.length > 0
      ? Math.round(conTiempo.reduce((s, a) => s + a.resoluciones.tiempo_respuesta, 0) / conTiempo.length)
      : 0;

    const porZona = {};
    alertas.forEach(a => { const z = a.zonas?.nombre_zona || 'Desconocida'; porZona[z] = (porZona[z] || 0) + 1; });
    const zonaTop = Object.entries(porZona).sort((a,b) => b[1]-a[1]).slice(0,5);

    const porTipo = {};
    alertas.forEach(a => { const t = a.tipo_emergencia?.split(' ').slice(0,4).join(' ') || 'Otro'; porTipo[t] = (porTipo[t] || 0) + 1; });
    const tipoTop = Object.entries(porTipo).sort((a,b) => b[1]-a[1]).slice(0,5);

    const falsas = alertas.filter(a => a.es_falsa === true).length;
    const reales  = alertas.filter(a => !a.es_falsa).length;
    const porMotivo = {};
    alertas.filter(a => a.es_falsa && a.motivo_falsa).forEach(a => { porMotivo[a.motivo_falsa] = (porMotivo[a.motivo_falsa] || 0) + 1; });
    const motivosTop = Object.entries(porMotivo).sort((a,b) => b[1]-a[1]);

    const porHora = {};
    alertas.forEach(a => { const h = `${new Date(a.hora_alerta).getHours()}:00`; porHora[h] = (porHora[h] || 0) + 1; });
    const horasTop = Object.entries(porHora).sort((a,b) => parseInt(a[0])-parseInt(b[0]));

    const tasaResolucion = alertas.length > 0
      ? Math.round((alertas.filter(a => a.estado === 'atendida').length / alertas.length) * 100)
      : 0;

    const porGenero = {};
    alertas.forEach(a => { const g = a.genero || 'No especificado'; porGenero[g] = (porGenero[g] || 0) + 1; });

    const edades = alertas.map(a => parseInt(a.edad)).filter(e => !isNaN(e));
    const edadPromedio = edades.length > 0 ? Math.round(edades.reduce((s,e) => s+e, 0) / edades.length) : 0;

    const porMedicamento = {};
    alertas.filter(a => a.resoluciones?.medicamento).forEach(a => {
      const med = a.resoluciones.medicamento;
      if (med && med.toLowerCase() !== 'ninguno') porMedicamento[med] = (porMedicamento[med] || 0) + 1;
    });
    const medicamentosTop = Object.entries(porMedicamento).sort((a,b) => b[1]-a[1]).slice(0,5);

    const porDoctor = {};
    alertas.filter(a => a.resoluciones?.doctor).forEach(a => { const d = a.resoluciones.doctor; porDoctor[d] = (porDoctor[d] || 0) + 1; });
    const doctoresTop = Object.entries(porDoctor).sort((a,b) => b[1]-a[1]).slice(0,5);

    const porLugar = {};
    alertas.filter(a => a.resoluciones?.lugar).forEach(a => { const l = a.resoluciones.lugar; porLugar[l] = (porLugar[l] || 0) + 1; });
    const lugaresTop = Object.entries(porLugar).sort((a,b) => b[1]-a[1]).slice(0,5);

    res.json({
      total: alertas.length,
      activas: alertas.filter(a => a.estado === 'activa').length,
      atendidas: alertas.filter(a => a.estado === 'atendida').length,
      porDia, porSemana, porMes,
      tiempoPromedio, zonaTop, tipoTop,
      falsas, reales, motivosTop,
      horasTop, tasaResolucion,
      porGenero, edadPromedio,
      medicamentosTop, doctoresTop, lugaresTop
    });

  } catch (err) {
    console.log('Error métricas:', err);
    res.status(500).json({ error: err.message });
  }
});

// Marcar alerta como falsa
router.put('/:id/falsa', async (req, res) => {
  const { motivo_falsa } = req.body;

  const { data, error } = await supabase
    .from('alertas')
    .update({ es_falsa: true, motivo_falsa, estado: 'atendida', hora_atencion: new Date() })
    .eq('id_alerta', req.params.id)
    .select();

  if (error) { console.log('Error falsa:', error); return res.status(500).json({ error }); }
  res.json(data[0]);
});

module.exports = router;