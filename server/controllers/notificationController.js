const pool = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const notifications = [];

    // Pending reorder suggestions (Admin only)
    if (req.user.role === 'Admin') {
      const [reorders] = await pool.query(`
        SELECT rs.SuggestionID as id, p.Name as productName,
               w.Name as warehouseName, rs.SuggestedQuantity,
               rs.GeneratedAt as createdAt
        FROM ReorderSuggestion rs
        JOIN Product p ON rs.ProductID = p.ProductID
        JOIN Warehouse w ON rs.WarehouseID = w.WarehouseID
        WHERE rs.Status = 'Pending'
        ORDER BY rs.GeneratedAt DESC
        LIMIT 10
      `);
      reorders.forEach((r) => {
        notifications.push({
          id: `reorder-${r.id}`,
          type: 'reorder',
          title: 'Reorder Suggestion',
          message: `${r.productName} — suggest ${r.suggestedQuantity} units (${r.warehouseName})`,
          createdAt: r.createdAt,
        });
      });
    }

    // Low stock warnings — for clerks filter by their warehouse
    let stockQuery = `
      SELECT si.QuantityOnHand, p.ReorderPoint,
             p.Name as productName, pv.SKU,
             w.Name as warehouseName, w.WarehouseID
      FROM StoredIn si
      JOIN ProductVariant pv ON si.ProductVariantID = pv.VariantID
      JOIN Product p ON pv.ProductID = p.ProductID
      JOIN Warehouse w ON si.WarehouseID = w.WarehouseID
      WHERE si.QuantityOnHand <= p.ReorderPoint
        AND p.IsActive = 1 AND pv.IsActive = 1
    `;
    const params = [];

    if (req.user.role === 'StockClerk') {
      const [[clerk]] = await pool.query(
        'SELECT WarehouseID FROM StockClerk WHERE UserID = ?',
        [req.user.userId]
      );
      if (clerk?.WarehouseID) {
        stockQuery += ' AND si.WarehouseID = ?';
        params.push(clerk.WarehouseID);
      }
    }

    stockQuery += ' ORDER BY si.QuantityOnHand ASC LIMIT 10';

    const [lowStock] = await pool.query(stockQuery, params);
    lowStock.forEach((item, i) => {
      notifications.push({
        id: `lowstock-${item.SKU}-${i}`,
        type: 'lowstock',
        title: 'Low Stock',
        message: `${item.productName} — ${item.QuantityOnHand} left (min ${item.ReorderPoint}) at ${item.warehouseName}`,
        createdAt: new Date(),
      });
    });

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
