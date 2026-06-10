const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Obtener todas las zonas
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('zonas')
    .select('*')
    .eq('activo', true);

  if (error) return res.status(500).json({ error });
  res.json(data);
});

// Obtener zona por id
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('zonas')
    .select('*')
    .eq('id_zona', req.params.id)
    .single();

  if (error) return res.status(500).json({ error });
  res.json(data);
});

module.exports = router;