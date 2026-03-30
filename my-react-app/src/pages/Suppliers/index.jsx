import { useState } from "react";

const mockSuppliers = [
  { id: 1, name: "TechCorp", contactPerson: "Alice Johnson", email: "alice@techcorp.com", phone: "403-555-0101" },
  { id: 2, name: "FashionHub", contactPerson: "Bob Smith", email: "bob@fashionhub.com", phone: "403-555-0102" },
  { id: 3, name: "FoodCo", contactPerson: "Carol White", email: "carol@foodco.com", phone: "403-555-0103" },
  { id: 4, name: "ToolMart", contactPerson: "David Brown", email: "david@toolmart.com", phone: "403-555-0104" },
  { id: 5, name: "OfficePlus", contactPerson: "Eva Green", email: "eva@officeplus.com", phone: "403-555-0105" },
];

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState(mockSuppliers);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", contactPerson: "", email: "", phone: "" });

  function openAdd() {
    setEditing(null);
    setForm({ name: "", contactPerson: "", email: "", phone: "" });
    setShowModal(true);
  }

  function openEdit(supplier) {
    setEditing(supplier);
    setForm({ name: supplier.name, contactPerson: supplier.contactPerson, email: supplier.email, phone: supplier.phone });
    setShowModal(true);
  }

  function handleSave() {
    if (editing) {
      setSuppliers(suppliers.map((s) => s.id === editing.id ? { ...s, ...form } : s));
    } else {
      setSuppliers([...suppliers, { id: Date.now(), ...form }]);
    }
    setShowModal(false);
  }

  function handleDelete(id) {
    if (confirm("Delete this supplier?")) {
      setSuppliers(suppliers.filter((s) => s.id !== id));
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Suppliers</h1>
        <button onClick={openAdd} className="bg-primary text-white px-4 py-2 rounded-md text-sm">
          + Add Supplier
        </button>
      </div>

      <table className="w-full border-collapse bg-white rounded-lg shadow">
        <thead>
          <tr className="bg-gray-50 text-left text-sm text-gray-600">
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Contact Person</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Phone</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map((s) => (
            <tr key={s.id} className="border-t text-sm">
              <td className="px-4 py-3">{s.name}</td>
              <td className="px-4 py-3">{s.contactPerson}</td>
              <td className="px-4 py-3">{s.email}</td>
              <td className="px-4 py-3">{s.phone}</td>
              <td className="px-4 py-3 flex gap-2">
                <button onClick={() => openEdit(s)} className="text-blue-600 hover:underline">Edit</button>
                <button onClick={() => handleDelete(s.id)} className="text-red-600 hover:underline">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <h2 className="text-lg font-semibold mb-4">{editing ? "Edit Supplier" : "Add Supplier"}</h2>
            {["name", "contactPerson", "email", "phone"].map((field) => (
              <input
                key={field}
                className="w-full border rounded px-3 py-2 mb-3 text-sm"
                placeholder={field}
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              />
            ))}
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