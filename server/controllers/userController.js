const bcrypt = require('bcrypt');
const pool = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT u.UserID, u.FirstName, u.LastName, u.Email, u.Phone, u.Role, u.IsActive,
             w.Name AS WarehouseName
      FROM User u
      LEFT JOIN StockClerk sc ON u.UserID = sc.UserID
      LEFT JOIN Warehouse w ON sc.WarehouseID = w.WarehouseID
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT UserID, FirstName, LastName, Email, Phone, Role, IsActive FROM User WHERE UserID = ?',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  const { firstName, lastName, email, password, phone, role, warehouseId } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await conn.query(
      'INSERT INTO User (FirstName, LastName, Email, Password, Phone, Role) VALUES (?, ?, ?, ?, ?, ?)',
      [firstName, lastName, email, hashed, phone, role]
    );
    const newId = result.insertId;

    if (role === 'Admin') {
      await conn.query(
        'INSERT INTO Admin (UserID, AccessLevel, Department) VALUES (?, ?, ?)',
        [newId, 'Full', 'Operations']
      );
      if (warehouseId) {
        await conn.query(
          'INSERT INTO Admin_Warehouse (UserID, WarehouseID, SinceDate) VALUES (?, ?, CURDATE())',
          [newId, warehouseId]
        );
      }
    } else if (role === 'StockClerk') {
      await conn.query(
        'INSERT INTO StockClerk (UserID, WarehouseID, AssignedShift, HireDate) VALUES (?, ?, ?, CURDATE())',
        [newId, warehouseId || null, 'Morning']
      );
    }

    await conn.commit();
    res.json({ id: newId, firstName, lastName, email, phone, role });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
};

exports.update = async (req, res) => {
  const { firstName, lastName, email, phone, role } = req.body;
  try {
    await pool.query(
      'UPDATE User SET FirstName = ?, LastName = ?, Email = ?, Phone = ?, Role = ? WHERE UserID = ?',
      [firstName, lastName, email, phone, role, req.params.id]
    );
    res.json({ message: 'User updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  const { isActive } = req.body;
  try {
    await pool.query('UPDATE User SET IsActive = ? WHERE UserID = ?', [isActive, req.params.id]);
    res.json({ message: 'User status updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await pool.query('DELETE FROM User WHERE UserID = ?', [req.params.id]);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.changePassword = async (req, res) => {
  if (req.user.userId !== parseInt(req.params.id)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { currentPassword, newPassword } = req.body;
  try {
    const [rows] = await pool.query('SELECT Password FROM User WHERE UserID = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });

    const valid = await bcrypt.compare(currentPassword, rows[0].Password);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE User SET Password = ? WHERE UserID = ?', [hashed, req.params.id]);
    res.json({ message: 'Password updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
