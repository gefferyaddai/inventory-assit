const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

// GET all products with category name
router.get('/', auth, async (req, res) => {
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
});

// GET single product with variants
router.get('/:id', auth, async (req, res) => {
  try {
    const [product] = await pool.query(
      'SELECT * FROM Product WHERE ProductID = ?', [req.params.id]
    );
    const [variants] = await pool.query(
      'SELECT * FROM ProductVariant WHERE ProductID = ?', [req.params.id]
    );
    res.json({ ...product[0], variants });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create product
router.post('/', auth, requireRole('Admin'), async (req, res) => {
  const { name, description, categoryId } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO Product (Name, Description, CategoryID) VALUES (?, ?, ?)',
      [name, description, categoryId]
    );
    res.json({ id: result.insertId, name, description, categoryId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update product
router.put('/:id', auth, requireRole('Admin'), async (req, res) => {
  const { name, description, categoryId } = req.body;
  try {
    await pool.query(
      'UPDATE Product SET Name = ?, Description = ?, CategoryID = ? WHERE ProductID = ?',
      [name, description, categoryId, req.params.id]
    );
    res.json({ message: 'Product updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE product
router.delete('/:id', auth, requireRole('Admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM Product WHERE ProductID = ?', [req.params.id]);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET variants for a product
router.get('/:id/variants', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM ProductVariant WHERE ProductID = ?', [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add variant
router.post('/:id/variants', auth, requireRole('Admin'), async (req, res) => {
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
});

// PUT update variant
router.put('/:id/variants/:vid', auth, requireRole('Admin'), async (req, res) => {
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
});

// PATCH toggle variant status
router.patch('/:id/variants/:vid/status', auth, requireRole('Admin'), async (req, res) => {
  const { isActive } = req.body;
  try {
    await pool.query(
      'UPDATE ProductVariant SET IsActive = ? WHERE VariantID = ?',
      [isActive, req.params.vid]
    );
    res.json({ message: 'Variant status updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST bulk import
router.post('/bulk-import', auth, requireRole('Admin'), async (req, res) => {
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
});

module.exports = router;