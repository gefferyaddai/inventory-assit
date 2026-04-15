import { useState, useEffect } from "react";
import { Search, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import * as XLSX from "xlsx";

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

function statusClass(s) {
  if (s === "Low Stock") return "bg-warning/10 text-warning border-warning/20";
  if (s === "Overstock")  return "bg-accent/10 text-accent border-accent/20";
  return "bg-success/10 text-success border-success/20";
}

export default function ClerkInventoryPage() {
  const { user } = useAuth();
  const [stocks, setStocks]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [warehouseName, setWarehouseName] = useState("My Warehouse");
  const [search, setSearch]         = useState("");

  useEffect(() => {
    if (!user?.warehouseId) return;
    Promise.all([
      api.get(`/warehouses/${user.warehouseId}`),
      api.get(`/warehouses/${user.warehouseId}/stock`),
    ])
      .then(([wh, stock]) => {
        setWarehouseName(wh.Name || "My Warehouse");
        setStocks(stock.map(normalizeStock));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.warehouseId]);

  const filtered = stocks.filter(
    (s) =>
      !search ||
      s.productName.toLowerCase().includes(search.toLowerCase()) ||
      s.variantSku.toLowerCase().includes(search.toLowerCase())
  );

  function exportInventory() {
    const data = filtered.map((s) => ({
      SKU:             s.variantSku,
      Product:         s.productName,
      Color:           s.color || "—",
      Size:            s.size  || "—",
      "Qty On Hand":   s.qtyOnHand,
      "Reorder Point": s.reorderPoint,
      Bin:             s.binLocation,
      Status:          s.status,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory");
    XLSX.writeFile(wb, "inventory.xlsx");
  }

  return (
    <div className="space-y-4">

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by SKU or name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="sm" onClick={exportInventory}>
          <Download className="h-4 w-4 mr-2 text-primary" />
          Export
        </Button>
      </div>

      {/* ── Inventory Table ── */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">{warehouseName}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground">SKU</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground">Product</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground text-right">Qty</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Bin</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell text-right">Reorder Pt</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">Loading…</td>
                </tr>
              )}
              {!loading && filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">
                    {search ? "No items match your search" : "No inventory in your warehouse yet."}
                  </td>
                </tr>
              ) : filtered.map((s) => (
                <tr key={s.productVariantId} className="hover:bg-muted/40 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{s.variantSku}</td>
                  <td className="px-5 py-3">
                    <p className="font-medium text-foreground">{s.productName}</p>
                    {(s.color || s.size) && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {[s.color, s.size].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-3 font-mono text-right text-foreground">{s.qtyOnHand}</td>
                  <td className="px-5 py-3 text-muted-foreground hidden md:table-cell">{s.binLocation || "—"}</td>
                  <td className="px-5 py-3 font-mono text-right text-muted-foreground hidden lg:table-cell">{s.reorderPoint}</td>
                  <td className="px-5 py-3">
                    <Badge variant="outline" className={statusClass(s.status)}>{s.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
