const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Register route
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    const { user, error } = await supabase.auth.signUp({
      email,
      password
    });
    if (error) throw error;
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const { user, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    res.json(user);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

module.exports = router;
