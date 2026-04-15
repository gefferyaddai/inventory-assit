const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

// GET /api/warehouses
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Warehouse');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/warehouses/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM Warehouse WHERE WarehouseID = ?',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Warehouse not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/warehouses — Admin only
router.post('/', auth, requireRole('Admin'), async (req, res) => {
  const { name, address, capacity, managerName, taxRegion } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO Warehouse (Name, Address, Capacity, ManagerName, TaxRegion) VALUES (?, ?, ?, ?, ?)',
      [name, address, capacity, managerName, taxRegion]
    );
    res.json({ id: result.insertId, name, address, capacity, managerName, taxRegion });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/warehouses/:id — Admin only
router.put('/:id', auth, requireRole('Admin'), async (req, res) => {
  const { name, address, capacity, managerName, taxRegion } = req.body;
  try {
    await pool.query(
      'UPDATE Warehouse SET Name = ?, Address = ?, Capacity = ?, ManagerName = ?, TaxRegion = ? WHERE WarehouseID = ?',
      [name, address, capacity, managerName, taxRegion, req.params.id]
    );
    res.json({ message: 'Warehouse updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/warehouses/:id — Admin only
router.delete('/:id', auth, requireRole('Admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM Warehouse WHERE WarehouseID = ?', [req.params.id]);
    res.json({ message: 'Warehouse deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/warehouses/:id/stock — All roles
router.get('/:id/stock', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT si.*, pv.SKU, pv.Size, pv.Color, pv.UnitPrice, p.ReorderPoint,
              p.Name as ProductName
       FROM StoredIn si
       JOIN ProductVariant pv ON si.ProductVariantID = pv.VariantID
       JOIN Product p ON pv.ProductID = p.ProductID
       WHERE si.WarehouseID = ?`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
