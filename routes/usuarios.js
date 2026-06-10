const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Login
router.post('/login', async (req, res) => {
  const { correo, password } = req.body;

  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('correo', correo)
    .eq('password', password)
    .single();

  if (error || !data) return res.status(401).json({ error: 'Credenciales incorrectas' });
  res.json(data);
});

// Obtener todos los usuarios
router.get('/todos', async (req, res) => {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id_usuario, nombre, correo, rol, activo')
    .order('id_usuario');
  if (error) return res.status(500).json({ error });
  res.json(data);
});

// Crear nuevo usuario
router.post('/', async (req, res) => {
  const { nombre, correo, password, rol } = req.body;
  const { data, error } = await supabase
    .from('usuarios')
    .insert([{ nombre, correo, password, rol }])
    .select();
  if (error) return res.status(500).json({ error });
  res.json(data[0]);
});

// Eliminar usuario
router.delete('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('usuarios')
    .delete()
    .eq('id_usuario', req.params.id);
  if (error) return res.status(500).json({ error });
  res.json({ ok: true });
});

// Editar usuario
router.put('/:id', async (req, res) => {
  const { nombre, correo, password, rol } = req.body;
  const updates = { nombre, correo, rol };
  if (password) updates.password = password;

  const { data, error } = await supabase
    .from('usuarios')
    .update(updates)
    .eq('id_usuario', req.params.id)
    .select();
  if (error) return res.status(500).json({ error });
  res.json(data[0]);
});

module.exports = router;