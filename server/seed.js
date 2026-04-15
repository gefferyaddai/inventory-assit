require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('./config/db');

async function seed() {
  try {
    const hash = await bcrypt.hash('password', 10);

    // ── Users ──────────────────────────────────────────────────────────────
    await pool.query(
      `INSERT INTO User (FirstName, LastName, Email, Password, Phone, Role)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE UserID = UserID`,
      ['Kevin', 'Admin', 'Kevin@admin.com', hash, '403-555-0101', 'Admin']
    );
    await pool.query(
      `INSERT INTO User (FirstName, LastName, Email, Password, Phone, Role)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE UserID = UserID`,
      ['CJ', 'Clerk', 'Cj@clerk.com', hash, '403-555-0202', 'StockClerk']
    );

    const [[adminRow]]  = await pool.query(`SELECT UserID FROM User WHERE Email = 'Kevin@admin.com'`);
    const [[clerkRow]]  = await pool.query(`SELECT UserID FROM User WHERE Email = 'Cj@clerk.com'`);
    const adminID = adminRow.UserID;
    const clerkID = clerkRow.UserID;

    // ── Warehouses ─────────────────────────────────────────────────────────
    await pool.query(
      `INSERT INTO Warehouse (Name, Address, Capacity, ManagerName, TaxRegion) VALUES
       ('Main Warehouse',  '456 Warehouse Ave, Calgary AB',  10000, 'Bob Smith',   'CA-AB'),
       ('East Distribution', '789 Logistics Blvd, Toronto ON', 8000, 'Sara Lee',   'CA-ON'),
       ('West Hub',        '321 Pacific Rd, Vancouver BC',    6000, 'Mark Tran',   'CA-BC')
       ON DUPLICATE KEY UPDATE WarehouseID = WarehouseID`
    );
    const [[w1]] = await pool.query(`SELECT WarehouseID FROM Warehouse WHERE Name = 'Main Warehouse'`);
    const [[w2]] = await pool.query(`SELECT WarehouseID FROM Warehouse WHERE Name = 'East Distribution'`);
    const [[w3]] = await pool.query(`SELECT WarehouseID FROM Warehouse WHERE Name = 'West Hub'`);
    const wh1 = w1.WarehouseID, wh2 = w2.WarehouseID, wh3 = w3.WarehouseID;

    // ── Admin & StockClerk subtypes ────────────────────────────────────────
    await pool.query(
      `INSERT INTO Admin (UserID, AccessLevel, Department)
       VALUES (?, 'Full', 'Operations')
       ON DUPLICATE KEY UPDATE UserID = UserID`, [adminID]
    );
    await pool.query(
      `INSERT INTO StockClerk (UserID, WarehouseID, AssignedShift, HireDate)
       VALUES (?, ?, 'Morning', '2024-03-15')
       ON DUPLICATE KEY UPDATE UserID = UserID`, [clerkID, wh1]
    );
    await pool.query(
      `INSERT INTO Admin_Warehouse (UserID, WarehouseID, SinceDate)
       VALUES (?, ?, '2023-01-01'), (?, ?, '2023-01-01'), (?, ?, '2023-06-01')
       ON DUPLICATE KEY UPDATE SinceDate = SinceDate`,
      [adminID, wh1, adminID, wh2, adminID, wh3]
    );

    // ── Categories ─────────────────────────────────────────────────────────
    await pool.query(
      `INSERT INTO Category (CategoryName, Description) VALUES
       ('Electronics',     'Electronic devices and accessories'),
       ('Clothing',        'Apparel and fashion items'),
       ('Food & Beverage', 'Consumable goods'),
       ('Office Supplies', 'Stationery and office equipment'),
       ('Tools & Hardware','Hand tools, power tools, and hardware')
       ON DUPLICATE KEY UPDATE CategoryID = CategoryID`
    );
    const [[c1]] = await pool.query(`SELECT CategoryID FROM Category WHERE CategoryName = 'Electronics'`);
    const [[c2]] = await pool.query(`SELECT CategoryID FROM Category WHERE CategoryName = 'Clothing'`);
    const [[c3]] = await pool.query(`SELECT CategoryID FROM Category WHERE CategoryName = 'Food & Beverage'`);
    const [[c4]] = await pool.query(`SELECT CategoryID FROM Category WHERE CategoryName = 'Office Supplies'`);
    const [[c5]] = await pool.query(`SELECT CategoryID FROM Category WHERE CategoryName = 'Tools & Hardware'`);

    // ── Suppliers ──────────────────────────────────────────────────────────
    await pool.query(
      `INSERT INTO Supplier (CompanyName, ContactName, Email, Phone, Address, LeadTimeDays) VALUES
       ('G3 Supplies Co.',      'Jane Doe',      'jane@g3supplies.com',   '555-1000', '123 Supply St, Calgary AB',    5),
       ('TechParts Inc.',       'Alan Park',     'alan@techparts.com',    '555-2000', '88 Circuit Ave, Markham ON',   7),
       ('FreshGoods Ltd.',      'Maria Santos',  'maria@freshgoods.com',  '555-3000', '44 Farm Rd, Surrey BC',        3),
       ('OfficeWorld Corp.',    'Derek Huang',   'derek@officeworld.com', '555-4000', '200 Commerce Dr, Edmonton AB', 4)
       ON DUPLICATE KEY UPDATE SupplierID = SupplierID`
    );
    const [[s1]] = await pool.query(`SELECT SupplierID FROM Supplier WHERE CompanyName = 'G3 Supplies Co.'`);
    const [[s2]] = await pool.query(`SELECT SupplierID FROM Supplier WHERE CompanyName = 'TechParts Inc.'`);
    const [[s3]] = await pool.query(`SELECT SupplierID FROM Supplier WHERE CompanyName = 'FreshGoods Ltd.'`);
    const [[s4]] = await pool.query(`SELECT SupplierID FROM Supplier WHERE CompanyName = 'OfficeWorld Corp.'`);

    // ── Products ───────────────────────────────────────────────────────────
    const products = [
      ['SKU-LAPTOP-001', 'Laptop Pro 15"',       'High-performance laptop',      1299.99, 950.00, 10, 50, 'unit', c1.CategoryID],
      ['SKU-HEADSET-002','Wireless Headset',      'Noise-cancelling headset',      149.99,  85.00, 15, 80, 'unit', c1.CategoryID],
      ['SKU-TSHIRT-003', 'Classic T-Shirt',       'Cotton crew-neck tee',           24.99,  10.00, 30,200, 'unit', c2.CategoryID],
      ['SKU-JACKET-004', 'Winter Jacket',         'Insulated winter jacket',        89.99,  45.00, 20,100, 'unit', c2.CategoryID],
      ['SKU-COFFEE-005', 'Arabica Coffee 1kg',    'Premium ground coffee',          18.99,   9.00, 50,300, 'kg',   c3.CategoryID],
      ['SKU-WATER-006',  'Sparkling Water 24pk',  '24-pack 500ml sparkling water',   12.99,  6.00, 40,250, 'case', c3.CategoryID],
      ['SKU-PAPER-007',  'A4 Copy Paper 500sht',  'White copy paper ream',            8.99,  4.00, 60,400, 'ream', c4.CategoryID],
      ['SKU-DRILL-008',  'Cordless Drill 18V',    '18V lithium drill kit',           99.99,  58.00, 10, 60, 'unit', c5.CategoryID],
    ];
    for (const [sku, name, desc, unit, cost, reorder, maxStock, uom, catID] of products) {
      await pool.query(
        `INSERT INTO Product (SKU, Name, Description, UnitPrice, CostPrice, ReorderPoint, MaxStockLevel, UnitOfMeasure, CategoryID)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE ProductID = ProductID`,
        [sku, name, desc, unit, cost, reorder, maxStock, uom, catID]
      );
    }

    // ── Product Variants ───────────────────────────────────────────────────
    const getProduct = async (sku) => {
      const [[row]] = await pool.query(`SELECT ProductID FROM Product WHERE SKU = ?`, [sku]);
      return row.ProductID;
    };
    const laptopID   = await getProduct('SKU-LAPTOP-001');
    const headsetID  = await getProduct('SKU-HEADSET-002');
    const tshirtID   = await getProduct('SKU-TSHIRT-003');
    const jacketID   = await getProduct('SKU-JACKET-004');
    const coffeeID   = await getProduct('SKU-COFFEE-005');
    const waterId    = await getProduct('SKU-WATER-006');
    const paperId    = await getProduct('SKU-PAPER-007');
    const drillID    = await getProduct('SKU-DRILL-008');

    const variants = [
      [laptopID,  'VAR-LAPTOP-SLV', null,  'Silver', 1299.99, 950.00],
      [laptopID,  'VAR-LAPTOP-BLK', null,  'Black',  1349.99, 970.00],
      [headsetID, 'VAR-HSET-BLK',   null,  'Black',   149.99,  85.00],
      [headsetID, 'VAR-HSET-WHT',   null,  'White',   149.99,  85.00],
      [tshirtID,  'VAR-TS-S',       'S',   'White',    24.99,  10.00],
      [tshirtID,  'VAR-TS-M',       'M',   'White',    24.99,  10.00],
      [tshirtID,  'VAR-TS-L',       'L',   'Black',    24.99,  10.00],
      [jacketID,  'VAR-JK-M',       'M',   'Navy',     89.99,  45.00],
      [jacketID,  'VAR-JK-L',       'L',   'Navy',     89.99,  45.00],
      [coffeeID,  'VAR-COF-1KG',    '1kg', 'N/A',      18.99,   9.00],
      [waterId,   'VAR-WAT-24PK',   '24pk','N/A',      12.99,   6.00],
      [paperId,   'VAR-PAP-A4',     'A4',  'White',     8.99,   4.00],
      [drillID,   'VAR-DRL-18V',    null,  'Yellow',   99.99,  58.00],
    ];
    for (const [pid, sku, size, color, unit, cost] of variants) {
      await pool.query(
        `INSERT INTO ProductVariant (ProductID, SKU, Size, Color, UnitPrice, CostPrice)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE VariantID = VariantID`,
        [pid, sku, size, color, unit, cost]
      );
    }

    // helper to get variant ID
    const getVariant = async (sku) => {
      const [[row]] = await pool.query(`SELECT VariantID FROM ProductVariant WHERE SKU = ?`, [sku]);
      return row.VariantID;
    };

    // ── StoredIn (inventory levels) ────────────────────────────────────────
    const storedIn = [
      ['VAR-LAPTOP-SLV', wh1, 35, 'A-01'], ['VAR-LAPTOP-SLV', wh2, 12, 'A-01'],
      ['VAR-LAPTOP-BLK', wh1, 20, 'A-02'], ['VAR-LAPTOP-BLK', wh3,  8, 'A-02'],
      ['VAR-HSET-BLK',   wh1, 60, 'B-01'], ['VAR-HSET-WHT',   wh1, 45, 'B-02'],
      ['VAR-TS-S',       wh1,120, 'C-01'], ['VAR-TS-M',       wh1,150, 'C-02'],
      ['VAR-TS-L',       wh2, 90, 'C-03'],
      ['VAR-JK-M',       wh1, 40, 'D-01'], ['VAR-JK-L',       wh1, 35, 'D-02'],
      ['VAR-COF-1KG',    wh1,180, 'E-01'], ['VAR-COF-1KG',    wh3, 60, 'E-01'],
      ['VAR-WAT-24PK',   wh1,200, 'E-02'], ['VAR-WAT-24PK',   wh2,100, 'E-02'],
      ['VAR-PAP-A4',     wh1,300, 'F-01'], ['VAR-PAP-A4',     wh2,150, 'F-01'],
      ['VAR-DRL-18V',    wh1, 25, 'G-01'], ['VAR-DRL-18V',    wh3, 10, 'G-01'],
    ];
    for (const [sku, whID, qty, bin] of storedIn) {
      const vid = await getVariant(sku);
      await pool.query(
        `INSERT INTO StoredIn (ProductVariantID, WarehouseID, QuantityOnHand, BinLocation)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE QuantityOnHand = VALUES(QuantityOnHand)`,
        [vid, whID, qty, bin]
      );
    }

    // ── Product_Supplier ───────────────────────────────────────────────────
    const prodSupplier = [
      [laptopID, s2.SupplierID, 1], [headsetID, s2.SupplierID, 1], [tshirtID, s1.SupplierID, 1], [jacketID, s1.SupplierID, 0],
      [coffeeID, s3.SupplierID, 1], [waterId,   s3.SupplierID, 1], [paperId,  s4.SupplierID, 1], [drillID,  s1.SupplierID, 1],
    ];
    for (const [pid, sid, pref] of prodSupplier) {
      await pool.query(
        `INSERT INTO Product_Supplier (ProductID, SupplierID, PreferredSupplier)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE PreferredSupplier = VALUES(PreferredSupplier)`,
        [pid, sid, pref]
      );
    }

    // ── Purchase Orders ────────────────────────────────────────────────────
    const orders = [
      ['2025-11-10', '2025-11-20', '2025-11-19', 'Delivered', adminID, s2.SupplierID, wh1],
      ['2025-12-01', '2025-12-12', null,          'Shipped',  adminID, s1.SupplierID, wh2],
      ['2026-01-05', '2026-01-15', null,          'Approved', adminID, s3.SupplierID, wh1],
      ['2026-02-20', '2026-03-01', null,          'Pending',  adminID, s4.SupplierID, wh3],
      ['2026-03-10', '2026-03-20', null,          'Pending',  adminID, s2.SupplierID, wh1],
    ];
    const orderIDs = [];
    for (const [oDate, expDate, actDate, status, uid, sid, whid] of orders) {
      const [result] = await pool.query(
        `INSERT INTO PurchaseOrder (OrderDate, ExpectedDeliveryDate, ActualDeliveryDate, Status, TotalAmount, UserID, SupplierID, WarehouseID)
         VALUES (?, ?, ?, ?, 0, ?, ?, ?)`,
        [oDate, expDate, actDate, status, uid, sid, whid]
      );
      orderIDs.push(result.insertId);
    }

    // ── Order Items ────────────────────────────────────────────────────────
    const laptopSlvID = await getVariant('VAR-LAPTOP-SLV');
    const laptopBlkID = await getVariant('VAR-LAPTOP-BLK');
    const hsetBlkID   = await getVariant('VAR-HSET-BLK');
    const tsMID       = await getVariant('VAR-TS-M');
    const cofID       = await getVariant('VAR-COF-1KG');
    const watID       = await getVariant('VAR-WAT-24PK');
    const papID       = await getVariant('VAR-PAP-A4');
    const drlID       = await getVariant('VAR-DRL-18V');

    const orderItems = [
      [orderIDs[0], laptopSlvID, 10, 950.00],
      [orderIDs[0], hsetBlkID,   20,  85.00],
      [orderIDs[1], tsMID,       50,  10.00],
      [orderIDs[2], cofID,       80,   9.00],
      [orderIDs[2], watID,      100,   6.00],
      [orderIDs[3], papID,      200,   4.00],
      [orderIDs[4], laptopBlkID, 15, 970.00],
      [orderIDs[4], drlID,       10,  58.00],
    ];
    for (const [oid, vid, qty, cost] of orderItems) {
      await pool.query(
        `INSERT INTO OrderItem (OrderID, ProductVariantID, Quantity, UnitCost) VALUES (?, ?, ?, ?)`,
        [oid, vid, qty, cost]
      );
    }
    // Update TotalAmount on each order
    await pool.query(`
      UPDATE PurchaseOrder po
      SET TotalAmount = (
        SELECT COALESCE(SUM(Quantity * UnitCost), 0)
        FROM OrderItem WHERE OrderID = po.OrderID
      )
    `);

    // ── Inventory Transactions ─────────────────────────────────────────────
    const transactions = [
      ['Receipt',    10, '2025-11-19', 'Received order from TechParts',  null,    null,   laptopSlvID, wh1, adminID],
      ['Receipt',    20, '2025-11-19', 'Received headsets',               null,    null,   hsetBlkID,   wh1, adminID],
      ['Sale',       -5, '2025-12-05', 'Sold to BigCorp',                'TAX-AB', 5.00,  laptopSlvID, wh1, clerkID],
      ['Sale',       -3, '2025-12-10', 'Sold to RetailCo',               'TAX-AB', 5.00,  hsetBlkID,   wh1, clerkID],
      ['Adjustment', -2, '2026-01-08', 'Damaged units written off',       null,    null,   laptopBlkID, wh1, adminID],
      ['Transfer',   15, '2026-01-15', 'Transfer to East Distribution',   null,    null,   tsMID,       wh2, adminID],
      ['Receipt',    80, '2026-01-20', 'Coffee stock received',           null,    null,   cofID,       wh1, clerkID],
      ['Sale',      -12, '2026-02-01', 'Cafe order fulfilled',            'TAX-AB', 5.00,  cofID,       wh1, clerkID],
      ['Sale',      -20, '2026-02-14', 'Bulk water sale',                 'TAX-AB', 5.00,  watID,       wh1, clerkID],
      ['Receipt',   200, '2026-03-01', 'Paper restock',                   null,    null,   papID,       wh1, clerkID],
    ];
    for (const [type, qty, date, notes, taxCode, taxRate, vid, whid, uid] of transactions) {
      await pool.query(
        `INSERT INTO InventoryTransaction (TransactionType, Quantity, TransactionDate, Notes, TaxCode, TaxRate, ProductVariantID, WarehouseID, UserID)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [type, qty, date, notes, taxCode, taxRate, vid, whid, uid]
      );
    }

    // ── Reorder Suggestions ────────────────────────────────────────────────
    const reorders = [
      [50, 'Pending',   laptopID, wh1, s2.SupplierID],
      [30, 'Pending',   drillID,  wh1, s1.SupplierID],
      [20, 'Ordered',   laptopID, wh2, s2.SupplierID],
      [10, 'Converted', drillID,  wh3, s1.SupplierID],
    ];
    for (const [qty, status, pid, whid, sid] of reorders) {
      await pool.query(
        `INSERT INTO ReorderSuggestion (SuggestedQuantity, Status, ProductID, WarehouseID, SupplierID)
         VALUES (?, ?, ?, ?, ?)`,
        [qty, status, pid, whid, sid]
      );
    }

    console.log('\nSeed complete!');
    console.log('─────────────────────────────────');
    console.log('Admin login:  Kevin@admin.com / password');
    console.log('Clerk login:  Cj@clerk.com   / password');
    console.log('─────────────────────────────────');
    console.log('Seeded: 2 users, 3 warehouses, 8 products, 13 variants');
    console.log('        5 purchase orders, 8 order items');
    console.log('        10 transactions, 4 reorder suggestions');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
