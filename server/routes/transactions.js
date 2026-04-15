const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

// GET /api/transactions — Admin: all transactions (filterable)
router.get('/', auth, requireRole('Admin'), async (req, res) => {
  const { type, warehouseId, startDate, endDate } = req.query;
  try {
    let query = `
      SELECT it.*, pv.SKU, pv.Size, pv.Color, p.Name as ProductName,
             CONCAT(u.FirstName, ' ', u.LastName) as ClerkName, w.Name as WarehouseName
      FROM InventoryTransaction it
      JOIN ProductVariant pv ON it.ProductVariantID = pv.VariantID
      JOIN Product p ON pv.ProductID = p.ProductID
      JOIN User u ON it.UserID = u.UserID
      JOIN Warehouse w ON it.WarehouseID = w.WarehouseID
      WHERE 1=1
    `;
    const params = [];

    if (type) { query += ' AND it.TransactionType = ?'; params.push(type); }
    if (warehouseId) { query += ' AND it.WarehouseID = ?'; params.push(warehouseId); }
    if (startDate) { query += ' AND it.TransactionDate >= ?'; params.push(startDate); }
    if (endDate) { query += ' AND it.TransactionDate <= ?'; params.push(endDate); }

    query += ' ORDER BY it.TransactionDate DESC';

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/transactions/mine — StockClerk: own transactions only
router.get('/mine', auth, requireRole('StockClerk'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT it.*, pv.SKU, pv.Size, pv.Color, p.Name as ProductName,
              w.Name as WarehouseName
       FROM InventoryTransaction it
       JOIN ProductVariant pv ON it.ProductVariantID = pv.VariantID
       JOIN Product p ON pv.ProductID = p.ProductID
       JOIN Warehouse w ON it.WarehouseID = w.WarehouseID
       WHERE it.UserID = ?
       ORDER BY it.TransactionDate DESC`,
      [req.user.userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/transactions — StockClerk: record new transaction
router.post('/', auth, requireRole('StockClerk'), async (req, res) => {
  const { variantId, warehouseId, transactionType, quantity, notes, taxCode, taxRate } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      `INSERT INTO InventoryTransaction
         (UserID, ProductVariantID, WarehouseID, TransactionType, Quantity, Notes, TaxCode, TaxRate)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.userId, variantId, warehouseId, transactionType, quantity, notes, taxCode, taxRate]
    );

    if (transactionType === 'Receipt') {
      await conn.query(
        'UPDATE StoredIn SET QuantityOnHand = QuantityOnHand + ? WHERE ProductVariantID = ? AND WarehouseID = ?',
        [quantity, variantId, warehouseId]
      );
    }

    await conn.commit();
    res.json({ id: result.insertId });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;
