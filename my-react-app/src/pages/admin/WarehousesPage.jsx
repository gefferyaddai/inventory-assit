import { useState, useEffect, useMemo } from "react";
import { Plus, ArrowLeft, MoreHorizontal, Download, Search } from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { api } from "@/services/api";
import { TAX_REGIONS } from "@/data/taxRegions";

function normalizeWarehouse(w) {
  return {
    id:            w.WarehouseID,
    name:          w.Name,
    location:      w.Address || "",
    address:       w.Address || "",
    capacity:      Number(w.Capacity) || 0,
    managerName:   w.ManagerName || "",
    taxRegion:     w.TaxRegion || "",
    assignedAdmins: [],
  };
}

function normalizeStock(s) {
  return {
    productVariantId: s.ProductVariantID,
    variantSku:       s.SKU || "",
    productName:      s.ProductName || "",
    color:            s.Color || "",
    size:             s.Size || "",
    qtyOnHand:        Number(s.QuantityOnHand) || 0,
    binLocation:      s.BinLocation || "",
    reorderPoint:     Number(s.ReorderPoint) || 0,
    status:           s.status || "In Stock",
  };
}

const stockStatusClass = (s) => {
  if (s === "Low Stock") return "bg-yellow-50 text-yellow-700 border-yellow-200";
  if (s === "Overstock")  return "bg-blue-50 text-blue-700 border-blue-200";
  return "bg-green-50 text-green-700 border-green-200";
};

const EMPTY_FORM = { name: "", address: "", capacity: "", managerName: "", taxRegion: "" };

