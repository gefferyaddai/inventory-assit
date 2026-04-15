const pool = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.*, COUNT(p.ProductID) as productCount
       FROM Category c
       LEFT JOIN Product p ON c.CategoryID = p.CategoryID
       GROUP BY c.CategoryID`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  const { name, description } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO Category (CategoryName, Description) VALUES (?, ?)',
      [name, description]
    );
    res.json({ id: result.insertId, name, description });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  const { name, description } = req.body;
  try {
    await pool.query(
      'UPDATE Category SET CategoryName = ?, Description = ? WHERE CategoryID = ?',
      [name, description, req.params.id]
    );
    res.json({ message: 'Category updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await pool.query('DELETE FROM Category WHERE CategoryID = ?', [req.params.id]);
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
