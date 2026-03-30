import { useState } from "react";

const mockProducts = [
  { id: 1, name: "Laptop", sku: "ELEC-001", category: "Electronics", status: "Active", variants: [{ id: 1, size: "15inch", color: "Silver", price: 999, qty: 10 }] },
  { id: 2, name: "T-Shirt", sku: "CLTH-001", category: "Clothing", status: "Active", variants: [{ id: 2, size: "M", color: "Blue", price: 25, qty: 50 }] },
  { id: 3, name: "Coffee Beans", sku: "FOOD-001", category: "Food", status: "Active", variants: [{ id: 3, size: "1kg", color: "N/A", price: 15, qty: 100 }] },
  { id: 4, name: "Hammer", sku: "TOOL-001", category: "Tools", status: "Inactive", variants: [{ id: 4, size: "Standard", color: "Red", price: 20, qty: 30 }] },
];

export default function ProductsPage() {
  const [products, setProducts] = useState(mockProducts);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", sku: "", category: "", status: "Active" });

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCategory = filterCategory ? p.category === filterCategory : true;
    return matchSearch && matchCategory;
  });

  function openAdd() {
    setEditing(null);
    setForm({ name: "", sku: "", category: "", status: "Active" });
    setShowModal(true);
  }

  function openEdit(product) {
    setEditing(product);
    setForm({ name: product.name, sku: product.sku, category: product.category, status: product.status });
    setShowModal(true);
  }

  function handleSave() {
    if (editing) {
      setProducts(products.map((p) => p.id === editing.id ? { ...p, ...form } : p));
    } else {
      setProducts([...products, { id: Date.now(), ...form, variants: [] }]);
    }
    setShowModal(false);
  }

  function handleDelete(id) {
    if (confirm("Delete this product?")) {
      setProducts(products.filter((p) => p.id !== id));
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Products</h1>
        <button onClick={openAdd} className="bg-primary text-white px-4 py-2 rounded-md text-sm">
          + Add Product
        </button>
      </div>

      <div className="flex gap-3 mb-4">
        <input
          className="border rounded px-3 py-2 text-sm w-64"
          placeholder="Search by name or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="border rounded px-3 py-2 text-sm"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {["Electronics", "Clothing", "Food", "Tools", "Office"].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <table className="w-full border-collapse bg-white rounded-lg shadow">
        <thead>
          <tr className="bg-gray-50 text-left text-sm text-gray-600">
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">SKU</th>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((p) => (
            <>
              <tr key={p.id} className="border-t text-sm">
                <td className="px-4 py-3">{p.name}</td>
                <td className="px-4 py-3">{p.sku}</td>
                <td className="px-4 py-3">{p.category}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3 flex gap-2">
                  <button onClick={() => setExpandedId(expandedId === p.id ? null : p.id)} className="text-gray-500 hover:underline text-xs">
                    {expandedId === p.id ? "Hide Variants" : "Show Variants"}
                  </button>
                  <button onClick={() => openEdit(p)} className="text-blue-600 hover:underline">Edit</button>
                  <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
              {expandedId === p.id && (
                <tr className="bg-gray-50">
                  <td colSpan={5} className="px-8 py-3">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-gray-500">
                          <th className="text-left py-1">Size</th>
                          <th className="text-left py-1">Color</th>
                          <th className="text-left py-1">Price</th>
                          <th className="text-left py-1">Qty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {p.variants.map((v) => (
                          <tr key={v.id}>
                            <td className="py-1">{v.size}</td>
                            <td className="py-1">{v.color}</td>
                            <td className="py-1">${v.price}</td>
                            <td className="py-1">{v.qty}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <h2 className="text-lg font-semibold mb-4">{editing ? "Edit Product" : "Add Product"}</h2>
            {["name", "sku", "category"].map((field) => (
              <input
                key={field}
                className="w-full border rounded px-3 py-2 mb-3 text-sm"
                placeholder={field}
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              />
            ))}
            <select
              className="w-full border rounded px-3 py-2 mb-4 text-sm"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border rounded">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 text-sm bg-primary text-white rounded">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}