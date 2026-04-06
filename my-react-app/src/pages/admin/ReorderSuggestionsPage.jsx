import { useState } from "react";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { toast } from "sonner";
import { reorderSuggestions as initialSuggestions } from "@/data/mockData";

const statusClass = (s) => {
  if (s === "Pending")   return "bg-yellow-50 text-yellow-700 border-yellow-200";
  if (s === "Converted") return "bg-green-50 text-green-700 border-green-200";
  return "bg-gray-100 text-gray-500 border-gray-200";
};

export default function ReorderSuggestionsPage() {
  const [items, setItems] = useState(initialSuggestions);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dismissId, setDismissId] = useState(null);

  const filtered = items.filter((r) => statusFilter === "all" || r.status === statusFilter);

  const convert = (id) => {
    setItems((prev) => prev.map((r) => r.id === id ? { ...r, status: "Converted" } : r));
    toast.success(`Suggestion ${id} converted to PO`);
  };

  const dismiss = () => {
    if (!dismissId) return;
    setItems((prev) => prev.map((r) => r.id === dismissId ? { ...r, status: "Dismissed" } : r));
    toast.success("Suggestion dismissed");
    setDismissId(null);
  };

  const exportXLSX = () => {
    const data = filtered.map((r) => ({
      Product: r.productName,
      Warehouse: r.warehouseName,
      "Suggested Qty": r.suggestedQty,
      Supplier: r.preferredSupplier,
      Generated: new Date(r.generatedAt).toLocaleDateString(),
      Status: r.status,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reorder Suggestions");
    XLSX.writeFile(wb, "reorder-suggestions.xlsx");
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="w-[160px]">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Converted">Converted</SelectItem>
              <SelectItem value="Dismissed">Dismissed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3">Product</th>
              <th className="hidden sm:table-cell px-4 py-3">Warehouse</th>
              <th className="px-4 py-3 text-right">Suggested Qty</th>
              <th className="hidden md:table-cell px-4 py-3">Generated</th>
              <th className="hidden lg:table-cell px-4 py-3">Supplier</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">No suggestions found.</td>
              </tr>
            )}
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">{r.productName}</td>
                <td className="hidden sm:table-cell px-4 py-3 text-gray-500">{r.warehouseName}</td>
                <td className="px-4 py-3 text-right font-mono text-gray-700">{r.suggestedQty}</td>
                <td className="hidden md:table-cell px-4 py-3 text-xs text-gray-400">
                  {new Date(r.generatedAt).toLocaleDateString()}
                </td>
                <td className="hidden lg:table-cell px-4 py-3 text-gray-500">{r.preferredSupplier}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusClass(r.status)}`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {r.status === "Pending" && (
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => convert(r.id)}
                        className="rounded-md px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        Convert
                      </button>
                      <button
                        onClick={() => setDismissId(r.id)}
                        className="rounded-md px-2.5 py-1 text-xs font-medium text-gray-400 hover:bg-gray-100 transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Export */}
      <div className="flex justify-end">
        <button
          onClick={exportXLSX}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <Download className="h-4 w-4 text-blue-500" />
          Export
        </button>
      </div>

      <ConfirmDialog
        open={!!dismissId}
        onOpenChange={() => setDismissId(null)}
        title="Dismiss Suggestion"
        description="Are you sure you want to dismiss this reorder suggestion?"
        onConfirm={dismiss}
        confirmLabel="Dismiss"
        destructive={false}
      />
    </div>
  );
}
