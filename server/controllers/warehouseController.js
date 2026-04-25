const pool = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Warehouse');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Warehouse WHERE WarehouseID = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Warehouse not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
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
};

exports.update = async (req, res) => {
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
};

exports.remove = async (req, res) => {
  try {
    await pool.query('DELETE FROM Warehouse WHERE WarehouseID = ?', [req.params.id]);
    res.json({ message: 'Warehouse deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAdmins = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.UserID, u.FirstName, u.LastName, u.Email, m.SinceDate
       FROM Admin_Warehouse m
       JOIN User u ON m.UserID = u.UserID
       WHERE m.WarehouseID = ?
       ORDER BY m.SinceDate DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.assignAdmin = async (req, res) => {
  const { adminId } = req.body;
  try {
    await pool.query(
      'INSERT IGNORE INTO Admin_Warehouse (UserID, WarehouseID, SinceDate) VALUES (?, ?, CURDATE())',
      [adminId, req.params.id]
    );
    res.json({ message: 'Admin assigned' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.removeAdmin = async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM Admin_Warehouse WHERE UserID = ? AND WarehouseID = ?',
      [req.params.adminId, req.params.id]
    );
    res.json({ message: 'Admin removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getStock = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT si.ProductVariantID, si.WarehouseID, si.QuantityOnHand, si.BinLocation,
              pv.SKU, pv.Size, pv.Color, pv.UnitPrice,
              p.Name as ProductName, p.ReorderPoint, p.MaxStockLevel,
              CASE
                WHEN si.QuantityOnHand <= p.ReorderPoint THEN 'Low Stock'
                WHEN p.MaxStockLevel > 0 AND si.QuantityOnHand >= p.MaxStockLevel THEN 'Overstock'
                ELSE 'In Stock'
              END as status
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
};
