import { useState } from "react";
import { Plus, ArrowLeft, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { toast } from "sonner";
import { purchaseOrders as initialOrders, suppliers, getAllVariants } from "@/data/mockData";

const STATUS_ORDER = ["Pending", "Approved", "Shipped", "Delivered"];

const statusClass = {
  Pending:   "bg-yellow-50 text-yellow-700 border-yellow-200",
  Approved:  "bg-blue-50 text-blue-700 border-blue-200",
  Shipped:   "bg-purple-50 text-purple-700 border-purple-200",
  Delivered: "bg-green-50 text-green-700 border-green-200",
  Cancelled: "bg-red-50 text-red-600 border-red-200",
};

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState(initialOrders);
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewingId, setViewingId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [cancelId, setCancelId] = useState(null);

  // Create form state
  const [newSupplierId, setNewSupplierId] = useState("");
  const [newExpDate, setNewExpDate] = useState("");
  const [newItems, setNewItems] = useState([]);
  const [itemVariantId, setItemVariantId] = useState("");
  const [itemQty, setItemQty] = useState("");
  const [itemCost, setItemCost] = useState("");

  const allVariants = getAllVariants();
  const filtered = orders.filter((o) => statusFilter === "all" || o.status === statusFilter);

  const resetCreate = () => {
    setStep(1); setNewSupplierId(""); setNewExpDate(""); setNewItems([]);
    setItemVariantId(""); setItemQty(""); setItemCost("");
  };

  const addItem = () => {
    const v = allVariants.find((va) => va.id === itemVariantId);
    if (!v) return;
    const qty = Number(itemQty);
    const cost = Number(itemCost);
    setNewItems((prev) => [...prev, {
      productVariantId: v.id, variantSku: v.variantSku,
      productName: v.color ? `${v.productName} (${v.color})` : v.productName,
      quantity: qty, unitCost: cost, subtotal: qty * cost,
    }]);
    setItemVariantId(""); setItemQty(""); setItemCost("");
  };

  const submitOrder = () => {
    const supplier = suppliers.find((s) => s.id === newSupplierId);
    const order = {
      id: `PO-${String(orders.length + 1).padStart(3, "0")}`,
      supplierId: newSupplierId,
      supplierName: supplier?.companyName || "",
      orderDate: new Date().toISOString().split("T")[0],
      expectedDelivery: newExpDate,
      status: "Pending",
      totalAmount: newItems.reduce((sum, i) => sum + i.subtotal, 0),
      items: newItems,
    };
    setOrders((prev) => [order, ...prev]);
    toast.success(`Purchase order ${order.id} created`);
    setCreateOpen(false);
    resetCreate();
  };

  const updateStatus = (orderId, newStatus) => {
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));
    toast.success(`Order ${newStatus.toLowerCase()}`);
  };

  const cancelOrder = () => {
    if (!cancelId) return;
    updateStatus(cancelId, "Cancelled");
    setCancelId(null);
  };

  const viewing = viewingId ? orders.find((o) => o.id === viewingId) : null;

  // ── Detail view ─────────────────────────────────────────────────────────────
  if (viewing) {
    const currentIdx = STATUS_ORDER.indexOf(viewing.status);

    return (
      <div className="space-y-4">
        <button
          onClick={() => setViewingId(null)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Purchase Orders
        </button>

        {/* Order info + stepper */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 space-y-5">
          <h3 className="text-base font-semibold text-gray-900">Order {viewing.id}</h3>

          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            <div><span className="text-gray-400">Supplier:</span> <span className="text-gray-700">{viewing.supplierName}</span></div>
            <div><span className="text-gray-400">Order Date:</span> <span className="text-gray-700">{viewing.orderDate}</span></div>
            <div><span className="text-gray-400">Expected:</span> <span className="text-gray-700">{viewing.expectedDelivery}</span></div>
          </div>

          {/* Status stepper */}
          {viewing.status !== "Cancelled" && (
            <div className="flex items-center gap-1 flex-wrap py-1">
              {STATUS_ORDER.map((s, i) => (
                <div key={s} className="flex items-center gap-1">
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold
                    ${i <= currentIdx ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400"}`}>
                    {i + 1}
                  </div>
                  <span className={`text-xs ${i <= currentIdx ? "text-gray-800 font-medium" : "text-gray-400"}`}>{s}</span>
                  {i < STATUS_ORDER.length - 1 && (
                    <div className={`h-0.5 w-6 mx-1 ${i < currentIdx ? "bg-blue-600" : "bg-gray-200"}`} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 flex-wrap">
            {viewing.status === "Pending" && (
              <button onClick={() => updateStatus(viewing.id, "Approved")}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
                Approve
              </button>
            )}
            {viewing.status === "Approved" && (
              <button onClick={() => updateStatus(viewing.id, "Shipped")}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
                Mark Shipped
              </button>
            )}
            {viewing.status === "Shipped" && (
              <button onClick={() => updateStatus(viewing.id, "Delivered")}
                className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 transition-colors">
                Mark Delivered
              </button>
            )}
            {viewing.status !== "Delivered" && viewing.status !== "Cancelled" && (
              <button onClick={() => setCancelId(viewing.id)}
                className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                Cancel Order
              </button>
            )}
          </div>
        </div>

        {/* Line items */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100">
            <h4 className="text-sm font-semibold text-gray-800">Line Items</h4>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-right">Unit Cost</th>
                <th className="px-4 py-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(viewing.items || []).map((item, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{item.variantSku}</td>
                  <td className="px-4 py-3 text-gray-800">{item.productName}</td>
                  <td className="px-4 py-3 text-right font-mono text-gray-700">{item.quantity}</td>
                  <td className="px-4 py-3 text-right text-gray-700">${item.unitCost.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-800">${item.subtotal.toFixed(2)}</td>
                </tr>
              ))}
              <tr className="bg-gray-50 border-t border-gray-200">
                <td colSpan={4} className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Total</td>
                <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">${viewing.totalAmount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <ConfirmDialog
          open={!!cancelId}
          onOpenChange={() => setCancelId(null)}
          title="Cancel Order"
          description="Are you sure you want to cancel this purchase order? This cannot be undone."
          onConfirm={cancelOrder}
          confirmLabel="Cancel Order"
        />
      </div>
    );
  }

  // ── List view ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="w-[160px]">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {["Pending", "Approved", "Shipped", "Delivered", "Cancelled"].map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <button
          onClick={() => { resetCreate(); setCreateOpen(true); }}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> Create Order
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3">Order ID</th>
              <th className="hidden sm:table-cell px-4 py-3">Supplier</th>
              <th className="hidden md:table-cell px-4 py-3">Order Date</th>
              <th className="hidden lg:table-cell px-4 py-3">Expected</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 w-20">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No orders found.</td></tr>
            )}
            {filtered.map((o) => (
              <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-gray-600">{o.id}</td>
                <td className="hidden sm:table-cell px-4 py-3 text-gray-800">{o.supplierName}</td>
                <td className="hidden md:table-cell px-4 py-3 text-gray-500">{o.orderDate}</td>
                <td className="hidden lg:table-cell px-4 py-3 text-gray-500">{o.expectedDelivery}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusClass[o.status] || ""}`}>
                    {o.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono text-gray-700">${o.totalAmount.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setViewingId(o.id)}
                    className="rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Export */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            const data = filtered.map((o) => ({
              "Order ID": o.id, Supplier: o.supplierName, "Order Date": o.orderDate,
              "Expected Delivery": o.expectedDelivery, Status: o.status, Amount: o.totalAmount,
            }));
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Purchase Orders");
            XLSX.writeFile(wb, "purchase-orders.xlsx");
          }}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <Download className="h-4 w-4 text-blue-500" /> Export
        </button>
      </div>

      {/* Create PO Dialog — 3 steps */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Purchase Order — Step {step}/3</DialogTitle>
          </DialogHeader>

          {/* Step 1: Supplier + delivery date */}
          {step === 1 && (
            <div className="grid gap-4 py-2">
              <div className="space-y-1.5">
                <Label>Supplier</Label>
                <div className="w-full">
                  <Select value={newSupplierId} onValueChange={setNewSupplierId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.companyName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Expected Delivery Date</Label>
                <Input type="date" value={newExpDate} onChange={(e) => setNewExpDate(e.target.value)} />
              </div>
            </div>
          )}

          {/* Step 2: Add line items */}
          {step === 2 && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-3 sm:col-span-1">
                  <Select value={itemVariantId} onValueChange={setItemVariantId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {allVariants.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.color ? `${v.productName} (${v.color})` : v.productName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Input type="number" placeholder="Qty" value={itemQty} onChange={(e) => setItemQty(e.target.value)} min="1" />
                <Input type="number" placeholder="Unit cost $" value={itemCost} onChange={(e) => setItemCost(e.target.value)} min="0" step="0.01" />
              </div>
              <button
                onClick={addItem}
                disabled={!itemVariantId || !itemQty || !itemCost}
                className="flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Add Item
              </button>

              {newItems.length > 0 && (
                <table className="w-full text-sm border border-gray-100 rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-gray-50 text-xs font-medium text-gray-500 uppercase">
                      <th className="px-3 py-2 text-left">Product</th>
                      <th className="px-3 py-2 text-right">Qty</th>
                      <th className="px-3 py-2 text-right">Cost</th>
                      <th className="px-3 py-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {newItems.map((item, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 text-gray-800">{item.productName}</td>
                        <td className="px-3 py-2 text-right text-gray-600">{item.quantity}</td>
                        <td className="px-3 py-2 text-right text-gray-600">${item.unitCost.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right font-medium text-gray-800">${item.subtotal.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg bg-gray-50 border border-gray-100 p-4 text-sm space-y-2">
                <div><span className="text-gray-400">Supplier:</span> <span className="text-gray-800 font-medium">{suppliers.find((s) => s.id === newSupplierId)?.companyName}</span></div>
                <div><span className="text-gray-400">Expected Delivery:</span> <span className="text-gray-800">{newExpDate}</span></div>
                <div><span className="text-gray-400">Line Items:</span> <span className="text-gray-800">{newItems.length}</span></div>
                <div className="pt-1 text-lg font-bold text-gray-900">
                  Total: ${newItems.reduce((s, i) => s + i.subtotal, 0).toFixed(2)}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>Back</Button>
            )}
            {step < 3 && (
              <button
                onClick={() => setStep(step + 1)}
                disabled={(step === 1 && (!newSupplierId || !newExpDate)) || (step === 2 && newItems.length === 0)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            )}
            {step === 3 && (
              <button
                onClick={submitOrder}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                Submit Order
              </button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
