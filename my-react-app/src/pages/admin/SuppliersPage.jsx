import { useState } from "react";
import { Plus, MoreHorizontal, ArrowLeft, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { suppliers as initialSuppliers, supplierProducts, products, purchaseOrders } from "@/data/mockData";

const EMPTY_FORM = { companyName: "", contactName: "", email: "", phone: "", address: "", leadTimeDays: "" };

const poStatusClass = (s) => {
  if (s === "Pending")  return "bg-yellow-50 text-yellow-700 border-yellow-200";
  if (s === "Received") return "bg-green-50 text-green-700 border-green-200";
  return "bg-gray-50 text-gray-600 border-gray-200";
};

export default function SuppliersPage() {
  const [items, setItems] = useState(initialSuppliers);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewingId, setViewingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setFormOpen(true); };
  const openEdit = (s) => {
    setEditing(s);
    setForm({ companyName: s.companyName, contactName: s.contactName, email: s.email, phone: s.phone, address: s.address, leadTimeDays: String(s.leadTimeDays) });
    setFormOpen(true);
  };

  const save = () => {
    if (!form.companyName.trim()) { toast.error("Company name is required"); return; }
    if (editing) {
      setItems((prev) => prev.map((s) => s.id === editing.id ? { ...s, ...form, leadTimeDays: Number(form.leadTimeDays) } : s));
      toast.success("Supplier updated");
    } else {
      setItems((prev) => [...prev, { id: `sup-${Date.now()}`, ...form, leadTimeDays: Number(form.leadTimeDays) }]);
      toast.success("Supplier added");
    }
    setFormOpen(false);
  };

  const viewing = viewingId ? items.find((s) => s.id === viewingId) : null;
  const viewingProductIds = viewingId ? (supplierProducts[viewingId] || []) : [];
  const viewingProductList = viewingProductIds.map((pid) => products.find((p) => p.id === pid)).filter(Boolean);
  const viewingOrders = viewingId ? purchaseOrders.filter((po) => po.supplierId === viewingId) : [];

  const exportXLSX = () => {
    const data = items.map((s) => ({
      Company: s.companyName, Contact: s.contactName, Email: s.email,
      Phone: s.phone, Address: s.address, "Lead Time (days)": s.leadTimeDays,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Suppliers");
    XLSX.writeFile(wb, "suppliers.xlsx");
  };

  // ── Detail view ─────────────────────────────────────────────────────────────
  if (viewing) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setViewingId(null)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Suppliers
        </button>

        {/* Info card */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">{viewing.companyName}</h3>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-400">Contact:</span> <span className="text-gray-700">{viewing.contactName}</span></div>
            <div><span className="text-gray-400">Email:</span> <span className="text-gray-700">{viewing.email}</span></div>
            <div><span className="text-gray-400">Phone:</span> <span className="text-gray-700">{viewing.phone}</span></div>
            <div><span className="text-gray-400">Lead Time:</span> <span className="text-gray-700">{viewing.leadTimeDays} days</span></div>
            <div className="sm:col-span-2"><span className="text-gray-400">Address:</span> <span className="text-gray-700">{viewing.address}</span></div>
          </div>
        </div>

        {/* Products Supplied */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100">
            <h4 className="text-sm font-semibold text-gray-800">Products Supplied</h4>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Name</th>
                <th className="hidden sm:table-cell px-4 py-3">Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {viewingProductList.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400">No products linked</td></tr>
              ) : viewingProductList.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{p.sku}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                  <td className="hidden sm:table-cell px-4 py-3 text-gray-500">{p.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Purchase Orders */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100">
            <h4 className="text-sm font-semibold text-gray-800">Purchase Orders</h4>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {viewingOrders.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">No orders</td></tr>
              ) : viewingOrders.map((po) => (
                <tr key={po.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{po.id}</td>
                  <td className="px-4 py-3 text-gray-500">{po.orderDate}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${poStatusClass(po.status)}`}>
                      {po.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-gray-700">${po.totalAmount.toFixed(2)}</td>
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
        <h2 className="text-lg font-semibold text-gray-900">Suppliers</h2>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Supplier
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3">Company</th>
              <th className="hidden sm:table-cell px-4 py-3">Contact</th>
              <th className="hidden md:table-cell px-4 py-3">Email</th>
              <th className="hidden lg:table-cell px-4 py-3">Phone</th>
              <th className="px-4 py-3 text-right">Lead Time</th>
              <th className="px-4 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No suppliers yet.</td></tr>
            )}
            {items.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">{s.companyName}</td>
                <td className="hidden sm:table-cell px-4 py-3 text-gray-500">{s.contactName}</td>
                <td className="hidden md:table-cell px-4 py-3 text-gray-500">{s.email}</td>
                <td className="hidden lg:table-cell px-4 py-3 text-gray-500">{s.phone}</td>
                <td className="px-4 py-3 text-right text-gray-700">{s.leadTimeDays}d</td>
                <td className="px-4 py-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setViewingId(s.id)}>View Details</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEdit(s)}>Edit</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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

      {/* Add / Edit dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Supplier" : "Add Supplier"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Company Name</Label>
                <Input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} placeholder="e.g. TechSupply Co." />
              </div>
              <div className="space-y-1.5">
                <Label>Contact Name</Label>
                <Input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} placeholder="Full name" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@company.com" />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(403) 555-0000" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street, City, Province" />
            </div>
            <div className="space-y-1.5">
              <Label>Lead Time (days)</Label>
              <Input type="number" min="0" value={form.leadTimeDays} onChange={(e) => setForm({ ...form, leadTimeDays: e.target.value })} placeholder="e.g. 5" />
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
