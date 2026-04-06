import { useState } from "react";
import * as XLSX from "xlsx";
import { Search, Plus, ChevronDown, ChevronRight, MoreHorizontal, Download, Upload, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import BulkImportModal from "@/components/products/BulkImportModal";
import { toast } from "sonner";
import { products as initialProducts, categories } from "@/data/mockData";

// ── Helpers ───────────────────────────────────────────────────────────────────

const statusClass = (s) =>
  s === "Active"
    ? "bg-success/10 text-success border-success/20"
    : "bg-muted text-muted-foreground border-border";

const EMPTY_FORM = {
  sku: "", name: "", description: "", category: "",
  unitPrice: "", costPrice: "", reorderPoint: "",
  maxStockLevel: "", unitOfMeasure: "Each", expirationDate: "",
};

const EMPTY_VFORM = { size: "", color: "", unitPrice: "", costPrice: "" };

// ── Component ─────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const [items, setItems]               = useState(initialProducts);
  const [search, setSearch]             = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Product dialog
  const [formOpen, setFormOpen]         = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm]                 = useState(EMPTY_FORM);

  // Variant dialog
  const [vFormOpen, setVFormOpen]       = useState(false);
  const [variantParentId, setVariantParentId] = useState(null);
  const [editingVariant, setEditingVariant]   = useState(null);
  const [vForm, setVForm]               = useState(EMPTY_VFORM);

  // Confirm dialogs
  const [deactivateId, setDeactivateId] = useState(null);
  const [deleteVariantInfo, setDeleteVariantInfo] = useState(null);

  // Bulk import
  const [importOpen, setImportOpen] = useState(false);

  // ── Filter ──────────────────────────────────────────────────────────────────

  const filtered = items.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.sku.toLowerCase().includes(search.toLowerCase())) return false;
    if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    return true;
  });

  // ── Row expand ──────────────────────────────────────────────────────────────

  const toggleRow = (id) => {
    const next = new Set(expandedRows);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedRows(next);
  };

  // ── Product CRUD ────────────────────────────────────────────────────────────

  const openAdd = () => {
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (p) => {
    setEditingProduct(p);
    setForm({
      sku: p.sku, name: p.name, description: p.description, category: p.category,
      unitPrice: String(p.unitPrice), costPrice: String(p.costPrice),
      reorderPoint: String(p.reorderPoint), maxStockLevel: String(p.maxStockLevel),
      unitOfMeasure: p.unitOfMeasure, expirationDate: p.expirationDate || "",
    });
    setFormOpen(true);
  };

  const saveProduct = () => {
    if (editingProduct) {
      setItems((prev) => prev.map((p) =>
        p.id === editingProduct.id
          ? { ...p, ...form, unitPrice: Number(form.unitPrice), costPrice: Number(form.costPrice), reorderPoint: Number(form.reorderPoint), maxStockLevel: Number(form.maxStockLevel), expirationDate: form.expirationDate || null }
          : p
      ));
      toast.success("Product updated", { description: `${form.name} has been updated.` });
    } else {
      const newProduct = {
        id: `p-${Date.now()}`, ...form,
        unitPrice: Number(form.unitPrice), costPrice: Number(form.costPrice),
        reorderPoint: Number(form.reorderPoint), maxStockLevel: Number(form.maxStockLevel),
        expirationDate: form.expirationDate || null, status: "Active", variants: [],
      };
      setItems((prev) => [newProduct, ...prev]);
      toast.success("Product added", { description: `${form.name} has been created.` });
    }
    setFormOpen(false);
  };

  const deactivateProduct = () => {
    setItems((prev) => prev.map((p) => p.id === deactivateId ? { ...p, status: "Inactive" } : p));
    toast.success("Product deactivated");
    setDeactivateId(null);
  };

  const activateProduct = (id) => {
    setItems((prev) => prev.map((p) => p.id === id ? { ...p, status: "Active" } : p));
    toast.success("Product activated");
  };

  // ── Variant CRUD ────────────────────────────────────────────────────────────

  const openAddVariant = (productId) => {
    setVariantParentId(productId);
    setEditingVariant(null);
    setVForm(EMPTY_VFORM);
    setVFormOpen(true);
  };

  const openEditVariant = (productId, variant) => {
    setVariantParentId(productId);
    setEditingVariant(variant);
    setVForm({
      size: variant.size, color: variant.color,
      unitPrice: variant.unitPrice ? String(variant.unitPrice) : "",
      costPrice: variant.costPrice ? String(variant.costPrice) : "",
    });
    setVFormOpen(true);
  };

  const saveVariant = () => {
    if (!variantParentId) return;
    if (editingVariant) {
      setItems((prev) => prev.map((p) =>
        p.id === variantParentId
          ? { ...p, variants: p.variants.map((v) => v.id === editingVariant.id ? { ...v, size: vForm.size, color: vForm.color, unitPrice: vForm.unitPrice ? Number(vForm.unitPrice) : null, costPrice: vForm.costPrice ? Number(vForm.costPrice) : null } : v) }
          : p
      ));
      toast.success("Variant updated");
    } else {
      const parent = items.find((p) => p.id === variantParentId);
      const newVariant = {
        id: `v-${Date.now()}`,
        variantSku: `${parent?.sku}-${vForm.color.toUpperCase().slice(0, 3)}`,
        size: vForm.size, color: vForm.color,
        unitPrice: vForm.unitPrice ? Number(vForm.unitPrice) : null,
        costPrice: vForm.costPrice ? Number(vForm.costPrice) : null,
        status: "Active",
      };
      setItems((prev) => prev.map((p) => p.id === variantParentId ? { ...p, variants: [...p.variants, newVariant] } : p));
      toast.success("Variant added");
    }
    setVFormOpen(false);
  };

  const toggleVariantStatus = (productId, variantId) => {
    setItems((prev) => prev.map((p) =>
      p.id === productId
        ? { ...p, variants: p.variants.map((v) => v.id === variantId ? { ...v, status: v.status === "Active" ? "Inactive" : "Active" } : v) }
        : p
    ));
    toast.success("Variant status updated");
  };

  const deleteVariant = () => {
    if (!deleteVariantInfo) return;
    setItems((prev) => prev.map((p) =>
      p.id === deleteVariantInfo.productId
        ? { ...p, variants: p.variants.filter((v) => v.id !== deleteVariantInfo.variantId) }
        : p
    ));
    toast.success("Variant deleted", { description: `${deleteVariantInfo.variantSku} has been removed.` });
    setDeleteVariantInfo(null);
  };

  // ── Export ──────────────────────────────────────────────────────────────────

  const exportProducts = () => {
    const data = filtered.map((p) => ({
      SKU: p.sku, Name: p.name, Category: p.category,
      "Unit Price": p.unitPrice, "Cost Price": p.costPrice,
      "Reorder Point": p.reorderPoint, "Max Stock": p.maxStockLevel, Status: p.status,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    XLSX.writeFile(wb, "products.xlsx");
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-8">
        {/* Left group: search + filters, tightly spaced */}
        <div className="flex items-center gap-2 flex-1">
          <div className="relative min-w-[220px] max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by Name or SKU…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="w-[160px]">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="w-[130px]">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Right: actions, visually separated */}
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" onClick={() => setImportOpen(true)} className="text-accent border-accent/30 hover:bg-accent/10">
            <Upload className="h-4 w-4 mr-1" /> Import
          </Button>
          <Button onClick={openAdd} className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus className="h-4 w-4 mr-1" /> Add Product
          </Button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="w-8 px-3 py-3"></th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">SKU</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Category</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground text-right">Unit Price</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                <th className="w-10 px-3 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((p) => (
                <>
                  <tr key={p.id} className={`hover:bg-muted/40 transition-colors ${p.status === "Inactive" ? "opacity-50" : ""}`}>
                    <td className="px-3 py-3">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleRow(p.id)}>
                        {expandedRows.has(p.id)
                          ? <ChevronDown className="h-3.5 w-3.5" />
                          : <ChevronRight className="h-3.5 w-3.5" />}
                      </Button>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.sku}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{p.category}</td>
                    <td className="px-4 py-3 text-right text-foreground">${p.unitPrice.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={statusClass(p.status)}>{p.status}</Badge>
                    </td>
                    <td className="px-3 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(p)}>Edit</DropdownMenuItem>
                          {p.status === "Active"
                            ? <DropdownMenuItem onClick={() => setDeactivateId(p.id)} className="text-destructive">Deactivate</DropdownMenuItem>
                            : <DropdownMenuItem onClick={() => activateProduct(p.id)} className="text-success">Activate</DropdownMenuItem>
                          }
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>

                  {/* Variants expanded row */}
                  {expandedRows.has(p.id) && (
                    <tr key={`${p.id}-variants`}>
                      <td colSpan={7} className="bg-muted/50 px-6 py-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground">Variants</span>
                            <Button size="sm" variant="outline" onClick={() => openAddVariant(p.id)} disabled={p.status === "Inactive"}>
                              <Plus className="h-3 w-3 mr-1" /> Add Variant
                            </Button>
                          </div>
                          {p.variants.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-1">No variants yet.</p>
                          ) : (
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-border text-left">
                                  <th className="py-2 pr-4 text-xs font-medium text-muted-foreground">Variant SKU</th>
                                  <th className="py-2 pr-4 text-xs font-medium text-muted-foreground">Size</th>
                                  <th className="py-2 pr-4 text-xs font-medium text-muted-foreground">Color</th>
                                  <th className="py-2 pr-4 text-xs font-medium text-muted-foreground text-right">Unit Price</th>
                                  <th className="py-2 pr-4 text-xs font-medium text-muted-foreground text-right hidden sm:table-cell">Cost Price</th>
                                  <th className="py-2 pr-4 text-xs font-medium text-muted-foreground">Status</th>
                                  <th className="py-2 text-xs font-medium text-muted-foreground"></th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border">
                                {p.variants.map((v) => (
                                  <tr key={v.id} className={v.status === "Inactive" ? "opacity-50" : ""}>
                                    <td className="py-2 pr-4 font-mono text-xs">{v.variantSku}</td>
                                    <td className="py-2 pr-4">{v.size}</td>
                                    <td className="py-2 pr-4">{v.color}</td>
                                    <td className="py-2 pr-4 text-right">{v.unitPrice ? `$${v.unitPrice.toFixed(2)}` : "—"}</td>
                                    <td className="py-2 pr-4 text-right hidden sm:table-cell">{v.costPrice ? `$${v.costPrice.toFixed(2)}` : "—"}</td>
                                    <td className="py-2 pr-4">
                                      <button
                                        onClick={() => toggleVariantStatus(p.id, v.id)}
                                        disabled={p.status === "Inactive"}
                                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${v.status === "Active" ? "bg-success" : "bg-muted-foreground/30"} ${p.status === "Inactive" ? "cursor-not-allowed opacity-50" : ""}`}
                                      >
                                        <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${v.status === "Active" ? "translate-x-[18px]" : "translate-x-[2px]"}`} />
                                      </button>
                                    </td>
                                    <td className="py-2">
                                      <div className="flex items-center gap-0.5">
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditVariant(p.id, v)} disabled={p.status === "Inactive"}>
                                          <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteVariantInfo({ productId: p.id, variantId: v.id, variantSku: v.variantSku })} disabled={p.status === "Inactive"}>
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No products match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={exportProducts}>
          <Download className="h-4 w-4 mr-2 text-primary" /> Export
        </Button>
      </div>

      {/* ── Product Form Dialog ── */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>SKU</Label>
                <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Unit of Measure</Label>
                <Input value={form.unitOfMeasure} onChange={(e) => setForm({ ...form, unitOfMeasure: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Unit Price</Label>
                <Input type="number" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Cost Price</Label>
                <Input type="number" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Reorder Point</Label>
                <Input type="number" value={form.reorderPoint} onChange={(e) => setForm({ ...form, reorderPoint: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Max Stock Level</Label>
                <Input type="number" value={form.maxStockLevel} onChange={(e) => setForm({ ...form, maxStockLevel: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Expiration Date (optional)</Label>
              <Input type="date" value={form.expirationDate} onChange={(e) => setForm({ ...form, expirationDate: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={saveProduct} className="bg-accent text-accent-foreground hover:bg-accent/90">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Variant Form Dialog ── */}
      <Dialog open={vFormOpen} onOpenChange={setVFormOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingVariant ? "Edit Variant" : "Add Variant"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Size</Label>
                <Input value={vForm.size} onChange={(e) => setVForm({ ...vForm, size: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Color</Label>
                <Input value={vForm.color} onChange={(e) => setVForm({ ...vForm, color: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Unit Price (opt)</Label>
                <Input type="number" value={vForm.unitPrice} onChange={(e) => setVForm({ ...vForm, unitPrice: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Cost Price (opt)</Label>
                <Input type="number" value={vForm.costPrice} onChange={(e) => setVForm({ ...vForm, costPrice: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVFormOpen(false)}>Cancel</Button>
            <Button onClick={saveVariant} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {editingVariant ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Confirm Dialogs ── */}
      <ConfirmDialog
        open={!!deactivateId}
        onOpenChange={() => setDeactivateId(null)}
        title="Deactivate Product"
        description="This product will be marked as inactive and grayed out. It will not be permanently deleted."
        onConfirm={deactivateProduct}
        confirmLabel="Deactivate"
      />
      <ConfirmDialog
        open={!!deleteVariantInfo}
        onOpenChange={() => setDeleteVariantInfo(null)}
        title="Delete Variant"
        description={`Are you sure you want to permanently delete variant "${deleteVariantInfo?.variantSku}"? This cannot be undone.`}
        onConfirm={deleteVariant}
        confirmLabel="Delete"
      />

      <BulkImportModal
        open={importOpen}
        onOpenChange={setImportOpen}
        onImportComplete={(newProducts) => setItems((prev) => [...newProducts, ...prev])}
      />
    </div>
  );
}
