import { Package, AlertTriangle, ClipboardList, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { warehouseStocks, transactions } from "@/data/mockData";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";

// Clerk is assigned to Main Warehouse (W1) in mock data
const CLERK_WAREHOUSE_NAME = "Main Warehouse";
const stocks = warehouseStocks["W1"] || [];
const lowStockItems = stocks.filter((s) => s.status === "Low Stock");
const totalItems = stocks.reduce((sum, s) => sum + s.qtyOnHand, 0);

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

export default function ClerkDashboard() {
  const navigate = useNavigate();

  const warehouseTxns = transactions.filter(
    (t) => t.warehouseName === CLERK_WAREHOUSE_NAME
  );
  const recentTxns = warehouseTxns.slice(0, 5);

  function exportInventory(e) {
    e.stopPropagation();
    const data = stocks.map((s) => ({
      SKU:             s.variantSku,
      Product:         s.productName,
      "Qty On Hand":   s.qtyOnHand,
      "Reorder Point": s.reorderPoint,
      Status:          s.status,
      Bin:             s.binLocation,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory");
    XLSX.writeFile(wb, "inventory.xlsx");
  }

  function exportTransactions(e) {
    e.stopPropagation();
    const data = warehouseTxns.map((t) => ({
      Type:    t.type,
      Product: t.productName,
      Qty:     t.quantity,
      Clerk:   t.clerkName,
      Time:    new Date(t.timestamp).toLocaleString(),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    XLSX.writeFile(wb, "transactions.xlsx");
  }

  const stats = [
    {
      label: "Items In Stock",
      value: totalItems.toLocaleString(),
      icon: Package,
      desc: CLERK_WAREHOUSE_NAME,
      onClick: () => navigate("/clerk/inventory"),
      onExport: exportInventory,
    },
    {
      label: "Low-Stock Items",
      value: lowStockItems.length,
      icon: AlertTriangle,
      desc: "Below reorder point",
    },
    {
      label: "Transactions",
      value: warehouseTxns.length,
      icon: ClipboardList,
      desc: "In your warehouse",
      onClick: () => navigate("/clerk/transactions"),
      onExport: exportTransactions,
    },
  ];

  return (
    <div className="space-y-6">

      {/* ── KPI Cards ── */}
      <div className="grid gap-4 sm:grid-cols-3">
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
                className="absolute bottom-3 right-3 h-7 w-7 rounded-full bg-muted flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-orange-100"
                title={`Export ${s.label.toLowerCase()}`}
              >
                <Download className="h-3.5 w-3.5 text-primary" />
              </button>
            )}
          </Card>
        ))}
      </div>

      {/* ── Low-Stock Alerts ── */}
      <SectionCard
        title={`Low-Stock Alerts — ${CLERK_WAREHOUSE_NAME}`}
        icon={AlertTriangle}
        iconClass="text-warning"
      >
        {lowStockItems.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No low-stock items</p>
        ) : (
          <div className="space-y-1">
            {lowStockItems.map((item) => (
              <div
                key={item.productVariantId}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <div>
                  <span className="text-sm font-medium text-foreground">{item.productName}</span>
                  <span className="text-xs text-muted-foreground ml-2">{item.variantSku}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-foreground">
                    {item.qtyOnHand} / {item.reorderPoint}
                  </span>
                  <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 text-xs">
                    Low
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* ── Recent Transactions ── */}
      <Card>
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Recent Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground">Type</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground">Product</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground text-right">Qty</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">Clerk</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentTxns.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">
                    No transactions found
                  </td>
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
                  <td className="px-5 py-3 text-muted-foreground hidden sm:table-cell">{t.clerkName}</td>
                  <td className="px-5 py-3 text-muted-foreground text-xs hidden md:table-cell">
                    {new Date(t.timestamp).toLocaleString()}
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
