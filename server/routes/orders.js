const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

// GET /api/orders — Admin only
router.get('/', auth, requireRole('Admin'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT po.*, s.Name as SupplierName
       FROM PurchaseOrder po
       JOIN Supplier s ON po.SupplierID = s.SupplierID
       ORDER BY po.OrderDate DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/:id — Admin only
router.get('/:id', auth, requireRole('Admin'), async (req, res) => {
  try {
    const [order] = await pool.query(
      `SELECT po.*, s.Name as SupplierName
       FROM PurchaseOrder po
       JOIN Supplier s ON po.SupplierID = s.SupplierID
       WHERE po.PurchaseOrderID = ?`,
      [req.params.id]
    );
    if (!order.length) return res.status(404).json({ error: 'Order not found' });

    const [items] = await pool.query(
      `SELECT oi.*, pv.SKU, pv.Size, pv.Color, p.Name as ProductName
       FROM OrderItem oi
       JOIN ProductVariant pv ON oi.VariantID = pv.VariantID
       JOIN Product p ON pv.ProductID = p.ProductID
       WHERE oi.PurchaseOrderID = ?`,
      [req.params.id]
    );
    res.json({ ...order[0], items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/orders — Admin only
router.post('/', auth, requireRole('Admin'), async (req, res) => {
  const { supplierId, items } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const totalAmount = items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0);
    const [result] = await conn.query(
      'INSERT INTO PurchaseOrder (SupplierID, TotalAmount, Status) VALUES (?, ?, ?)',
      [supplierId, totalAmount, 'Pending']
    );
    const orderId = result.insertId;

    for (const item of items) {
      await conn.query(
        'INSERT INTO OrderItem (PurchaseOrderID, VariantID, Quantity, UnitCost) VALUES (?, ?, ?, ?)',
        [orderId, item.variantId, item.quantity, item.unitCost]
      );
    }

    await conn.commit();
    res.json({ id: orderId, supplierId, totalAmount, status: 'Pending' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// PATCH /api/orders/:id/status — Admin only
router.patch('/:id/status', auth, requireRole('Admin'), async (req, res) => {
  const { status } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      'UPDATE PurchaseOrder SET Status = ? WHERE PurchaseOrderID = ?',
      [status, req.params.id]
    );

    if (status === 'Delivered') {
      const [items] = await conn.query(
        `SELECT oi.VariantID, oi.Quantity, po.WarehouseID
         FROM OrderItem oi
         JOIN PurchaseOrder po ON oi.PurchaseOrderID = po.PurchaseOrderID
         WHERE oi.PurchaseOrderID = ?`,
        [req.params.id]
      );
      for (const item of items) {
        await conn.query(
          'UPDATE StoredIn SET QuantityOnHand = QuantityOnHand + ? WHERE VariantID = ? AND WarehouseID = ?',
          [item.Quantity, item.VariantID, item.WarehouseID]
        );
      }
    }

    await conn.commit();
    res.json({ message: 'Order status updated' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// DELETE /api/orders/:id — Admin only (sets status to Cancelled)
router.delete('/:id', auth, requireRole('Admin'), async (req, res) => {
  try {
    await pool.query(
      "UPDATE PurchaseOrder SET Status = 'Cancelled' WHERE PurchaseOrderID = ?",
      [req.params.id]
    );
    res.json({ message: 'Order cancelled' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
