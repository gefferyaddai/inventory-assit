// ── Categories ────────────────────────────────────────────────────────────────

export const categories = [
  { id: "C1", name: "Electronics", description: "Consumer electronics and display devices"     },
  { id: "C2", name: "Peripherals", description: "Input devices, audio, and computer peripherals" },
  { id: "C3", name: "Furniture",   description: "Office furniture and ergonomic accessories"   },
  { id: "C4", name: "Networking",  description: "Network cables, switches, and connectivity"   },
  { id: "C5", name: "Accessories", description: "Portable accessories and utility items"        },
];

// ── Products ──────────────────────────────────────────────────────────────────

export const products = [
  {
    id: "P001", sku: "WM-001", name: "Wireless Mouse", description: "Ergonomic wireless mouse with long battery life.",
    category: "Peripherals", unitPrice: 29.99, costPrice: 14.00, reorderPoint: 20, maxStockLevel: 100,
    unitOfMeasure: "Each", expirationDate: null, status: "Active",
    variants: [
      { id: "V001a", variantSku: "WM-001-BLK", size: "Standard", color: "Black", unitPrice: 29.99, costPrice: 14.00, status: "Active" },
      { id: "V001b", variantSku: "WM-001-WHT", size: "Standard", color: "White", unitPrice: 29.99, costPrice: 14.00, status: "Active" },
    ],
  },
  {
    id: "P002", sku: "UC-002", name: "USB-C Hub", description: "7-in-1 USB-C hub with HDMI and PD charging.",
    category: "Peripherals", unitPrice: 49.99, costPrice: 22.00, reorderPoint: 15, maxStockLevel: 80,
    unitOfMeasure: "Each", expirationDate: null, status: "Active",
    variants: [],
  },
  {
    id: "P003", sku: "MK-003", name: "Mechanical Keyboard", description: "TKL mechanical keyboard with blue switches.",
    category: "Peripherals", unitPrice: 119.99, costPrice: 58.00, reorderPoint: 10, maxStockLevel: 50,
    unitOfMeasure: "Each", expirationDate: null, status: "Active",
    variants: [
      { id: "V003a", variantSku: "MK-003-BLU", size: "TKL", color: "Black", unitPrice: 119.99, costPrice: 58.00, status: "Active" },
      { id: "V003b", variantSku: "MK-003-RED", size: "Full", color: "White", unitPrice: 129.99, costPrice: 62.00, status: "Active" },
    ],
  },
  {
    id: "P004", sku: "MS-004", name: "Monitor Stand", description: "Adjustable aluminum monitor riser stand.",
    category: "Furniture", unitPrice: 79.99, costPrice: 35.00, reorderPoint: 8, maxStockLevel: 40,
    unitOfMeasure: "Each", expirationDate: null, status: "Active",
    variants: [],
  },
  {
    id: "P005", sku: "WC-005", name: "Webcam HD", description: "1080p HD webcam with built-in microphone.",
    category: "Electronics", unitPrice: 89.99, costPrice: 40.00, reorderPoint: 12, maxStockLevel: 60,
    unitOfMeasure: "Each", expirationDate: null, status: "Active",
    variants: [],
  },
  {
    id: "P006", sku: "HS-006", name: "Headset Pro", description: "Noise-cancelling over-ear headset for office use.",
    category: "Electronics", unitPrice: 149.99, costPrice: 70.00, reorderPoint: 10, maxStockLevel: 50,
    unitOfMeasure: "Each", expirationDate: null, status: "Active",
    variants: [],
  },
  {
    id: "P007", sku: "ET-007", name: "Ethernet Cable 5m", description: "Cat6 ethernet patch cable, 5 metres.",
    category: "Networking", unitPrice: 12.99, costPrice: 4.00, reorderPoint: 50, maxStockLevel: 300,
    unitOfMeasure: "Each", expirationDate: null, status: "Active",
    variants: [],
  },
  {
    id: "P008", sku: "SW-008", name: "Network Switch 8-Port", description: "Unmanaged Gigabit 8-port network switch.",
    category: "Networking", unitPrice: 59.99, costPrice: 28.00, reorderPoint: 5, maxStockLevel: 30,
    unitOfMeasure: "Each", expirationDate: null, status: "Active",
    variants: [],
  },
  {
    id: "P009", sku: "LP-009", name: "Laptop Stand", description: "Portable folding laptop stand, aluminum alloy.",
    category: "Accessories", unitPrice: 39.99, costPrice: 16.00, reorderPoint: 15, maxStockLevel: 80,
    unitOfMeasure: "Each", expirationDate: null, status: "Active",
    variants: [],
  },
  {
    id: "P010", sku: "MW-010", name: 'Monitor 27" 4K', description: '27-inch 4K UHD IPS monitor, 60Hz.',
    category: "Electronics", unitPrice: 499.99, costPrice: 280.00, reorderPoint: 5, maxStockLevel: 20,
    unitOfMeasure: "Each", expirationDate: null, status: "Active",
    variants: [],
  },
  {
    id: "P011", sku: "OC-011", name: "Office Chair", description: "Ergonomic mesh office chair with lumbar support.",
    category: "Furniture", unitPrice: 299.99, costPrice: 150.00, reorderPoint: 3, maxStockLevel: 15,
    unitOfMeasure: "Each", expirationDate: null, status: "Inactive",
    variants: [],
  },
];

// ── Warehouses ────────────────────────────────────────────────────────────────

