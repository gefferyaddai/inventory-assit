# Inventory Assist

**Course:** CPSC 471 - Database Management Systems  
**Group:** G-3  
**Members:** Geffery Addai, Emmanuel Buhari, Kevin Igelka, CJ Obi

An inventory tracking web application for small to medium businesses. Supports two roles - **Admin** and **Stock Clerk** - with full product, supplier, warehouse, purchase order, and transaction management backed by a MySQL database.

---

## Tech Stack

| Layer    | Technology                     |
|----------|--------------------------------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend  | Node.js + Express              |
| Database | MySQL 8                        |
| Auth     | JWT (jsonwebtoken + bcrypt)    |

---

## Project Structure

```
inventory-assit/
├── my-react-app/     ← React frontend (port 5173)
└── server/           ← Node.js/Express backend (port 3001)
    ├── config/
    ├── controllers/
    ├── middleware/
    ├── routes/
    ├── schema.sql    ← Full database DDL - run this first
    ├── seed.js       ← Seeds demo data
    └── index.js
```

---

## Installation & Setup

### Prerequisites

- Node.js 18+
- MySQL 8 running locally

---

### Step 1 - Database

1. Open your MySQL client and create the database:
   ```sql
   CREATE DATABASE IF NOT EXISTS InventoryAssist;
   ```

2. Run the schema to create all tables, indexes, and triggers:
   ```bash
   mysql -u root -p InventoryAssist < server/schema.sql
   ```

3. Install server dependencies and seed demo data:
   ```bash
   cd server
   npm install
   node seed.js
   ```

---

### Step 2 - Backend

1. Copy the environment template:
   ```bash
   cp server/.env.example server/.env
   ```

2. Open `server/.env` and fill in your MySQL credentials:
   ```
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=InventoryAssist
   JWT_SECRET=any_long_random_string
   ```

3. Start the backend server:
   ```bash
   cd server
   npm run dev
   ```
   The API will be available at `http://localhost:3001`.

---

### Step 3 - Frontend

Open a second terminal:

```bash
cd my-react-app
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Demo Credentials

| Role        | Email              | Password |
|-------------|--------------------|----------|
| Admin       | admin@example.com  | password |
| Stock Clerk | clerk@example.com  | password |

---

## User Guide

### Login

1. Navigate to `http://localhost:5173` - you will be redirected to the login page.
2. Enter an email and password from the demo credentials above, then click **Sign In**.
3. The app automatically routes you to the correct dashboard based on your role:
   - Admin → `/admin/dashboard`
   - Stock Clerk → `/clerk/dashboard`
4. To switch roles, click your name in the top-right corner and select **Logout**, then log in with the other account.

---

### Admin Role

#### Dashboard (`/admin/dashboard`)

The Admin Dashboard gives a system-wide snapshot:

- **KPI cards** - Total Active Products, Low-Stock Alert count, Pending Purchase Orders, Total Warehouses. Values update in real time from the database.
- **Alert banners** - Yellow banner lists all product variants currently below their reorder point. Blue banner shows overstock items.
- **Recent Transactions** - The last 5 inventory transactions recorded across all warehouses, showing type, product, quantity, and who performed them.
- **Pending Reorder Suggestions** - A mini-table of system-generated reorder alerts. Click **Convert** to flag it for action or **Dismiss** to close it.

---

#### Products (`/admin/products`)

Manage all products and their variants.

1. **View products** - The table shows SKU, name, category, unit price, and active status.
2. **Search & filter** - Use the search bar to filter by name or SKU. Use the category dropdown or status toggle (All / Active / Inactive) to narrow results.
3. **Add a product** - Click **Add Product** (top right). Fill in: SKU, Name, Description, Category, Unit Price, Cost Price, Reorder Point, Max Stock Level, Unit of Measure, and Expiration Date (optional). Click **Save**.
4. **Edit a product** - Click the edit icon on any row to open the prefilled form.
5. **Deactivate a product** - Click the deactivate icon. A confirmation dialog will appear. Deactivated products turn gray and are excluded from active counts.
6. **Manage variants** - Click the chevron (▶) on any product row to expand it and see all variants. Each variant shows its own SKU, size, color, price override, and status.
   - Click **Add Variant** to add a new size/color variant.
   - Toggle a variant active/inactive directly from the expanded row.
