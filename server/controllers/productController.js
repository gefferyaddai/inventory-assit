const pool = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, c.CategoryName
       FROM Product p
       LEFT JOIN Category c ON p.CategoryID = c.CategoryID`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const [product] = await pool.query('SELECT * FROM Product WHERE ProductID = ?', [req.params.id]);
    const [variants] = await pool.query('SELECT * FROM ProductVariant WHERE ProductID = ?', [req.params.id]);
    res.json({ ...product[0], variants });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  const { name, description, categoryId, sku, unitPrice, costPrice, reorderPoint, maxStockLevel, unitOfMeasure } = req.body;
  try {
    const [result] = await pool.query(
      `INSERT INTO Product (Name, Description, CategoryID, SKU, UnitPrice, CostPrice, ReorderPoint, MaxStockLevel, UnitOfMeasure)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, description, categoryId, sku, unitPrice ?? 0, costPrice ?? 0, reorderPoint ?? 0, maxStockLevel, unitOfMeasure]
    );
    res.json({ id: result.insertId, name, description, categoryId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  const { name, description, categoryId, sku, unitPrice, costPrice, reorderPoint, maxStockLevel, unitOfMeasure } = req.body;
  try {
    await pool.query(
      `UPDATE Product SET Name = ?, Description = ?, CategoryID = ?, SKU = ?, UnitPrice = ?,
       CostPrice = ?, ReorderPoint = ?, MaxStockLevel = ?, UnitOfMeasure = ? WHERE ProductID = ?`,
      [name, description, categoryId, sku, unitPrice ?? 0, costPrice ?? 0, reorderPoint ?? 0, maxStockLevel, unitOfMeasure, req.params.id]
    );
    res.json({ message: 'Product updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await pool.query('DELETE FROM Product WHERE ProductID = ?', [req.params.id]);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getVariants = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM ProductVariant WHERE ProductID = ?', [req.params.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addVariant = async (req, res) => {
  const { sku, size, color, price, costPrice } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO ProductVariant (ProductID, SKU, Size, Color, UnitPrice, CostPrice) VALUES (?, ?, ?, ?, ?, ?)',
      [req.params.id, sku, size, color, price, costPrice ?? 0]
    );
    res.json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateVariant = async (req, res) => {
  const { sku, size, color, price, costPrice } = req.body;
  try {
    await pool.query(
      'UPDATE ProductVariant SET SKU = ?, Size = ?, Color = ?, UnitPrice = ?, CostPrice = ? WHERE VariantID = ?',
      [sku, size, color, price, costPrice ?? 0, req.params.vid]
    );
    res.json({ message: 'Variant updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.toggleVariantStatus = async (req, res) => {
  const { isActive } = req.body;
  try {
    await pool.query('UPDATE ProductVariant SET IsActive = ? WHERE VariantID = ?', [isActive, req.params.vid]);
    res.json({ message: 'Variant status updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.bulkImport = async (req, res) => {
  const { products } = req.body;
  try {
    for (const p of products) {
      await pool.query(
        'INSERT INTO Product (Name, Description, CategoryID) VALUES (?, ?, ?)',
        [p.name, p.description, p.categoryId]
      );
    }
    res.json({ message: `${products.length} products imported` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
