const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

// GET all suppliers
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Supplier');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create supplier
router.post('/', auth, requireRole('Admin'), async (req, res) => {
  const { name, contactPerson, email, phone, address } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO Supplier (Name, ContactPerson, Email, Phone, Address) VALUES (?, ?, ?, ?, ?)',
      [name, contactPerson, email, phone, address]
    );
    res.json({ id: result.insertId, name, contactPerson, email, phone, address });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update supplier
router.put('/:id', auth, requireRole('Admin'), async (req, res) => {
  const { name, contactPerson, email, phone, address } = req.body;
  try {
    await pool.query(
      'UPDATE Supplier SET Name = ?, ContactPerson = ?, Email = ?, Phone = ?, Address = ? WHERE SupplierID = ?',
      [name, contactPerson, email, phone, address, req.params.id]
    );
    res.json({ message: 'Supplier updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE supplier
router.delete('/:id', auth, requireRole('Admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM Supplier WHERE SupplierID = ?', [req.params.id]);
    res.json({ message: 'Supplier deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET products linked to supplier
router.get('/:id/products', auth, requireRole('Admin'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.* FROM Product p
       JOIN SuppliedBy sb ON p.ProductID = sb.ProductID
       WHERE sb.SupplierID = ?`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;