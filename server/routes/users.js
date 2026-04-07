const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

// GET /api/users — Admin only
router.get('/', auth, requireRole('Admin'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT UserID, Name, Email, Role, IsActive FROM User'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:id — Admin only
router.get('/:id', auth, requireRole('Admin'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT UserID, Name, Email, Role, IsActive FROM User WHERE UserID = ?',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users — Admin only
router.post('/', auth, requireRole('Admin'), async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO User (Name, Email, Password, Role) VALUES (?, ?, ?, ?)',
      [name, email, hashed, role]
    );
    res.json({ id: result.insertId, name, email, role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id — Admin only
router.put('/:id', auth, requireRole('Admin'), async (req, res) => {
  const { name, email, role } = req.body;
  try {
    await pool.query(
      'UPDATE User SET Name = ?, Email = ?, Role = ? WHERE UserID = ?',
      [name, email, role, req.params.id]
    );
    res.json({ message: 'User updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/users/:id/status — Admin only
router.patch('/:id/status', auth, requireRole('Admin'), async (req, res) => {
  const { isActive } = req.body;
  try {
    await pool.query(
      'UPDATE User SET IsActive = ? WHERE UserID = ?',
      [isActive, req.params.id]
    );
    res.json({ message: 'User status updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/users/:id — Admin only
router.delete('/:id', auth, requireRole('Admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM User WHERE UserID = ?', [req.params.id]);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id/password — Self only
router.put('/:id/password', auth, async (req, res) => {
  if (req.user.userId !== parseInt(req.params.id)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { currentPassword, newPassword } = req.body;
  try {
    const [rows] = await pool.query('SELECT Password FROM User WHERE UserID = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });

    const valid = await bcrypt.compare(currentPassword, rows[0].Password);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE User SET Password = ? WHERE UserID = ?', [hashed, req.params.id]);
    res.json({ message: 'Password updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
