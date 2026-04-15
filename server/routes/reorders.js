const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

// GET /api/reorders — Both roles (filterable by status)
router.get('/', auth, async (req, res) => {
  const { status } = req.query;
  try {
    let query = `
      SELECT rs.*, p.Name as ProductName, p.ReorderPoint,
             w.Name as WarehouseName, s.CompanyName as SupplierName
      FROM ReorderSuggestion rs
      JOIN Product p ON rs.ProductID = p.ProductID
      JOIN Warehouse w ON rs.WarehouseID = w.WarehouseID
      LEFT JOIN Supplier s ON rs.SupplierID = s.SupplierID
      WHERE 1=1
    `;
    const params = [];

    if (status) { query += ' AND rs.Status = ?'; params.push(status); }
    query += ' ORDER BY rs.GeneratedAt DESC';

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/reorders/:id/dismiss — Admin only
router.patch('/:id/dismiss', auth, requireRole('Admin'), async (req, res) => {
  try {
    await pool.query(
      "UPDATE ReorderSuggestion SET Status = 'Dismissed' WHERE SuggestionID = ?",
      [req.params.id]
    );
    res.json({ message: 'Suggestion dismissed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/reorders/:id/convert — Admin only
// Requires variantId in the body since the suggestion tracks product, not a specific variant
router.patch('/:id/convert', auth, requireRole('Admin'), async (req, res) => {
  const { supplierId, variantId } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query(
      'SELECT * FROM ReorderSuggestion WHERE SuggestionID = ?',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Suggestion not found' });
    const suggestion = rows[0];

    const [orderResult] = await conn.query(
      'INSERT INTO PurchaseOrder (SupplierID, WarehouseID, TotalAmount, Status, UserID) VALUES (?, ?, 0, ?, ?)',
      [supplierId, suggestion.WarehouseID, 'Pending', req.user.userId]
    );
    await conn.query(
      'INSERT INTO OrderItem (OrderID, ProductVariantID, Quantity, UnitCost) VALUES (?, ?, ?, 0)',
      [orderResult.insertId, variantId, suggestion.SuggestedQuantity]
    );

    await conn.query(
      "UPDATE ReorderSuggestion SET Status = 'Converted' WHERE SuggestionID = ?",
      [req.params.id]
    );

    await conn.commit();
    res.json({ message: 'Converted to purchase order', orderId: orderResult.insertId });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;
