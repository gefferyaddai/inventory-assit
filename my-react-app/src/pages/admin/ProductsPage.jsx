import { useState, useEffect, useCallback } from "react";
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
import { api } from "@/services/api";

// ── Normalizers ───────────────────────────────────────────────────────────────

function normalizeProduct(p) {
  return {
    id: p.ProductID,
    sku: p.SKU || "",
    name: p.Name,
    description: p.Description || "",
    category: p.CategoryName || "",
    categoryId: p.CategoryID,
    unitPrice: Number(p.UnitPrice) || 0,
    costPrice: Number(p.CostPrice) || 0,
    reorderPoint: Number(p.ReorderPoint) || 0,
    maxStockLevel: p.MaxStockLevel != null ? Number(p.MaxStockLevel) : "",
    unitOfMeasure: p.UnitOfMeasure || "Each",
    expirationDate: p.ExpirationDate ? p.ExpirationDate.split("T")[0] : "",
    status: p.IsActive ? "Active" : "Inactive",
  };
}

function normalizeVariant(v) {
  return {
    id: v.VariantID,
    variantSku: v.SKU || "",
    size: v.Size || "",
    color: v.Color || "",
    unitPrice: v.UnitPrice != null ? Number(v.UnitPrice) : null,
    costPrice: v.CostPrice != null ? Number(v.CostPrice) : null,
    status: v.IsActive ? "Active" : "Inactive",
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const statusClass = (s) =>
  s === "Active"
    ? "bg-success/10 text-success border-success/20"
    : "bg-muted text-muted-foreground border-border";

const EMPTY_FORM = {
  sku: "", name: "", description: "", categoryId: "",
  unitPrice: "", costPrice: "", reorderPoint: "",
  maxStockLevel: "", unitOfMeasure: "Each", expirationDate: "",
};

const EMPTY_VFORM = { size: "", color: "", unitPrice: "", costPrice: "" };

// ── Component ─────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const [items, setItems]           = useState([]);
  const [categories, setCategories] = useState([]);
  const [variantMap, setVariantMap] = useState({});
  const [loading, setLoading]       = useState(true);

  const [search, setSearch]                     = useState("");
  const [categoryFilter, setCategoryFilter]     = useState("all");
  const [statusFilter, setStatusFilter]         = useState("all");
  const [expandedRows, setExpandedRows]         = useState(new Set());

  const [formOpen, setFormOpen]                 = useState(false);
  const [editingProduct, setEditingProduct]     = useState(null);
  const [form, setForm]                         = useState(EMPTY_FORM);

  const [vFormOpen, setVFormOpen]               = useState(false);
  const [variantParentId, setVariantParentId]   = useState(null);
  const [editingVariant, setEditingVariant]     = useState(null);
  const [vForm, setVForm]                       = useState(EMPTY_VFORM);

  const [deactivateId, setDeactivateId]         = useState(null);
  const [activateId, setActivateId]             = useState(null);
  const [deleteVariantInfo, setDeleteVariantInfo] = useState(null);
  const [importOpen, setImportOpen]             = useState(false);

  // ── Fetch ────────────────────────────────────────────────────────────────────

  const fetchProducts = useCallback(async () => {
    try {
      const data = await api.get('/products');
      setItems(data.map(normalizeProduct));
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    api.get('/categories')
      .then((data) => setCategories(data.map((c) => ({ id: c.CategoryID, name: c.CategoryName }))))
      .catch(() => toast.error('Failed to load categories'));
  }, [fetchProducts]);

  // ── Filter ──────────────────────────────────────────────────────────────────

  const filtered = items.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.sku.toLowerCase().includes(search.toLowerCase())) return false;
    if (categoryFilter !== "all" && String(p.categoryId) !== categoryFilter) return false;
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    return true;
  });

  // ── Row expand (lazy-loads variants) ────────────────────────────────────────

  const toggleRow = async (id) => {
    const next = new Set(expandedRows);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
      if (!variantMap[id]) {
        try {
          const variants = await api.get(`/products/${id}/variants`);
          setVariantMap((prev) => ({ ...prev, [id]: variants.map(normalizeVariant) }));
        } catch {
          toast.error('Failed to load variants');
        }
      }
    }
    setExpandedRows(next);
  };

  const refreshVariants = async (productId) => {
    try {
      const variants = await api.get(`/products/${productId}/variants`);
      setVariantMap((prev) => ({ ...prev, [productId]: variants.map(normalizeVariant) }));
    } catch {
      toast.error('Failed to refresh variants');
    }
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
      sku: p.sku, name: p.name, description: p.description,
      categoryId: p.categoryId ? String(p.categoryId) : "",
      unitPrice: String(p.unitPrice), costPrice: String(p.costPrice),
      reorderPoint: String(p.reorderPoint), maxStockLevel: String(p.maxStockLevel),
      unitOfMeasure: p.unitOfMeasure, expirationDate: p.expirationDate || "",
    });
    setFormOpen(true);
  };

  const saveProduct = async () => {
    try {
      const payload = {
        name: form.name, description: form.description,
        categoryId: form.categoryId ? Number(form.categoryId) : null,
        sku: form.sku,
        unitPrice: Number(form.unitPrice) || 0,
        costPrice: Number(form.costPrice) || 0,
        reorderPoint: Number(form.reorderPoint) || 0,
        maxStockLevel: form.maxStockLevel ? Number(form.maxStockLevel) : null,
        unitOfMeasure: form.unitOfMeasure,
        expirationDate: form.expirationDate || null,
      };
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, payload);
        toast.success("Product updated", { description: `${form.name} has been updated.` });
      } else {
        await api.post('/products', payload);
        toast.success("Product added", { description: `${form.name} has been created.` });
      }
      setFormOpen(false);
      fetchProducts();
    } catch (err) {
      toast.error(err.message || 'Failed to save product');
    }
  };

  const deactivateProduct = async () => {
    try {
      await api.patch(`/products/${deactivateId}/status`, { isActive: 0 });
      toast.success("Product deactivated");
      setDeactivateId(null);
      fetchProducts();
    } catch (err) {
      toast.error(err.message || 'Failed to deactivate product');
    }
  };

  const activateProduct = async (id) => {
    try {
      await api.patch(`/products/${id}/status`, { isActive: 1 });
      toast.success("Product activated");
      fetchProducts();
    } catch (err) {
      toast.error(err.message || 'Failed to activate product');
    }
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
      unitPrice: variant.unitPrice != null ? String(variant.unitPrice) : "",
      costPrice: variant.costPrice != null ? String(variant.costPrice) : "",
    });
    setVFormOpen(true);
  };

  const saveVariant = async () => {
    if (!variantParentId) return;
    try {
      const payload = {
        sku: vForm.color ? `${items.find((p) => p.id === variantParentId)?.sku}-${vForm.color.toUpperCase().slice(0, 3)}` : undefined,
        size: vForm.size, color: vForm.color,
        price: vForm.unitPrice ? Number(vForm.unitPrice) : 0,
        costPrice: vForm.costPrice ? Number(vForm.costPrice) : 0,
      };
      if (editingVariant) {
        await api.put(`/products/${variantParentId}/variants/${editingVariant.id}`, payload);
        toast.success("Variant updated");
      } else {
        await api.post(`/products/${variantParentId}/variants`, payload);
        toast.success("Variant added");
      }
      setVFormOpen(false);
      refreshVariants(variantParentId);
    } catch (err) {
      toast.error(err.message || 'Failed to save variant');
    }
  };

  const toggleVariantStatus = async (productId, variantId, currentStatus) => {
    try {
      await api.patch(`/products/${productId}/variants/${variantId}/status`, {
        isActive: currentStatus === "Active" ? 0 : 1,
      });
      toast.success("Variant status updated");
      refreshVariants(productId);
    } catch (err) {
      toast.error(err.message || 'Failed to update variant status');
    }
  };

  const deleteVariant = async () => {
    if (!deleteVariantInfo) return;
    try {
      await api.delete(`/products/${deleteVariantInfo.productId}/variants/${deleteVariantInfo.variantId}`);
      toast.success("Variant deleted", { description: `${deleteVariantInfo.variantSku} has been removed.` });
      setDeleteVariantInfo(null);
      refreshVariants(deleteVariantInfo.productId);
    } catch (err) {
      toast.error(err.message || 'Failed to delete variant');
    }
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
                {categories.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
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
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">Loading…</td>
                </tr>
              )}
              {!loading && filtered.map((p) => (
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
                          {!variantMap[p.id] ? (
                            <p className="text-sm text-muted-foreground py-1">Loading variants…</p>
                          ) : variantMap[p.id].length === 0 ? (
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
                                {variantMap[p.id].map((v) => (
                                  <tr key={v.id} className={v.status === "Inactive" ? "opacity-50" : ""}>
                                    <td className="py-2 pr-4 font-mono text-xs">{v.variantSku}</td>
                                    <td className="py-2 pr-4">{v.size}</td>
                                    <td className="py-2 pr-4">{v.color}</td>
                                    <td className="py-2 pr-4 text-right">{v.unitPrice != null ? `$${v.unitPrice.toFixed(2)}` : "—"}</td>
                                    <td className="py-2 pr-4 text-right hidden sm:table-cell">{v.costPrice != null ? `$${v.costPrice.toFixed(2)}` : "—"}</td>
                                    <td className="py-2 pr-4">
                                      <button
                                        onClick={() => toggleVariantStatus(p.id, v.id, v.status)}
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
              {!loading && filtered.length === 0 && (
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
                <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
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
        onImportComplete={() => fetchProducts()}
      />
    </div>
  );
}