export const warehouses = [
  { id: "W1", name: "Main Warehouse",  location: "Calgary, AB" },
  { id: "W2", name: "East Wing",       location: "Edmonton, AB" },
  { id: "W3", name: "Storage Annex",   location: "Red Deer, AB" },
];

// ── Warehouse Stocks ──────────────────────────────────────────────────────────

export const warehouseStocks: Record<string, {
  productVariantId: string; variantSku: string; productName: string;
  qtyOnHand: number; reorderPoint: number; binLocation: string; status: string;
}[]> = {
  W1: [
    { productVariantId: "PV001", variantSku: "WM-001",  productName: "Wireless Mouse",        qtyOnHand: 8,   reorderPoint: 20, binLocation: "A-01", status: "Low Stock" },
    { productVariantId: "PV002", variantSku: "UC-002",  productName: "USB-C Hub",             qtyOnHand: 42,  reorderPoint: 15, binLocation: "A-02", status: "Overstock" },
    { productVariantId: "PV005", variantSku: "WC-005",  productName: "Webcam HD",             qtyOnHand: 25,  reorderPoint: 12, binLocation: "B-01", status: "In Stock" },
    { productVariantId: "PV010", variantSku: "MW-010",  productName: "Monitor 27\" 4K",       qtyOnHand: 3,   reorderPoint: 5,  binLocation: "C-03", status: "Low Stock" },
    { productVariantId: "PV007", variantSku: "ET-007",  productName: "Ethernet Cable 5m",     qtyOnHand: 180, reorderPoint: 50, binLocation: "D-01", status: "Overstock" },
  ],
  W2: [
    { productVariantId: "PV003", variantSku: "MK-003",  productName: "Mechanical Keyboard",   qtyOnHand: 6,   reorderPoint: 10, binLocation: "A-01", status: "Low Stock" },
    { productVariantId: "PV004", variantSku: "MS-004",  productName: "Monitor Stand",         qtyOnHand: 12,  reorderPoint: 8,  binLocation: "B-02", status: "In Stock" },
    { productVariantId: "PV009", variantSku: "LP-009",  productName: "Laptop Stand",          qtyOnHand: 38,  reorderPoint: 15, binLocation: "B-03", status: "Overstock" },
  ],
  W3: [
    { productVariantId: "PV006", variantSku: "HS-006",  productName: "Headset Pro",           qtyOnHand: 4,   reorderPoint: 10, binLocation: "A-01", status: "Low Stock" },
    { productVariantId: "PV008", variantSku: "SW-008",  productName: "Network Switch 8-Port", qtyOnHand: 9,   reorderPoint: 5,  binLocation: "A-02", status: "In Stock" },
  ],
};

// ── Transactions ──────────────────────────────────────────────────────────────

export const transactions = [
  { id: "T001", type: "Sale",       productName: "Wireless Mouse",        quantity: -5,  warehouseName: "Main Warehouse", clerkName: "Cj Obi",  timestamp: "2026-04-06T09:14:00Z" },
  { id: "T002", type: "Receipt",    productName: "USB-C Hub",             quantity: 20,  warehouseName: "Main Warehouse", clerkName: "Cj Obi",  timestamp: "2026-04-06T08:45:00Z" },
  { id: "T003", type: "Sale",       productName: "Mechanical Keyboard",   quantity: -2,  warehouseName: "East Wing",      clerkName: "Cj Obi",  timestamp: "2026-04-05T17:30:00Z" },
  { id: "T004", type: "Adjustment", productName: "Monitor Stand",         quantity: -1,  warehouseName: "East Wing",      clerkName: "Cj Obi",  timestamp: "2026-04-05T15:10:00Z" },
  { id: "T005", type: "Receipt",    productName: "Webcam HD",             quantity: 15,  warehouseName: "Main Warehouse", clerkName: "Cj Obi",  timestamp: "2026-04-04T11:22:00Z" },
  { id: "T006", type: "Return",     productName: "Headset Pro",           quantity: 1,   warehouseName: "Storage Annex",  clerkName: "Cj Obi",  timestamp: "2026-04-04T10:05:00Z" },
];

// ── Purchase Orders ───────────────────────────────────────────────────────────

export const purchaseOrders = [
  { id: "PO-001", supplierName: "TechSupply Co.",  orderDate: "2026-04-01", expectedDelivery: "2026-04-10", status: "Pending",   totalAmount: 2400.00 },
  { id: "PO-002", supplierName: "Office Depot",    orderDate: "2026-04-02", expectedDelivery: "2026-04-09", status: "Pending",   totalAmount: 850.00  },
  { id: "PO-003", supplierName: "NetGear Direct",  orderDate: "2026-03-28", expectedDelivery: "2026-04-05", status: "Received",  totalAmount: 1200.00 },
  { id: "PO-004", supplierName: "TechSupply Co.",  orderDate: "2026-03-20", expectedDelivery: "2026-03-30", status: "Received",  totalAmount: 3100.00 },
];

// ── Reorder Suggestions ───────────────────────────────────────────────────────

export const reorderSuggestions = [
  { id: "RS-001", productName: "Wireless Mouse",      warehouseName: "Main Warehouse", suggestedQty: 30, status: "Pending"  },
  { id: "RS-002", productName: "Mechanical Keyboard", warehouseName: "East Wing",      suggestedQty: 15, status: "Pending"  },
  { id: "RS-003", productName: "Monitor 27\" 4K",     warehouseName: "Main Warehouse", suggestedQty: 10, status: "Pending"  },
  { id: "RS-004", productName: "Headset Pro",         warehouseName: "Storage Annex",  suggestedQty: 12, status: "Approved" },
];
