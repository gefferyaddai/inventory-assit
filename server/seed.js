require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('./config/db');

async function seed() {
  try {
    const hash = await bcrypt.hash('password', 10);

    // Admin user
    await pool.query(
      `INSERT INTO User (FirstName, LastName, Email, Password, Role)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE UserID = UserID`,
      ['Kevin', 'Admin', 'Kevin@admin.com', hash, 'Admin']
    );

    // Stock clerk user
    await pool.query(
      `INSERT INTO User (FirstName, LastName, Email, Password, Role)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE UserID = UserID`,
      ['CJ', 'Clerk', 'Cj@clerk.com', hash, 'StockClerk']
    );

    // Categories
    await pool.query(
      `INSERT INTO Category (CategoryName, Description) VALUES
       ('Electronics', 'Electronic devices and accessories'),
       ('Clothing', 'Apparel and fashion items'),
       ('Food & Beverage', 'Consumable goods')
       ON DUPLICATE KEY UPDATE CategoryID = CategoryID`
    );

    // Supplier
    await pool.query(
      `INSERT INTO Supplier (CompanyName, ContactName, Email, Phone, Address, LeadTimeDays) VALUES
       ('G3 Supplies Co.', 'Jane Doe', 'jane@g3supplies.com', '555-1000', '123 Supply St', 5)
       ON DUPLICATE KEY UPDATE SupplierID = SupplierID`
    );

    // Warehouse
    await pool.query(
      `INSERT INTO Warehouse (Name, Address, Capacity, ManagerName, TaxRegion) VALUES
       ('Main Warehouse', '456 Warehouse Ave', 10000, 'Bob Smith', 'US-NY')
       ON DUPLICATE KEY UPDATE WarehouseID = WarehouseID`
    );

    console.log('Seed complete!');
    console.log('Admin login:  Kevin@admin.com / password');
    console.log('Clerk login:  Cj@clerk.com / password');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
