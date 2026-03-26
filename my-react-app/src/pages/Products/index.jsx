import { useState } from 'react';
import { Search, Plus, Upload, Pencil, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import BulkImportModal from '../../components/common/BulkImportModal';

// ── Mock data ────────────────────────────────────────────────────────────────

const INITIAL_PRODUCTS = [
  {
    id: 1,
    name: 'Wireless Mouse',
    sku: 'WM-001',
    category: 'Peripherals',
    status: 'Active',
    variants: [
      { id: 'v1', label: 'Black', isActive: true },
      { id: 'v2', label: 'White', isActive: true },
    ],
  },
  {
    id: 2,
    name: 'Mechanical Keyboard',
    sku: 'MK-002',
    category: 'Peripherals',
    status: 'Active',
    variants: [
      { id: 'v3', label: 'TKL Brown Switch', isActive: true },
      { id: 'v4', label: 'Full Red Switch',  isActive: false },
    ],
  },
  {
    id: 3,
    name: 'USB-C Hub',
    sku: 'UH-003',
    category: 'Accessories',
    status: 'Inactive',
    variants: [
      { id: 'v5', label: '7-Port', isActive: false },
    ],
  },
  {
    id: 4,
    name: 'Monitor Stand',
    sku: 'MS-004',
    category: 'Furniture',
    status: 'Active',
    variants: [],
  },
];

const CATEGORIES = ['All', 'Peripherals', 'Accessories', 'Furniture', 'Electronics', 'Networking'];
const STATUSES   = ['All', 'Active', 'Inactive'];

const EMPTY_FORM = { name: '', sku: '', category: 'Electronics', status: 'Active' };

// ── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const cls = status === 'Active'
    ? 'bg-green-100 text-green-700'
    : 'bg-gray-100 text-gray-500';
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}

// ── Product modal form ────────────────────────────────────────────────────────

function ProductModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial ?? EMPTY_FORM);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.sku.trim()) return;
    onSave(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {initial ? 'Edit Product' : 'Add Product'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
            <input
              name="sku"
              value={form.sku}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              {initial ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Expandable variant row ────────────────────────────────────────────────────

function VariantRow({ variants, onToggleVariant }) {
  if (variants.length === 0) {
    return (
      <tr>
        <td colSpan={5} className="px-10 py-2 text-xs text-gray-400 italic bg-gray-50">
          No variants
        </td>
      </tr>
    );
  }
  return (
    <tr className="bg-gray-50">
      <td colSpan={5} className="px-10 py-2">
        <div className="flex flex-wrap gap-2">
          {variants.map((v) => (
            <button
              key={v.id}
              onClick={() => onToggleVariant(v.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                v.isActive
                  ? 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100'
                  : 'bg-gray-100 border-gray-300 text-gray-400 hover:bg-gray-200'
              }`}
            >
              {v.label} · {v.isActive ? 'Active' : 'Inactive'}
            </button>
          ))}
        </div>
      </td>
    </tr>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Products() {
  const [products, setProducts]         = useState(INITIAL_PRODUCTS);
  const [search, setSearch]             = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [expandedId, setExpandedId]     = useState(null);
  const [editTarget, setEditTarget]     = useState(null);   // product object | 'new' | null
  const [deleteTarget, setDeleteTarget] = useState(null);   // product id | null
  const [showImport, setShowImport]     = useState(false);

  // ── Filtered list ──────────────────────────────────────────────────────────

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === 'All' || p.category === categoryFilter;
    const matchStatus   = statusFilter   === 'All' || p.status   === statusFilter;
    return matchSearch && matchCategory && matchStatus;
  });

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleSave(form) {
    if (editTarget === 'new') {
      setProducts((prev) => [
        ...prev,
        { ...form, id: Date.now(), variants: [] },
      ]);
    } else {
      setProducts((prev) =>
        prev.map((p) => (p.id === editTarget.id ? { ...p, ...form } : p))
      );
    }
    setEditTarget(null);
  }

  function handleDelete() {
    setProducts((prev) => prev.filter((p) => p.id !== deleteTarget));
    setDeleteTarget(null);
  }

  function handleToggleVariant(productId, variantId) {
    setProducts((prev) =>
      prev.map((p) =>
        p.id !== productId
          ? p
          : {
              ...p,
              variants: p.variants.map((v) =>
                v.id === variantId ? { ...v, isActive: !v.isActive } : v
              ),
            }
      )
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <Upload className="h-4 w-4" />
            Bulk Import
          </button>
          <button
            onClick={() => setEditTarget('new')}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or SKU…"
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-100">
              <th className="px-4 py-3 w-6" />
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">
                  No products found.
                </td>
              </tr>
            )}
            {filtered.map((product) => (
              <>
                <tr
                  key={product.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() =>
                    setExpandedId((prev) => (prev === product.id ? null : product.id))
                  }
                >
                  <td className="px-4 py-3 text-gray-400">
                    {expandedId === product.id
                      ? <ChevronDown className="h-4 w-4" />
                      : <ChevronRight className="h-4 w-4" />}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">{product.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{product.sku}</td>
                  <td className="px-4 py-3 text-gray-600">{product.category}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={product.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div
                      className="flex justify-end gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setEditTarget(product)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(product.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedId === product.id && (
                  <VariantRow
                    key={`${product.id}-variants`}
                    variants={product.variants}
                    onToggleVariant={(vid) => handleToggleVariant(product.id, vid)}
                  />
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {editTarget !== null && (
        <ProductModal
          initial={editTarget === 'new' ? undefined : editTarget}
          onSave={handleSave}
          onClose={() => setEditTarget(null)}
        />
      )}

      {deleteTarget !== null && (
        <ConfirmDialog
          title="Delete Product"
          message="Are you sure you want to delete this product? This action cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {showImport && (
        <BulkImportModal
          onClose={() => setShowImport(false)}
          onImport={(rows) =>
            setProducts((prev) => [
              ...prev,
              ...rows.map((r) => ({
                id: Date.now() + Math.random(),
                name: r.name,
                sku: r.sku,
                category: r.category,
                status: r.status.charAt(0).toUpperCase() + r.status.slice(1).toLowerCase(),
                variants: [],
              })),
            ])
          }
        />
      )}
    </div>
  );
}
