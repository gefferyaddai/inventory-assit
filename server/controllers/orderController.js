const pool = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT po.*, s.CompanyName as SupplierName
       FROM PurchaseOrder po
       JOIN Supplier s ON po.SupplierID = s.SupplierID
       ORDER BY po.OrderDate DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const [order] = await pool.query(
      `SELECT po.*, s.CompanyName as SupplierName
       FROM PurchaseOrder po
       JOIN Supplier s ON po.SupplierID = s.SupplierID
       WHERE po.OrderID = ?`,
      [req.params.id]
    );
    if (!order.length) return res.status(404).json({ error: 'Order not found' });

    const [items] = await pool.query(
      `SELECT oi.*, pv.SKU, pv.Size, pv.Color, p.Name as ProductName
       FROM OrderItem oi
       JOIN ProductVariant pv ON oi.ProductVariantID = pv.VariantID
       JOIN Product p ON pv.ProductID = p.ProductID
       WHERE oi.OrderID = ?`,
      [req.params.id]
    );
    res.json({ ...order[0], items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  const { supplierId, warehouseId, items } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const totalAmount = items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0);
    const [result] = await conn.query(
      'INSERT INTO PurchaseOrder (SupplierID, WarehouseID, TotalAmount, Status, UserID) VALUES (?, ?, ?, ?, ?)',
      [supplierId, warehouseId, totalAmount, 'Pending', req.user.userId]
    );
    const orderId = result.insertId;

    for (const item of items) {
      await conn.query(
        'INSERT INTO OrderItem (OrderID, ProductVariantID, Quantity, UnitCost) VALUES (?, ?, ?, ?)',
        [orderId, item.variantId, item.quantity, item.unitCost]
      );
    }

    await conn.commit();
    res.json({ id: orderId, supplierId, warehouseId, totalAmount, status: 'Pending' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
};

exports.updateStatus = async (req, res) => {
  const { status } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query('UPDATE PurchaseOrder SET Status = ? WHERE OrderID = ?', [status, req.params.id]);

    if (status === 'Delivered') {
      await conn.query('UPDATE PurchaseOrder SET ActualDeliveryDate = CURDATE() WHERE OrderID = ?', [req.params.id]);

      const [items] = await conn.query(
        `SELECT oi.ProductVariantID, oi.Quantity, po.WarehouseID
         FROM OrderItem oi
         JOIN PurchaseOrder po ON oi.OrderID = po.OrderID
         WHERE oi.OrderID = ?`,
        [req.params.id]
      );
      for (const item of items) {
        await conn.query(
          'UPDATE StoredIn SET QuantityOnHand = QuantityOnHand + ? WHERE ProductVariantID = ? AND WarehouseID = ?',
          [item.Quantity, item.ProductVariantID, item.WarehouseID]
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
};

exports.cancel = async (req, res) => {
  try {
    await pool.query("UPDATE PurchaseOrder SET Status = 'Cancelled' WHERE OrderID = ?", [req.params.id]);
    res.json({ message: 'Order cancelled' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
