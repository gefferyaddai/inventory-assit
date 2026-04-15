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
  const { companyName, contactName, email, phone, address, leadTimeDays } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO Supplier (CompanyName, ContactName, Email, Phone, Address, LeadTimeDays) VALUES (?, ?, ?, ?, ?, ?)',
      [companyName, contactName, email, phone, address, leadTimeDays ?? 0]
    );
    res.json({ id: result.insertId, companyName, contactName, email, phone, address, leadTimeDays });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update supplier
router.put('/:id', auth, requireRole('Admin'), async (req, res) => {
  const { companyName, contactName, email, phone, address, leadTimeDays } = req.body;
  try {
    await pool.query(
      'UPDATE Supplier SET CompanyName = ?, ContactName = ?, Email = ?, Phone = ?, Address = ?, LeadTimeDays = ? WHERE SupplierID = ?',
      [companyName, contactName, email, phone, address, leadTimeDays ?? 0, req.params.id]
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
       JOIN Product_Supplier ps ON p.ProductID = ps.ProductID
       WHERE ps.SupplierID = ?`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;