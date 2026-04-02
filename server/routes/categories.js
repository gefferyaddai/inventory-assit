const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

// GET all categories
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Category');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create category
router.post('/', auth, requireRole('Admin'), async (req, res) => {
  const { name, description } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO Category (Name, Description) VALUES (?, ?)',
      [name, description]
    );
    res.json({ id: result.insertId, name, description });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update category
router.put('/:id', auth, requireRole('Admin'), async (req, res) => {
  const { name, description } = req.body;
  try {
    await pool.query(
      'UPDATE Category SET Name = ?, Description = ? WHERE CategoryID = ?',
      [name, description, req.params.id]
    );
    res.json({ message: 'Category updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE category
router.delete('/:id', auth, requireRole('Admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM Category WHERE CategoryID = ?', [req.params.id]);
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;