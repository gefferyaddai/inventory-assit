const pool = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Supplier');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  const { companyName, contactName, email, phone, address, leadTimeDays } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO Supplier (CompanyName, ContactName, Email, Phone, Address, LeadTimeDays) VALUES (?, ?, ?, ?, ?, ?)',
      [companyName, contactName, email, phone, address, leadTimeDays ?? 0]
    );
    res.json({ id: result.insertId, companyName, contactName, email, phone, address, leadTimeDays });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  const { companyName, contactName, email, phone, address, leadTimeDays } = req.body;
  try {
    await pool.query(
      'UPDATE Supplier SET CompanyName = ?, ContactName = ?, Email = ?, Phone = ?, Address = ?, LeadTimeDays = ? WHERE SupplierID = ?',
      [companyName, contactName, email, phone, address, leadTimeDays ?? 0, req.params.id]
    );
    res.json({ message: 'Supplier updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await pool.query('DELETE FROM Supplier WHERE SupplierID = ?', [req.params.id]);
    res.json({ message: 'Supplier deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.ProductID, p.SKU, p.Name, c.CategoryName,
              ps.PreferredSupplier, ps.SupplierProductCode
       FROM Product p
       JOIN Product_Supplier ps ON p.ProductID = ps.ProductID
       LEFT JOIN Category c ON p.CategoryID = c.CategoryID
       WHERE ps.SupplierID = ?`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