function TaxRegionSelect({ value, onChange }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q
      ? TAX_REGIONS.filter(
          (r) => r.region.toLowerCase().includes(q) || r.provinceCode.toLowerCase().includes(q)
        )
      : TAX_REGIONS;
  }, [search]);

  const selected = TAX_REGIONS.find((r) => r.provinceCode === value);

  return (
    <div className="space-y-1.5">
      <div className="relative flex items-center border border-input rounded-md bg-background focus-within:ring-1 focus-within:ring-ring">
        <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={selected ? `${selected.region} (${selected.provinceCode})` : "Search province / territory…"}
          className="h-9 pl-8 pr-3 w-full text-sm bg-transparent outline-none placeholder:text-muted-foreground"
        />
      </div>
      <div className="max-h-40 overflow-y-auto rounded-md border border-border divide-y divide-border">
        <button
          type="button"
          onClick={() => { onChange(""); setSearch(""); }}
          className={`flex items-center justify-between w-full px-3 py-2 text-sm text-left hover:bg-accent/5 transition-colors ${!value ? "bg-accent/10 text-accent font-medium" : "text-muted-foreground"}`}
        >
          <span>No region set</span>
        </button>
        {filtered.map((r) => (
          <button
            key={r.provinceCode}
            type="button"
            onClick={() => { onChange(r.provinceCode); setSearch(""); }}
            className={`flex items-center justify-between w-full px-3 py-2 text-sm text-left hover:bg-accent/5 transition-colors ${value === r.provinceCode ? "bg-accent/10 text-accent font-medium" : "text-foreground"}`}
          >
            <span>{r.region}</span>
            <span className="text-xs text-muted-foreground font-mono">
              {r.provinceCode} · {r.taxes.map((t) => `${t.code} ${(t.rate * 100).toFixed(2).replace(/\.?0+$/, "")}%`).join(" + ")}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function WarehousesPage() {
  const [items, setItems]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [formOpen, setFormOpen]     = useState(false);
  const [editing, setEditing]       = useState(null);
  const [viewingId, setViewingId]   = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [stockItems, setStockItems] = useState([]);
  const [stockLoading, setStockLoading] = useState(false);

  const fetchWarehouses = async () => {
    try {
      const data = await api.get('/warehouses');
      setItems(data.map(normalizeWarehouse));
    } catch {
      toast.error('Failed to load warehouses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWarehouses(); }, []);

  useEffect(() => {
    if (!viewingId) { setStockItems([]); return; }
    setStockLoading(true);
    api.get(`/warehouses/${viewingId}/stock`)
      .then((data) => setStockItems(data.map(normalizeStock)))
      .catch(() => toast.error('Failed to load stock'))
      .finally(() => setStockLoading(false));
  }, [viewingId]);

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setFormOpen(true); };
  const openEdit = (w) => {
    setEditing(w);
    setForm({
      name:        w.name,
      address:     w.address,
      capacity:    String(w.capacity),
      managerName: w.managerName,
      taxRegion:   w.taxRegion ?? "",
    });
    setFormOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) { toast.error("Warehouse name is required"); return; }
    try {
      const payload = {
        name:        form.name.trim(),
        address:     form.address.trim(),
        capacity:    Number(form.capacity) || null,
        managerName: form.managerName.trim(),
        taxRegion:   form.taxRegion || null,
      };
      if (editing) {
        await api.put(`/warehouses/${editing.id}`, payload);
        toast.success("Warehouse updated");
      } else {
        await api.post('/warehouses', payload);
        toast.success("Warehouse added");
      }
      setFormOpen(false);
      fetchWarehouses();
    } catch (err) {
      toast.error(err.message || 'Failed to save warehouse');
    }
  };

  const viewing = viewingId ? items.find((w) => w.id === viewingId) : null;
  const viewingTaxRegion = viewing?.taxRegion
    ? TAX_REGIONS.find((r) => r.provinceCode === viewing.taxRegion)
    : null;

  const exportXLSX = () => {
    const data = items.map((w) => ({
      Name:         w.name,
      Address:      w.address,
      Capacity:     w.capacity,
      Manager:      w.managerName,
      "Tax Region": w.taxRegion || "—",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Warehouses");
    XLSX.writeFile(wb, "warehouses.xlsx");
  };

  // ── Detail view ─────────────────────────────────────────────────────────────
  if (viewing) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setViewingId(null)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Warehouses
        </button>

        {/* Info card */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">{viewing.name}</h3>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-400">Address:</span> <span className="text-gray-700">{viewing.address || "—"}</span></div>
            <div><span className="text-gray-400">Capacity:</span> <span className="text-gray-700">{(viewing.capacity || 0).toLocaleString()} units</span></div>
            <div><span className="text-gray-400">Manager:</span> <span className="text-gray-700">{viewing.managerName || "—"}</span></div>
            <div className="sm:col-span-2">
              <span className="text-gray-400">Tax Region:</span>{" "}
              {viewingTaxRegion ? (
                <span className="text-gray-700">
                  {viewingTaxRegion.region} ({viewingTaxRegion.provinceCode}) —{" "}
                  {viewingTaxRegion.taxes.map((t) => `${t.code} ${(t.rate * 100).toFixed(2).replace(/\.?0+$/, "")}%`).join(", ")}
                </span>
              ) : (
                <span className="text-gray-400">Not set</span>
              )}
            </div>
          </div>
        </div>

        {/* Stock levels */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100">
            <h4 className="text-sm font-semibold text-gray-800">Stock Levels</h4>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3 text-right">Qty on Hand</th>
                <th className="hidden md:table-cell px-4 py-3">Bin</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stockLoading && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">Loading…</td></tr>
              )}
              {!stockLoading && stockItems.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">No stock records</td></tr>
              )}
              {stockItems.map((s) => (
                <tr key={s.productVariantId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{s.variantSku}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {s.productName}
                    {(s.color || s.size) && (
                      <span className="ml-1.5 text-xs text-gray-400">{[s.color, s.size].filter(Boolean).join(" · ")}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-gray-700">{s.qtyOnHand}</td>
                  <td className="hidden md:table-cell px-4 py-3 text-gray-500">{s.binLocation || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${stockStatusClass(s.status)}`}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ── List view ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Warehouses</h2>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Warehouse
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3">Name</th>
              <th className="hidden sm:table-cell px-4 py-3">Location</th>
              <th className="px-4 py-3 text-right">Capacity</th>
              <th className="hidden md:table-cell px-4 py-3">Manager</th>
              <th className="hidden lg:table-cell px-4 py-3">Tax Region</th>
              <th className="px-4 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
            )}
            {!loading && items.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No warehouses yet.</td></tr>
            )}
            {items.map((w) => {
              const region = w.taxRegion ? TAX_REGIONS.find((r) => r.provinceCode === w.taxRegion) : null;
              return (
                <tr key={w.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{w.name}</td>
                  <td className="hidden sm:table-cell px-4 py-3 text-gray-500">{w.location || "—"}</td>
                  <td className="px-4 py-3 text-right font-mono text-gray-700">{(w.capacity || 0).toLocaleString()}</td>
                  <td className="hidden md:table-cell px-4 py-3 text-gray-500">{w.managerName || "—"}</td>
                  <td className="hidden lg:table-cell px-4 py-3 text-gray-500">
                    {region ? (
                      <span className="inline-flex items-center gap-1">
                        <span className="font-mono text-xs bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">{region.provinceCode}</span>
                        <span>{region.region}</span>
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewingId(w.id)}>View Details</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEdit(w)}>Edit</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
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

      {/* Add / Edit dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Warehouse" : "Add Warehouse"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Main Warehouse" />
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street, City, Province" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Capacity (units)</Label>
                <Input type="number" min="0" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} placeholder="e.g. 5000" />
              </div>
              <div className="space-y-1.5">
                <Label>Manager</Label>
                <Input value={form.managerName} onChange={(e) => setForm({ ...form, managerName: e.target.value })} placeholder="Full name" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Tax Region</Label>
              <TaxRegionSelect
                value={form.taxRegion}
                onChange={(v) => setForm({ ...form, taxRegion: v })}
              />
              {form.taxRegion && (() => {
                const r = TAX_REGIONS.find((x) => x.provinceCode === form.taxRegion);
                return r ? (
                  <p className="text-xs text-muted-foreground">
                    Clerks will see: {r.taxes.map((t) => `${t.code} (${(t.rate * 100).toFixed(2).replace(/\.?0+$/, "")}%)`).join(", ")}
                  </p>
                ) : null;
              })()}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <button
              onClick={save}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Save
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
