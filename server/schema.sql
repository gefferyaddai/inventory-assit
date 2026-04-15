-- ============================================================
-- G3 Inventory System — Schema
-- Run this against the `inventoryasset` database
-- ============================================================
CREATE DATABASE IF NOT EXISTS inventoryasset;
USE inventoryasset;


-- 1. User
CREATE TABLE IF NOT EXISTS User (
  UserID      INT          NOT NULL AUTO_INCREMENT,
  FirstName   VARCHAR(100) NOT NULL,
  LastName    VARCHAR(100) NOT NULL,
  Email       VARCHAR(150) NOT NULL UNIQUE,
  Password    VARCHAR(255) NOT NULL,
  Phone       VARCHAR(30),
  Role        ENUM('Admin','StockClerk') NOT NULL DEFAULT 'StockClerk',
  IsActive    TINYINT(1)   NOT NULL DEFAULT 1,
  DateCreated DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (UserID)
);


-- 2. Warehouse (moved before StockClerk — StockClerk FK depends on it)
CREATE TABLE IF NOT EXISTS Warehouse (
  WarehouseID  INT          NOT NULL AUTO_INCREMENT,
  Name         VARCHAR(150) NOT NULL,
  Address      VARCHAR(255),
  Capacity     INT,
  ManagerName  VARCHAR(100),
  TaxRegion    VARCHAR(50),
  PRIMARY KEY (WarehouseID)
);


-- 3. Admin  (subtype of User)
CREATE TABLE IF NOT EXISTS Admin (
  UserID       INT          NOT NULL,
  AccessLevel  VARCHAR(50),
  Department   VARCHAR(100),
  PRIMARY KEY (UserID),
  FOREIGN KEY (UserID) REFERENCES User(UserID) ON DELETE CASCADE
);


-- 4. StockClerk  (subtype of User)
CREATE TABLE IF NOT EXISTS StockClerk (
  UserID         INT  NOT NULL,
  WarehouseID    INT,
  AssignedShift  VARCHAR(50),
  HireDate       DATE,
  PRIMARY KEY (UserID),
  FOREIGN KEY (UserID)      REFERENCES User(UserID)           ON DELETE CASCADE,
  FOREIGN KEY (WarehouseID) REFERENCES Warehouse(WarehouseID) ON DELETE SET NULL
);


-- 5. Category
CREATE TABLE IF NOT EXISTS Category (
  CategoryID   INT          NOT NULL AUTO_INCREMENT,
  CategoryName VARCHAR(100) NOT NULL,
  Description  TEXT,
  PRIMARY KEY (CategoryID)
);

-- 6. Supplier
CREATE TABLE IF NOT EXISTS Supplier (
  SupplierID   INT          NOT NULL AUTO_INCREMENT,
  CompanyName  VARCHAR(150) NOT NULL,
  ContactName  VARCHAR(100),
  Email        VARCHAR(150),
  Phone        VARCHAR(30),
  Address      TEXT,
  LeadTimeDays INT          NOT NULL DEFAULT 0,
  PRIMARY KEY (SupplierID)
);

-- 7. Product
CREATE TABLE IF NOT EXISTS Product (
  ProductID      INT            NOT NULL AUTO_INCREMENT,
  SKU            VARCHAR(100)   UNIQUE,
  Name           VARCHAR(150)   NOT NULL,
  Description    TEXT,
  UnitPrice      DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  CostPrice      DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  ReorderPoint   INT            NOT NULL DEFAULT 0,
  MaxStockLevel  INT,
  UnitOfMeasure  VARCHAR(50),
  ExpirationDate DATE,
  IsActive       TINYINT(1)     NOT NULL DEFAULT 1,
  CategoryID     INT,
  PRIMARY KEY (ProductID),
  FOREIGN KEY (CategoryID) REFERENCES Category(CategoryID) ON DELETE SET NULL
);

-- 8. ProductVariant
CREATE TABLE IF NOT EXISTS ProductVariant (
  VariantID  INT            NOT NULL AUTO_INCREMENT,
  ProductID  INT            NOT NULL,
  SKU        VARCHAR(100)   UNIQUE,
  Size       VARCHAR(50),
  Color      VARCHAR(50),
  UnitPrice  DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  CostPrice  DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  IsActive   TINYINT(1)     NOT NULL DEFAULT 1,
  PRIMARY KEY (VariantID),
  FOREIGN KEY (ProductID) REFERENCES Product(ProductID) ON DELETE CASCADE
);

-- 9. Product_Supplier  (many-to-many)
CREATE TABLE IF NOT EXISTS Product_Supplier (
  ProductID           INT          NOT NULL,
  SupplierID          INT          NOT NULL,
  PreferredSupplier   TINYINT(1)   NOT NULL DEFAULT 0,
  SupplierProductCode VARCHAR(100),
  PRIMARY KEY (ProductID, SupplierID),
  FOREIGN KEY (ProductID)  REFERENCES Product(ProductID)   ON DELETE CASCADE,
  FOREIGN KEY (SupplierID) REFERENCES Supplier(SupplierID) ON DELETE CASCADE
);

