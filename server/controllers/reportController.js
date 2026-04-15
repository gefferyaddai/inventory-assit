const pool = require('../config/db');

exports.inventoryValue = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.SKU, p.Name as productName, p.CostPrice as costPrice,
              SUM(si.QuantityOnHand) as totalStock,
              SUM(si.QuantityOnHand) * p.CostPrice as totalValue
       FROM Product p
       JOIN ProductVariant pv ON pv.ProductID = p.ProductID
       JOIN StoredIn si ON si.ProductVariantID = pv.VariantID
       WHERE p.IsActive = 1
       GROUP BY p.ProductID
       ORDER BY totalValue DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.lowStock = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.Name as productName, pv.SKU, pv.Size, pv.Color,
              si.QuantityOnHand, p.ReorderPoint, w.Name as warehouseName
       FROM StoredIn si
       JOIN ProductVariant pv ON si.ProductVariantID = pv.VariantID
       JOIN Product p ON pv.ProductID = p.ProductID
       JOIN Warehouse w ON si.WarehouseID = w.WarehouseID
       WHERE si.QuantityOnHand < p.ReorderPoint AND p.ReorderPoint > 0`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.transactionVolume = async (req, res) => {
  const { startDate, endDate } = req.query;
  try {
    const [rows] = await pool.query(
      `SELECT YEARWEEK(TransactionDate, 1) as weekKey,
              DATE_FORMAT(MIN(TransactionDate), '%b %d') as week,
              SUM(CASE WHEN TransactionType = 'Sale' THEN 1 ELSE 0 END) as sales,
              SUM(CASE WHEN TransactionType = 'Receipt' THEN 1 ELSE 0 END) as receipts,
              SUM(CASE WHEN TransactionType IN ('Adjustment','Return') THEN 1 ELSE 0 END) as adjustments
       FROM InventoryTransaction
       WHERE TransactionDate BETWEEN ? AND ?
       GROUP BY YEARWEEK(TransactionDate, 1)
       ORDER BY weekKey`,
      [startDate || '2000-01-01', endDate || '2099-12-31']
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.supplierPerformance = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.SupplierID as supplierId, s.CompanyName as supplier,
              s.LeadTimeDays as avgLeadTime,
              COUNT(po.OrderID) as totalOrders,
              ROUND(
                100.0 * SUM(CASE WHEN po.Status = 'Delivered' THEN 1 ELSE 0 END)
                / NULLIF(COUNT(po.OrderID), 0),
                1
              ) as fulfillmentRate
       FROM Supplier s
       LEFT JOIN PurchaseOrder po ON po.SupplierID = s.SupplierID
       GROUP BY s.SupplierID
       ORDER BY s.CompanyName`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
