import { useState } from "react";

const mockReorders = [
  { id: 1, productName: "Laptop", currentQty: 3, reorderPoint: 5, suggestedQty: 20, status: "Pending" },
  { id: 2, productName: "T-Shirt", currentQty: 8, reorderPoint: 10, suggestedQty: 50, status: "Pending" },
  { id: 3, productName: "Coffee Beans", currentQty: 2, reorderPoint: 15, suggestedQty: 100, status: "Dismissed" },
  { id: 4, productName: "Hammer", currentQty: 1, reorderPoint: 5, suggestedQty: 25, status: "Converted to Order" },
];

export default function ReordersPage() {
  const [reorders, setReorders] = useState(mockReorders);
  const [filter, setFilter] = useState("All");

  const filtered = filter === "All" ? reorders : reorders.filter((r) => r.status === filter);

  function handleDismiss(id) {
    if (confirm("Dismiss this reorder suggestion?")) {
      setReorders(reorders.map((r) => r.id === id ? { ...r, status: "Dismissed" } : r));
    }
  }

  function handleConvert(id) {
    if (confirm("Convert this suggestion into a Purchase Order?")) {
      setReorders(reorders.map((r) => r.id === id ? { ...r, status: "Converted to Order" } : r));
    }
  }

  const statusColors = {
    "Pending": "bg-yellow-100 text-yellow-700",
    "Dismissed": "bg-gray-100 text-gray-500",
    "Converted to Order": "bg-green-100 text-green-700",
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Reorder Suggestions</h1>
        <select
          className="border rounded px-3 py-2 text-sm"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="All">All</option>
          <option value="Pending">Pending</option>
          <option value="Dismissed">Dismissed</option>
          <option value="Converted to Order">Converted to Order</option>
        </select>
      </div>

      <table className="w-full border-collapse bg-white rounded-lg shadow">
        <thead>
          <tr className="bg-gray-50 text-left text-sm text-gray-600">
            <th className="px-4 py-3">Product</th>
            <th className="px-4 py-3">Current Qty</th>
            <th className="px-4 py-3">Reorder Point</th>
            <th className="px-4 py-3">Suggested Qty</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((r) => (
            <tr key={r.id} className="border-t text-sm">
              <td className="px-4 py-3">{r.productName}</td>
              <td className="px-4 py-3">{r.currentQty}</td>
              <td className="px-4 py-3">{r.reorderPoint}</td>
              <td className="px-4 py-3">{r.suggestedQty}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[r.status]}`}>
                  {r.status}
                </span>
              </td>
              <td className="px-4 py-3 flex gap-2">
                {r.status === "Pending" && (
                  <>
                    <button onClick={() => handleDismiss(r.id)} className="text-gray-500 hover:underline text-xs">
                      Dismiss
                    </button>
                    <button onClick={() => handleConvert(r.id)} className="text-blue-600 hover:underline text-xs">
                      Create Order
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}