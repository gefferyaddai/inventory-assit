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

exports.toggleStatus = async (req, res) => {
  const { isActive } = req.body;
  try {
    await pool.query('UPDATE Product SET IsActive = ? WHERE ProductID = ?', [isActive, req.params.id]);
    res.json({ message: 'Product status updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteVariant = async (req, res) => {
  try {
    await pool.query('DELETE FROM ProductVariant WHERE VariantID = ?', [req.params.vid]);
    res.json({ message: 'Variant deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllVariants = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT pv.VariantID as id, pv.SKU as variantSku, pv.Size, pv.Color, pv.UnitPrice,
              p.ProductID, p.Name as productName
       FROM ProductVariant pv
       JOIN Product p ON pv.ProductID = p.ProductID
       WHERE pv.IsActive = 1
       ORDER BY p.Name, pv.Color, pv.Size`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.bulkImport = async (req, res) => {
  const { rows } = req.body; // ImportRow[]
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Build live category map
    const [existingCats] = await conn.query('SELECT CategoryID, CategoryName FROM Category');
    const categoryMap = {};
    for (const c of existingCats) categoryMap[c.CategoryName.toLowerCase()] = c.CategoryID;

    // Create any new categories
    const newCatNames = [...new Set(
      rows.filter(r => r.importStatus === 'new_category').map(r => r.category_name)
    )];
    let categoriesCreated = 0;
    for (const name of newCatNames) {
      const key = name.toLowerCase();
      if (!categoryMap[key]) {
        const [result] = await conn.query('INSERT INTO Category (CategoryName) VALUES (?)', [name]);
        categoryMap[key] = result.insertId;
        categoriesCreated++;
      }
    }

    // Build live product map (sku → ProductID)
    const [existingProds] = await conn.query('SELECT ProductID, SKU FROM Product');
    const productMap = {};
    for (const p of existingProds) productMap[p.SKU.toLowerCase()] = p.ProductID;

    // Build live variant map (sku → VariantID)
    const [existingVars] = await conn.query('SELECT VariantID, SKU FROM ProductVariant');
    const variantMap = {};
    for (const v of existingVars) variantMap[v.SKU.toLowerCase()] = v.VariantID;

    // Build live warehouse map (name → WarehouseID)
    const [warehouseRows] = await conn.query('SELECT WarehouseID, Name FROM Warehouse');
    const warehouseMap = {};
    for (const w of warehouseRows) warehouseMap[w.Name.toLowerCase()] = w.WarehouseID;

    const validRows = rows.filter(r => r.importStatus !== 'error');
    const seenProductSkus = new Set();
    let productsCreated = 0, variantsCreated = 0;

    for (const row of validRows) {
      const psku = row.product_sku.toLowerCase();
      const vsku = row.variant_sku.toLowerCase();

      // Create product if new
      if (!seenProductSkus.has(psku) && !productMap[psku]) {
        seenProductSkus.add(psku);
        const catId = categoryMap[row.category_name.toLowerCase()];
        const [result] = await conn.query(
          `INSERT INTO Product (Name, Description, CategoryID, SKU, UnitPrice, CostPrice, ReorderPoint, MaxStockLevel, UnitOfMeasure)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [row.product_name, row.description || '', catId || null, row.product_sku,
           Number(row.unit_price) || 0, Number(row.cost_price) || 0,
           Number(row.reorder_point) || 0, Number(row.max_stock_level) || 0,
           row.unit_of_measure || 'Each']
        );
        productMap[psku] = result.insertId;
        productsCreated++;
      }

      const productId = productMap[psku];
      if (!productId) continue;

      // Create variant if new
      if (!variantMap[vsku]) {
        const [result] = await conn.query(
          'INSERT INTO ProductVariant (ProductID, SKU, Size, Color, UnitPrice, CostPrice) VALUES (?, ?, ?, ?, ?, ?)',
          [productId, row.variant_sku, row.size || '', row.color || '',
           Number(row.variant_unit_price) || Number(row.unit_price) || 0,
           Number(row.variant_cost_price) || Number(row.cost_price) || 0]
        );
        variantMap[vsku] = result.insertId;
        variantsCreated++;

        // Initialize stock if warehouse is known
        const warehouseId = warehouseMap[row.warehouse_name.toLowerCase()];
        const qty = Number(row.quantity_on_hand) || 0;
        if (warehouseId) {
          await conn.query(
            'INSERT INTO StoredIn (ProductVariantID, WarehouseID, QuantityOnHand, BinLocation) VALUES (?, ?, ?, ?)',
            [result.insertId, warehouseId, qty, row.bin_location || '']
          );
        }
      }
    }

    await conn.commit();
    res.json({ productsCreated, variantsCreated, categoriesCreated });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
};