7. **Bulk Import** - Click **Import CSV / Excel** to open the 3-step import wizard:
   - **Step 1:** Download the template, fill it in, then drag-and-drop or browse for your `.csv` or `.xlsx` file.
   - **Step 2:** Review the parsed rows. Valid rows show green, rows with errors show red with a tooltip explaining the issue.
   - **Step 3:** Click **Import X Valid Rows** to submit. A summary shows products created, variants created, and rows skipped.

---

#### Categories (`/admin/categories`)

1. **View categories** - Table shows category name, description, and product count.
2. **Add a category** - Click **Add Category**, enter a name and optional description, click **Save**.
3. **Edit a category** - Click the edit icon on any row.
4. **Delete a category** - Click the delete icon. This is blocked (grayed out with a tooltip) if any products are assigned to the category.

---

#### Suppliers (`/admin/suppliers`)

1. **View suppliers** - Table shows company name, contact, email, phone, and lead time.
2. **Add a supplier** - Click **Add Supplier**, fill in all fields, click **Save**.
3. **Edit a supplier** - Open the row dropdown (⋯) → **Edit**.
4. **View supplier details** - Open the row dropdown → **View Details**. The detail view shows:
   - Supplier info card with all fields.
   - **Products Supplied** - all products linked to this supplier, including the supplier's own product code and whether this is their preferred supplier for that product.
   - **Purchase Orders** - all historical orders placed with this supplier, with status and total amount.

---

#### Warehouses (`/admin/warehouses`)

1. **View warehouses** - Table shows name, address, capacity, manager, and tax region.
2. **Add a warehouse** - Click **Add Warehouse**, fill in name, address, capacity, manager, and optionally select a tax region (Canadian province/territory). Click **Save**.
3. **Edit a warehouse** - Open the row dropdown → **Edit**.
4. **View warehouse details** - Open the row dropdown → **View Details**. The detail view shows:
   - Warehouse info card with an **Edit** button.
   - **Assigned Admins** - list of admin users assigned to manage this warehouse, each showing their name, email, and assignment date. Click **Remove** to unassign. Use the dropdown at the bottom to assign a new admin and click **Assign**.
   - **Stock Levels** - all product variants stored at this warehouse with quantity on hand, reorder point, bin location, and status badge (In Stock / Low Stock / Overstock).
     - Use the **search bar** to filter by product name or SKU.
     - Use the **status filter buttons** (All / In Stock / Low Stock / Overstock) to narrow the list.

---

#### Purchase Orders (`/admin/orders`)

1. **View orders** - Table shows order ID, supplier, order date, expected delivery, status badge, and total amount. Use the **status filter** dropdown to show only Pending, Approved, Shipped, Delivered, or Cancelled orders.
2. **Create an order** - Click **Create Order** to open the 3-step wizard:
   - **Step 1:** Select a supplier, a destination warehouse, and an expected delivery date.
   - **Step 2:** Add line items - select a product variant, enter quantity and unit cost, click **Add Item**. Repeat for each item.
   - **Step 3:** Review the summary and total amount, then click **Submit Order**.
3. **View order details** - Click **View** on any order row. The detail view shows:
   - Order info (supplier, placed by, order date, expected delivery).
   - **Status stepper** - shows the current stage: Pending → Approved → Shipped → Delivered.
   - **Action buttons** that change based on status:
     - Pending → **Approve**
     - Approved → **Mark Shipped**
     - Shipped → **Mark Delivered** (this automatically updates stock levels for all line items in the database)
     - Any active status → **Cancel Order** (requires confirmation)
   - **Line Items table** with subtotals and order total.

---

#### Reorder Suggestions (`/admin/reorders`)

Reorder suggestions are auto-generated by a MySQL trigger whenever a Sale transaction causes a product variant's stock to drop below its reorder point.

1. **View suggestions** - Table shows product, warehouse, suggested quantity, preferred supplier, when it was generated, and status. Use the **status tabs** (All / Pending / Converted / Dismissed) to filter.
2. **Convert** - Click **Convert** on a Pending suggestion to mark it as actioned (prompts a confirmation). The row turns green.
3. **Dismiss** - Click **Dismiss** to close the suggestion without ordering. The row turns gray.
4. The orange badge on the sidebar nav item shows the current count of Pending suggestions.

---

#### Reports (`/admin/reports`)

1. Navigate to **Reports**. Three tabs are available:
2. **Inventory Valuation** - Shows total inventory value per product (cost price × quantity on hand), sorted by value descending. Displays a summary card with the grand total.
3. **Sales Trends** - Bar chart of transaction volume over time. Use the warehouse dropdown, product dropdown, and date range picker to filter. The table below the chart shows the top 5 selling variants in the selected period.
4. **Supplier Performance** - Table showing each supplier's total orders, average lead time, on-time deliveries, and fulfillment rate (shown as a progress bar).
5. Click **Export CSV** (top right of any tab) to download the current view as a CSV file.

