import { useState } from "react";

const mockCategories = [
  { id: 1, name: "Electronics", description: "Electronic devices and accessories" },
  { id: 2, name: "Clothing", description: "Apparel and fashion items" },
  { id: 3, name: "Food", description: "Food and beverages" },
  { id: 4, name: "Tools", description: "Hardware and tools" },
  { id: 5, name: "Office", description: "Office supplies and equipment" },
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState(mockCategories);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });

  function openAdd() {
    setEditing(null);
    setForm({ name: "", description: "" });
    setShowModal(true);
  }

  function openEdit(cat) {
    setEditing(cat);
    setForm({ name: cat.name, description: cat.description });
    setShowModal(true);
  }

  function handleSave() {
    if (editing) {
      setCategories(categories.map((c) =>
        c.id === editing.id ? { ...c, ...form } : c
      ));
    } else {
      setCategories([...categories, { id: Date.now(), ...form }]);
    }
    setShowModal(false);
  }

  function handleDelete(id) {
    if (confirm("Delete this category?")) {
      setCategories(categories.filter((c) => c.id !== id));
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Categories</h1>
        <button
          onClick={openAdd}
          className="bg-primary text-white px-4 py-2 rounded-md text-sm"
        >
          + Add Category
        </button>
      </div>

      <table className="w-full border-collapse bg-white rounded-lg shadow">
        <thead>
          <tr className="bg-gray-50 text-left text-sm text-gray-600">
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Description</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((cat) => (
            <tr key={cat.id} className="border-t text-sm">
              <td className="px-4 py-3">{cat.name}</td>
              <td className="px-4 py-3">{cat.description}</td>
              <td className="px-4 py-3 flex gap-2">
                <button
                  onClick={() => openEdit(cat)}
                  className="text-blue-600 hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="text-red-600 hover:underline"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <h2 className="text-lg font-semibold mb-4">
              {editing ? "Edit Category" : "Add Category"}
            </h2>
            <input
              className="w-full border rounded px-3 py-2 mb-3 text-sm"
              placeholder="Category name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              className="w-full border rounded px-3 py-2 mb-4 text-sm"
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm border rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm bg-primary text-white rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}