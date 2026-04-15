import { useState, useEffect } from "react";
import { Package, AlertTriangle, ShoppingCart, Warehouse, ArrowUpCircle, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import * as XLSX from "xlsx";

const txnBadgeClass = {
  Sale:       "bg-accent/10 text-accent border-accent/20",
  Receipt:    "bg-success/10 text-success border-success/20",
  Adjustment: "bg-warning/10 text-warning border-warning/20",
  Return:     "bg-destructive/10 text-destructive border-destructive/20",
};

function Card({ children, className = "", onClick }) {
  return (
    <div
      className={`bg-card rounded-xl border border-border ${onClick ? "cursor-pointer hover:border-accent/50 transition-colors" : ""} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

function SectionCard({ title, icon: Icon, iconClass = "", children }) {
  return (
    <Card>
      <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
        {Icon && <Icon className={`h-4 w-4 ${iconClass}`} />}
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </Card>
  );
}

function normalizeTxn(t) {
  return {
    id: t.TransactionID,
    type: t.TransactionType,
    productName: t.ProductName || "",
    quantity: Number(t.Quantity) || 0,
    warehouseName: t.WarehouseName || "",
    clerkName: t.ClerkName || "",
    timestamp: t.TransactionDate,
  };
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [overstock, setOverstock] = useState([]);
  const [pendingPOs, setPendingPOs] = useState(0);
  const [warehouseCount, setWarehouseCount] = useState(0);
  const [recentTxns, setRecentTxns] = useState([]);
  const [pendingReorders, setPendingReorders] = useState([]);
  const [converting, setConverting] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [prods, stockData, orders, whs, txns, reorders] = await Promise.all([
          api.get("/products"),
          api.get("/reports/low-stock"),
          api.get("/orders"),
          api.get("/warehouses"),
          api.get("/transactions"),
          api.get("/reorders?status=Pending"),
        ]);

        setProducts(prods.filter((p) => p.IsActive !== 0));

        // low-stock report gives us low stock items; overstock needs warehouse stock
        setLowStock(stockData.map((s) => ({
          productVariantId: s.SKU,
          productName: s.productName || "",
          variantSku: s.SKU || "",
          qtyOnHand: Number(s.QuantityOnHand) || 0,
          reorderPoint: Number(s.ReorderPoint) || 0,
        })));

        // Overstock: fetch all warehouse stocks and filter
        // We'll skip overstock in dashboard to avoid N+1 — show a simplified message
        setOverstock([]);

        setPendingPOs(orders.filter((o) => o.Status === "Pending").length);
        setWarehouseCount(whs.length);

        setRecentTxns(txns.slice(0, 5).map(normalizeTxn));

        setPendingReorders(reorders.map((r) => ({
          id: r.SuggestionID,
          productName: r.ProductName || "",
          warehouseName: r.WarehouseName || "",
          suggestedQty: Number(r.SuggestedQuantity) || 0,
        })));
      } catch (err) {
        toast.error("Failed to load dashboard data");
      }
    }
    load();
  }, []);

  const handleConvert = async (id) => {
    setConverting(id);
    try {
      await api.patch(`/reorders/${id}/convert`, {});
      toast.success("Converted to purchase order");
      setPendingReorders((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      toast.error(err.message || "Failed to convert");
    } finally {
      setConverting(null);
    }
  };

  const handleDismiss = async (id) => {
    try {
      await api.patch(`/reorders/${id}/dismiss`, {});
      toast.info("Suggestion dismissed");
      setPendingReorders((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      toast.error(err.message || "Failed to dismiss");
    }
  };

  const exportLowStock = (e) => {
    e.stopPropagation();
    const data = lowStock.map((s) => ({
      SKU: s.variantSku, Product: s.productName,
      "Qty On Hand": s.qtyOnHand, "Reorder Point": s.reorderPoint,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Low Stock");
    XLSX.writeFile(wb, "low-stock.xlsx");
  };

  const stats = [
    {
      label: "Total Products", value: products.length,
      icon: Package, desc: "Active products",
      onClick: () => navigate("/admin/products"),
    },
    {
      label: "Low-Stock Alerts", value: lowStock.length,
      icon: AlertTriangle, desc: "Items below reorder point",
      onExport: exportLowStock,
    },
    {
      label: "Pending POs", value: pendingPOs,
      icon: ShoppingCart, desc: "Awaiting approval",
      onClick: () => navigate("/admin/orders"),
    },
    {
      label: "Total Warehouses", value: warehouseCount,
      icon: Warehouse, desc: "Active locations",
      onClick: () => navigate("/admin/warehouses"),
    },
  ];

  return (
    <div className="space-y-6">

      {/* ── KPI Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} onClick={s.onClick} className="relative group p-5">
            <div className="flex items-center justify-between pb-1">
              <p className="text-sm font-medium text-muted-foreground">{s.label}</p>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold text-foreground mt-1">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.desc}</p>
            {s.onExport && (
              <button
                onClick={s.onExport}
                className="absolute bottom-3 right-3 h-7 w-7 rounded-full bg-muted flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent/10"
                title={`Export ${s.label.toLowerCase()}`}
              >
                <Download className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </Card>
        ))}
      </div>

      {/* ── Alert Banners ── */}
      <SectionCard title="Low-Stock Alerts" icon={AlertTriangle} iconClass="text-warning">
        {lowStock.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">No low-stock items</p>
        ) : (
          <div className="space-y-1">
            {lowStock.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <div>
                  <span className="text-sm font-medium text-foreground">{item.productName}</span>
                  <span className="text-xs text-muted-foreground ml-2">{item.variantSku}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-foreground">{item.qtyOnHand} left</span>
                  <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 text-xs">Low</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* ── Recent Activity ── */}
      <Card>
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground">Type</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground">Product</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground text-right">Qty</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Warehouse</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">Clerk</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentTxns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">No recent activity</td>
                </tr>
              ) : recentTxns.map((t) => (
                <tr key={t.id} className="hover:bg-muted/40 transition-colors">
                  <td className="px-5 py-3">
                    <Badge variant="outline" className={txnBadgeClass[t.type] ?? ""}>{t.type}</Badge>
                  </td>
                  <td className="px-5 py-3 font-medium text-foreground">{t.productName}</td>
                  <td className="px-5 py-3 font-mono text-right text-foreground">
                    {t.quantity > 0 ? `+${t.quantity}` : t.quantity}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground hidden md:table-cell">{t.warehouseName}</td>
                  <td className="px-5 py-3 text-muted-foreground hidden sm:table-cell">{t.clerkName}</td>
                  <td className="px-5 py-3 text-muted-foreground text-xs hidden lg:table-cell">
                    {t.timestamp ? new Date(t.timestamp).toLocaleString() : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Pending Reorder Suggestions ── */}
      <Card>
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Pending Reorder Suggestions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground">Product</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">Warehouse</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground text-right">Suggested Qty</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pendingReorders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">No pending suggestions</td>
                </tr>
              ) : pendingReorders.map((r) => (
                <tr key={r.id} className="hover:bg-muted/40 transition-colors">
                  <td className="px-5 py-3 font-medium text-foreground">{r.productName}</td>
                  <td className="px-5 py-3 text-muted-foreground hidden sm:table-cell">{r.warehouseName}</td>
                  <td className="px-5 py-3 font-mono text-right text-foreground">{r.suggestedQty}</td>
                  <td className="px-5 py-3">
                    <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">Pending</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm" variant="ghost"
                        className="text-xs text-accent hover:text-accent"
                        disabled={converting === r.id}
                        onClick={() => handleConvert(r.id)}
                      >
                        {converting === r.id ? "…" : "Convert"}
                      </Button>
                      <Button
                        size="sm" variant="ghost"
                        className="text-xs text-muted-foreground"
                        onClick={() => handleDismiss(r.id)}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
}
