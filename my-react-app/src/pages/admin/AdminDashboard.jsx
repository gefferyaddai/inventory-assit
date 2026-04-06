import { Package, AlertTriangle, ShoppingCart, Warehouse, ArrowUpCircle, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  products, warehouseStocks, transactions,
  reorderSuggestions, warehouses, purchaseOrders,
} from "@/data/mockData";

// ── Derived data ──────────────────────────────────────────────────────────────

const activeProducts  = products.filter((p) => p.status === "Active").length;
const allStocks       = Object.values(warehouseStocks).flat();
const lowStockItems   = allStocks.filter((s) => s.status === "Low Stock");
const overstockItems  = allStocks.filter((s) => s.status === "Overstock");
const pendingPOs      = purchaseOrders.filter((po) => po.status === "Pending").length;
const totalWarehouses = warehouses.length;
const recentTxns      = transactions.slice(0, 5);
const pendingReorders = reorderSuggestions.filter((r) => r.status === "Pending");

// ── Badge colour maps ─────────────────────────────────────────────────────────

const txnBadgeClass = {
  Sale:       "bg-accent/10 text-accent border-accent/20",
  Receipt:    "bg-success/10 text-success border-success/20",
  Adjustment: "bg-warning/10 text-warning border-warning/20",
  Return:     "bg-destructive/10 text-destructive border-destructive/20",
};

// ── Sub-components ────────────────────────────────────────────────────────────

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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const navigate = useNavigate();

  const handleConvert = (id) =>
    toast.success("Converted", { description: `Reorder suggestion ${id} converted to purchase order.` });
  const handleDismiss = (id) =>
    toast.info("Dismissed", { description: `Reorder suggestion ${id} dismissed.` });

  const stats = [
    {
      label: "Total Products", value: activeProducts,
      icon: Package, desc: "Active products",
      onClick: () => navigate("/admin/products"),
      onExport: () => toast.success("Exported", { description: "Products list downloaded." }),
    },
    {
      label: "Low-Stock Alerts", value: lowStockItems.length,
      icon: AlertTriangle, desc: "Items below reorder point",
      onExport: () => toast.success("Exported", { description: "Low-stock report downloaded." }),
    },
    {
      label: "Pending POs", value: pendingPOs,
      icon: ShoppingCart, desc: "Awaiting approval",
      onClick: () => navigate("/admin/orders"),
      onExport: () => toast.success("Exported", { description: "Pending POs downloaded." }),
    },
    {
      label: "Total Warehouses", value: totalWarehouses,
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
                onClick={(e) => { e.stopPropagation(); s.onExport(); }}
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
      <div className="grid gap-4 lg:grid-cols-2">

        <SectionCard title="Low-Stock Alerts" icon={AlertTriangle} iconClass="text-warning">
          <div className="space-y-1">
            {lowStockItems.map((item) => (
              <div
                key={item.productVariantId + item.binLocation}
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
        </SectionCard>

        <SectionCard title="Overstock Items" icon={ArrowUpCircle} iconClass="text-accent">
          <div className="space-y-1">
            {overstockItems.map((item) => (
              <div
                key={item.productVariantId + item.binLocation}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <div>
                  <span className="text-sm font-medium text-foreground">{item.productName}</span>
                  <span className="text-xs text-muted-foreground ml-2">{item.variantSku}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-foreground">{item.qtyOnHand} units</span>
                  <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20 text-xs">Over</Badge>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

      </div>

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
              {recentTxns.map((t) => (
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
                    {new Date(t.timestamp).toLocaleString()}
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
              {pendingReorders.map((r) => (
                <tr key={r.id} className="hover:bg-muted/40 transition-colors">
                  <td className="px-5 py-3 font-medium text-foreground">{r.productName}</td>
                  <td className="px-5 py-3 text-muted-foreground hidden sm:table-cell">{r.warehouseName}</td>
                  <td className="px-5 py-3 font-mono text-right text-foreground">{r.suggestedQty}</td>
                  <td className="px-5 py-3">
                    <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">Pending</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" className="text-xs text-accent hover:text-accent" onClick={() => handleConvert(r.id)}>
                        Convert
                      </Button>
                      <Button size="sm" variant="ghost" className="text-xs text-muted-foreground" onClick={() => handleDismiss(r.id)}>
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
