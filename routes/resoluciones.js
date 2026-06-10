const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Crear resolución
router.post('/', async (req, res) => {
  const { id_alerta, doctor, tiempo_respuesta, tratamiento, medicamento, lugar } = req.body;

  if (!id_alerta || !doctor) {
    return res.status(400).json({ error: 'id_alerta y doctor son requeridos' });
  }

  const { data, error } = await supabase
    .from('resoluciones')
    .insert([{ id_alerta, doctor, tiempo_respuesta, tratamiento, medicamento, lugar }])
    .select();

  if (error) {
    console.log('Error resoluciones:', error);
    return res.status(500).json({ error });
  }
  res.json(data[0]);
});

// Obtener resolución por alerta
router.get('/:id_alerta', async (req, res) => {
  const { data, error } = await supabase
    .from('resoluciones')
    .select('*')
    .eq('id_alerta', req.params.id_alerta)
    .single();

  if (error) return res.status(404).json({ error: 'Resolución no encontrada' });
  res.json(data);
});

module.exports = router;