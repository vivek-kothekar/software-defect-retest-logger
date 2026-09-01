const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { get, all } = require('../database/db');
const { authenticate, JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = get('SELECT id, name, email, password, role FROM users WHERE email = ?', [email.trim().toLowerCase()]);
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  return res.json({
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  return res.json({ user: req.user });
});

// GET /api/auth/developers (Used by QA Tester dropdown to assign real developers)
router.get('/developers', authenticate, (req, res) => {
  const developers = all(
    "SELECT id, name, email, role FROM users WHERE role = 'DEVELOPER' ORDER BY name ASC"
  );
  return res.json(developers);
});

// GET /api/auth/users
router.get('/users', authenticate, (req, res) => {
  const users = all('SELECT id, name, email, role FROM users ORDER BY name ASC');
  return res.json(users);
});

module.exports = router;
