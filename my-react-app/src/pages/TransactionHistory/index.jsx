import { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Download, ChevronLeft, ChevronRight } from 'lucide-react';

// ── Mock data ────────────────────────────────────────────────────────────────

const ALL_TRANSACTIONS = [
  { id: 'TXN-001', date: '2026-03-24', type: 'Sale',     product: 'Wireless Mouse',      qty: 5,  warehouse: 'Main',    note: '' },
  { id: 'TXN-002', date: '2026-03-24', type: 'Restock',  product: 'USB-C Hub',            qty: 20, warehouse: 'East',    note: 'Supplier delivery' },
  { id: 'TXN-003', date: '2026-03-23', type: 'Sale',     product: 'Mechanical Keyboard',  qty: 2,  warehouse: 'Main',    note: '' },
  { id: 'TXN-004', date: '2026-03-23', type: 'Transfer', product: 'Monitor Stand',        qty: 4,  warehouse: 'West',    note: 'Main → West' },
  { id: 'TXN-005', date: '2026-03-22', type: 'Restock',  product: 'Webcam HD',            qty: 15, warehouse: 'Main',    note: '' },
  { id: 'TXN-006', date: '2026-03-22', type: 'Adjustment', product: 'USB-C Hub',          qty: -3, warehouse: 'East',    note: 'Damaged units removed' },
  { id: 'TXN-007', date: '2026-03-21', type: 'Sale',     product: 'Wireless Mouse',       qty: 8,  warehouse: 'Main',    note: '' },
  { id: 'TXN-008', date: '2026-03-21', type: 'Transfer', product: 'Webcam HD',            qty: 6,  warehouse: 'West',    note: 'East → West' },
  { id: 'TXN-009', date: '2026-03-20', type: 'Sale',     product: 'Monitor Stand',        qty: 1,  warehouse: 'East',    note: '' },
  { id: 'TXN-010', date: '2026-03-20', type: 'Restock',  product: 'Mechanical Keyboard',  qty: 10, warehouse: 'Main',    note: 'Quarterly restock' },
  { id: 'TXN-011', date: '2026-03-19', type: 'Sale',     product: 'USB-C Hub',            qty: 3,  warehouse: 'West',    note: '' },
  { id: 'TXN-012', date: '2026-03-19', type: 'Adjustment', product: 'Wireless Mouse',     qty: -1, warehouse: 'Main',    note: 'Inventory count correction' },
  { id: 'TXN-013', date: '2026-03-18', type: 'Restock',  product: 'Webcam HD',            qty: 25, warehouse: 'East',    note: '' },
  { id: 'TXN-014', date: '2026-03-18', type: 'Sale',     product: 'Mechanical Keyboard',  qty: 4,  warehouse: 'Main',    note: '' },
  { id: 'TXN-015', date: '2026-03-17', type: 'Transfer', product: 'Monitor Stand',        qty: 2,  warehouse: 'Main',    note: 'West → Main return' },
];

const TYPES      = ['All', 'Sale', 'Restock', 'Transfer', 'Adjustment'];
const WAREHOUSES = ['All', 'Main', 'East', 'West'];
const PAGE_SIZE  = 8;

// ── Type badge ────────────────────────────────────────────────────────────────

const TYPE_COLORS = {
  Sale:       'bg-blue-100 text-blue-700',
  Restock:    'bg-green-100 text-green-700',
  Transfer:   'bg-purple-100 text-purple-700',
  Adjustment: 'bg-orange-100 text-orange-700',
};

function TypeBadge({ type }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[type] ?? 'bg-gray-100 text-gray-500'}`}>
      {type}
    </span>
  );
}

// ── Excel export ──────────────────────────────────────────────────────────────

function exportToXLSX(rows) {
  const data = rows.map((t) => ({
    'Transaction ID': t.id,
    Date:             t.date,
    Type:             t.type,
    Product:          t.product,
    Quantity:         t.qty,
    Warehouse:        t.warehouse,
    Note:             t.note,
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buf], { type: 'application/octet-stream' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'transactions.xlsx';
  a.click();
  URL.revokeObjectURL(url);
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TransactionHistory() {
  const [dateFrom,       setDateFrom]       = useState('');
  const [dateTo,         setDateTo]         = useState('');
  const [typeFilter,     setTypeFilter]     = useState('All');
  const [warehouseFilter, setWarehouseFilter] = useState('All');
  const [page,           setPage]           = useState(1);

  // ── Filtering ──────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    return ALL_TRANSACTIONS.filter((t) => {
      if (dateFrom && t.date < dateFrom) return false;
      if (dateTo   && t.date > dateTo)   return false;
      if (typeFilter     !== 'All' && t.type      !== typeFilter)     return false;
      if (warehouseFilter !== 'All' && t.warehouse !== warehouseFilter) return false;
      return true;
    });
  }, [dateFrom, dateTo, typeFilter, warehouseFilter]);

  // Reset to page 1 whenever filters change
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageRows   = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function handleFilterChange(setter) {
    return (e) => {
      setter(e.target.value);
      setPage(1);
    };
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
        <button
          onClick={() => exportToXLSX(filtered)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
        >
          <Download className="h-4 w-4" />
          Export to Excel
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={handleFilterChange(setDateFrom)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={handleFilterChange(setDateTo)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium">Type</label>
          <select
            value={typeFilter}
            onChange={handleFilterChange(setTypeFilter)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium">Warehouse</label>
          <select
            value={warehouseFilter}
            onChange={handleFilterChange(setWarehouseFilter)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {WAREHOUSES.map((w) => <option key={w}>{w}</option>)}
          </select>
        </div>
        {(dateFrom || dateTo || typeFilter !== 'All' || warehouseFilter !== 'All') && (
          <div className="flex flex-col justify-end">
            <button
              onClick={() => {
                setDateFrom('');
                setDateTo('');
                setTypeFilter('All');
                setWarehouseFilter('All');
                setPage(1);
              }}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-100">
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Qty</th>
              <th className="px-4 py-3 font-medium">Warehouse</th>
              <th className="px-4 py-3 font-medium">Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">
                  No transactions match the current filters.
                </td>
              </tr>
            )}
            {pageRows.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-gray-400">{t.id}</td>
                <td className="px-4 py-3 text-gray-600">{t.date}</td>
                <td className="px-4 py-3"><TypeBadge type={t.type} /></td>
                <td className="px-4 py-3 text-gray-800 font-medium">{t.product}</td>
                <td className={`px-4 py-3 font-medium ${t.qty < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                  {t.qty > 0 ? `+${t.qty}` : t.qty}
                </td>
                <td className="px-4 py-3 text-gray-600">{t.warehouse}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{t.note || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          {filtered.length === 0
            ? 'No results'
            : `Showing ${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(safePage * PAGE_SIZE, filtered.length)} of ${filtered.length}`}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => setPage(n)}
              className={`h-7 w-7 rounded text-xs font-medium transition-colors ${
                n === safePage
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
