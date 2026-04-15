const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// GET inventory value by category
router.get('/inventory-value', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.CategoryName as category,
       SUM(si.QuantityOnHand * pv.UnitPrice) as totalValue
       FROM StoredIn si
       JOIN ProductVariant pv ON si.ProductVariantID = pv.VariantID
       JOIN Product p ON pv.ProductID = p.ProductID
       JOIN Category c ON p.CategoryID = c.CategoryID
       GROUP BY c.CategoryID`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET low stock variants
router.get('/low-stock', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.Name as productName, pv.SKU, pv.Size, pv.Color,
       si.QuantityOnHand, p.ReorderPoint
       FROM StoredIn si
       JOIN ProductVariant pv ON si.ProductVariantID = pv.VariantID
       JOIN Product p ON pv.ProductID = p.ProductID
       WHERE si.QuantityOnHand < p.ReorderPoint`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET transaction volume by day
router.get('/transaction-volume', auth, async (req, res) => {
  const { startDate, endDate } = req.query;
  try {
    const [rows] = await pool.query(
      `SELECT DATE(TransactionDate) as date, COUNT(*) as count
       FROM InventoryTransaction
       WHERE TransactionDate BETWEEN ? AND ?
       GROUP BY DATE(TransactionDate)
       ORDER BY date`,
      [startDate || '2000-01-01', endDate || '2099-12-31']
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET supplier performance
router.get('/supplier-performance', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.CompanyName as supplier, COUNT(po.OrderID) as totalOrders,
       AVG(DATEDIFF(po.ActualDeliveryDate, po.OrderDate)) as avgDeliveryDays
       FROM PurchaseOrder po
       JOIN Supplier s ON po.SupplierID = s.SupplierID
       GROUP BY s.SupplierID`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