-- 10. StoredIn  (variant ↔ warehouse inventory levels)
CREATE TABLE IF NOT EXISTS StoredIn (
  ProductVariantID  INT          NOT NULL,
  WarehouseID       INT          NOT NULL,
  QuantityOnHand    INT          NOT NULL DEFAULT 0,
  BinLocation       VARCHAR(50),
  PRIMARY KEY (ProductVariantID, WarehouseID),
  FOREIGN KEY (ProductVariantID) REFERENCES ProductVariant(VariantID) ON DELETE CASCADE,
  FOREIGN KEY (WarehouseID)      REFERENCES Warehouse(WarehouseID)    ON DELETE CASCADE
);

-- 11. Admin_Warehouse  (many-to-many)
CREATE TABLE IF NOT EXISTS Admin_Warehouse (
  UserID      INT  NOT NULL,
  WarehouseID INT  NOT NULL,
  SinceDate   DATE,
  PRIMARY KEY (UserID, WarehouseID),
  FOREIGN KEY (UserID)      REFERENCES Admin(UserID)         ON DELETE CASCADE,
  FOREIGN KEY (WarehouseID) REFERENCES Warehouse(WarehouseID) ON DELETE CASCADE
);

-- 12. PurchaseOrder
CREATE TABLE IF NOT EXISTS PurchaseOrder (
  OrderID              INT            NOT NULL AUTO_INCREMENT,
  OrderDate            DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ExpectedDeliveryDate DATE,
  ActualDeliveryDate   DATE,
  Status               ENUM('Pending','Approved','Shipped','Delivered','Cancelled') NOT NULL DEFAULT 'Pending',
  TotalAmount          DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
  UserID               INT            NOT NULL,
  SupplierID           INT            NOT NULL,
  WarehouseID          INT,
  PRIMARY KEY (OrderID),
  FOREIGN KEY (UserID)      REFERENCES User(UserID)           ON DELETE CASCADE,
  FOREIGN KEY (SupplierID)  REFERENCES Supplier(SupplierID)   ON DELETE CASCADE,
  FOREIGN KEY (WarehouseID) REFERENCES Warehouse(WarehouseID) ON DELETE SET NULL
);

-- 13. OrderItem
CREATE TABLE IF NOT EXISTS OrderItem (
  ItemNumber       INT            NOT NULL AUTO_INCREMENT,
  OrderID          INT            NOT NULL,
  ProductVariantID INT            NOT NULL,
  Quantity         INT            NOT NULL,
  UnitCost         DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  Subtotal         DECIMAL(12,2)  GENERATED ALWAYS AS (Quantity * UnitCost) STORED,
  PRIMARY KEY (ItemNumber),
  FOREIGN KEY (OrderID)          REFERENCES PurchaseOrder(OrderID)      ON DELETE CASCADE,
  FOREIGN KEY (ProductVariantID) REFERENCES ProductVariant(VariantID)   ON DELETE CASCADE
);

-- 14. InventoryTransaction
CREATE TABLE IF NOT EXISTS InventoryTransaction (
  TransactionID    INT          NOT NULL AUTO_INCREMENT,
  TransactionType  ENUM('Sale','Receipt','Adjustment','Transfer') NOT NULL,
  Quantity         INT          NOT NULL,
  TransactionDate  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Notes            TEXT,
  TaxCode          VARCHAR(50),
  TaxRate          DECIMAL(5,2),
  ProductVariantID INT          NOT NULL,
  WarehouseID      INT          NOT NULL,
  UserID           INT          NOT NULL,
  PRIMARY KEY (TransactionID),
  FOREIGN KEY (ProductVariantID) REFERENCES ProductVariant(VariantID) ON DELETE CASCADE,
  FOREIGN KEY (WarehouseID)      REFERENCES Warehouse(WarehouseID)    ON DELETE CASCADE,
  FOREIGN KEY (UserID)           REFERENCES User(UserID)              ON DELETE CASCADE
);

-- 15. ReorderSuggestion
CREATE TABLE IF NOT EXISTS ReorderSuggestion (
  SuggestionID      INT      NOT NULL AUTO_INCREMENT,
  SuggestedQuantity INT      NOT NULL DEFAULT 0,
  GeneratedAt       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Status            ENUM('Pending','Ordered','Dismissed','Converted') NOT NULL DEFAULT 'Pending',
  ProductID         INT      NOT NULL,
  WarehouseID       INT      NOT NULL,
  SupplierID        INT,
  PRIMARY KEY (SuggestionID),
  FOREIGN KEY (ProductID)   REFERENCES Product(ProductID)     ON DELETE CASCADE,
  FOREIGN KEY (WarehouseID) REFERENCES Warehouse(WarehouseID) ON DELETE CASCADE,
  FOREIGN KEY (SupplierID)  REFERENCES Supplier(SupplierID)   ON DELETE SET NULL
);

-- 16. Subscription  (Stripe billing: not in relational model
--     but required by billing.js)
CREATE TABLE IF NOT EXISTS Subscription (
  SubscriptionID       INT          NOT NULL AUTO_INCREMENT,
  OrganizationID       INT          NOT NULL UNIQUE,
  StripeCustomerID     VARCHAR(255),
  StripeSubscriptionID VARCHAR(255),
  Plan                 VARCHAR(50)  NOT NULL DEFAULT 'Starter',
  Status               ENUM('active','past_due','cancelled') NOT NULL DEFAULT 'active',
  CurrentPeriodEnd     DATETIME,
  PRIMARY KEY (SubscriptionID)
);