---

#### User Management (`/admin/users`)

1. **View users** - Table shows name, email, role badge, department or shift, date created, and active status.
2. **Add a user** - Click **Add User**. Select a role first - the form dynamically shows role-specific fields:
   - Admin: Department, Access Level (Manager / SuperAdmin)
   - Stock Clerk: Assigned Shift (Morning / Evening / Night), Hire Date
3. **Edit a user** - Click the edit icon on any row.
4. **Deactivate / Reactivate** - Click the deactivate icon and confirm. The row grays out and the status badge switches to Inactive. Your own account cannot be deactivated.

---

#### Profile (`/profile`)

Available to both roles via the sidebar.

1. **Edit personal info** - Update your first name, last name, or phone number. Click **Save Changes**.
2. **Change password** - Enter your current password, then the new password twice. Click **Update Password**.

---

### Stock Clerk Role

#### Dashboard (`/clerk/dashboard`)

- **KPI cards** - Items In Stock, Low-Stock Items, and Transactions Today - all scoped to the clerk's assigned warehouse.
- **Low-Stock Alert list** - Products currently below their reorder point in this warehouse, with a **Record Receipt** shortcut that pre-fills the transaction form.
- **Recent Transactions** - The last 5 transactions performed by this clerk.

---

#### Inventory (`/clerk/inventory`)

Read-only view of all stock at the clerk's assigned warehouse.

1. The table shows product name, variant (size/color), SKU, bin location, quantity on hand, reorder point, and a status badge (In Stock / Low Stock / Overstock).
2. Use the **search bar** to filter by product name or SKU.
3. Use the **status filter** to show only low-stock or overstock items.
4. No edits or deletions are permitted from this view.

---

#### Record Transaction (`/clerk/transactions/new`)

Log a stock movement against the clerk's assigned warehouse.

1. Select the **transaction type** using the tab selector: Sale | Receipt | Adjustment | Return.
2. Select the **product variant** from the searchable dropdown (scoped to this warehouse).
3. Enter the **quantity**.
4. Optionally add **notes**.
5. The **Live Stock Preview panel** updates in real time showing:
   - Current quantity on hand
   - Projected quantity after this transaction
   - A warning if the result would fall below the reorder point
   - An error (and blocked submit) if the result would go below zero
6. Click **Submit** to record the transaction. A success toast confirms the action and the form resets.

> **Note:** When a Sale transaction is submitted and the resulting stock drops below the product's reorder point, the database trigger automatically creates a Reorder Suggestion visible to Admins.

---

#### Transaction History (`/clerk/transactions`)

View a log of all transactions performed by this clerk.

1. The table shows transaction ID, type badge, product + variant, quantity (green for additions, red for deductions), warehouse, date, and notes.
2. Use the **type checkboxes** (Sale / Receipt / Adjustment / Return) to filter by transaction type.
3. Use the **date range picker** to filter by date.
4. The table is paginated at 25 rows per page. No edits or deletions are permitted.

---

## Database Design Summary

| Item | Count |
|---|---|
| Entity types | 12 |
| Weak entities | 1 (OrderItem) |
| Relationships | 15 |
| M:N junction tables | 3 (Product_Supplier, StoredIn, Admin_Warehouse) |
| Triggers | 3 |
| Scheduled events | 1 |
| Indexes | 13 |

**Triggers:**
- `trg_after_sale_insert` - decrements `QuantityOnHand` in `StoredIn` on Sale; auto-creates a `ReorderSuggestion` if stock drops below `ReorderPoint`
- `trg_after_non_sale_insert` - increments `QuantityOnHand` on Receipt/Return; sets absolute value on Adjustment
- `trg_po_delivered` - increments `QuantityOnHand` for all line items when a PurchaseOrder is marked Delivered

---

## Team Contributions

| Member           | Area                                                         |
|------------------|--------------------------------------------------------------|
| Emmanuel Buhari  | Project lead, admin pages, auth routes, reorder/user routes  |
| Kevin Igelka     | Backend API, categories, suppliers, reports, profile page    |
| Geffery Addai    | Database schema, warehouses, purchase orders, transactions   |
| CJ Obi           | Clerk pages, routing, mock data, user management, README     |
