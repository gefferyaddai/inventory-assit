import { useState } from "react";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { products, warehouseStocks, salesTrendData, supplierPerformance } from "@/data/mockData";

// ── Derived data ──────────────────────────────────────────────────────────────

const allStocks = Object.values(warehouseStocks).flat();

const valuationData = products
  .filter((p) => p.status === "Active")
  .map((p) => {
    // Match stock rows by variantSku against product sku or its variants' skus
    const skus = new Set([p.sku, ...p.variants.map((v) => v.variantSku)]);
    const totalStock = allStocks
      .filter((s) => skus.has(s.variantSku))
      .reduce((sum, s) => sum + s.qtyOnHand, 0);
    return {
      sku: p.sku,
      name: p.name,
      stock: totalStock,
      costPrice: p.costPrice,
      totalValue: totalStock * p.costPrice,
    };
  });

const totalInventoryValue = valuationData.reduce((sum, v) => sum + v.totalValue, 0);

// ── Helpers ───────────────────────────────────────────────────────────────────

const fulfillmentClass = (rate) =>
  rate >= 95
    ? "bg-green-50 text-green-700 border-green-200"
    : "bg-yellow-50 text-yellow-700 border-yellow-200";

const trendTypeClass = (type) => {
  if (type === "sales")       return "bg-blue-50 text-blue-700";
  if (type === "receipts")    return "bg-green-50 text-green-700";
  if (type === "adjustments") return "bg-orange-50 text-orange-700";
  return "bg-gray-100 text-gray-600";
};

// ── Component ─────────────────────────────────────────────────────────────────

const TABS = ["valuation", "sales", "suppliers"];
const TAB_LABELS = { valuation: "Inventory Valuation", sales: "Sales Trends", suppliers: "Supplier Performance" };

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("valuation");

  const exportValuation = () => {
    const data = valuationData.map((v) => ({
      SKU: v.sku, Product: v.name, "Stock on Hand": v.stock,
      "Cost Price": v.costPrice, "Total Value": v.totalValue.toFixed(2),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory Valuation");
    XLSX.writeFile(wb, "inventory-valuation.xlsx");
  };

  const exportSales = () => {
    const ws = XLSX.utils.json_to_sheet(salesTrendData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales Trends");
    XLSX.writeFile(wb, "sales-trends.xlsx");
  };

  const exportSuppliers = () => {
    const data = supplierPerformance.map((sp) => ({
      Supplier: sp.supplierName, "Avg Lead Time (days)": sp.avgLeadTime,
      "Total Orders": sp.totalOrders, "Fulfillment Rate (%)": sp.fulfillmentRate,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Supplier Performance");
    XLSX.writeFile(wb, "supplier-performance.xlsx");
  };

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors
              ${activeTab === tab
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"}`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* ── Inventory Valuation ── */}
      {activeTab === "valuation" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            {/* KPI card */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm px-5 py-4">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Total Inventory Value</p>
              <p className="text-2xl font-bold text-gray-900">
                ${totalInventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
            <button
              onClick={exportValuation}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
            >
              <Download className="h-4 w-4 text-blue-500" /> Export
            </button>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3 text-right">Stock on Hand</th>
                  <th className="px-4 py-3 text-right">Cost / Unit</th>
                  <th className="px-4 py-3 text-right">Total Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {valuationData.map((v) => (
                  <tr key={v.sku} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{v.sku}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{v.name}</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-700">{v.stock}</td>
                    <td className="px-4 py-3 text-right text-gray-600">${v.costPrice.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-800">${v.totalValue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Sales Trends ── */}
      {activeTab === "sales" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={exportSales}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
            >
              <Download className="h-4 w-4 text-blue-500" /> Export
            </button>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h4 className="text-sm font-semibold text-gray-800">Transaction Volume by Week</h4>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">Week</th>
                  <th className="px-4 py-3 text-right">Sales</th>
                  <th className="px-4 py-3 text-right">Receipts</th>
                  <th className="px-4 py-3 text-right">Adjustments</th>
                  <th className="px-4 py-3 text-right">Total Txns</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {salesTrendData.map((row) => (
                  <tr key={row.week} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{row.week}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-block rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-xs font-mono font-medium">{row.sales}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-block rounded-full bg-green-50 text-green-700 px-2 py-0.5 text-xs font-mono font-medium">{row.receipts}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-block rounded-full bg-orange-50 text-orange-700 px-2 py-0.5 text-xs font-mono font-medium">{row.adjustments}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-gray-700">
                      {row.sales + row.receipts + row.adjustments}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Visual bar summary */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
            <h4 className="text-sm font-semibold text-gray-800 mb-4">Weekly Activity Bars</h4>
            <div className="space-y-3">
              {salesTrendData.map((row) => {
                const total = row.sales + row.receipts + row.adjustments;
                const max = Math.max(...salesTrendData.map((r) => r.sales + r.receipts + r.adjustments));
                return (
                  <div key={row.week} className="flex items-center gap-3">
                    <span className="w-14 text-xs text-gray-500 shrink-0">{row.week}</span>
                    <div className="flex-1 flex gap-0.5 h-5 rounded overflow-hidden bg-gray-100">
                      <div className="bg-blue-400 transition-all" style={{ width: `${(row.sales / max) * 100}%` }} title={`Sales: ${row.sales}`} />
                      <div className="bg-green-400 transition-all" style={{ width: `${(row.receipts / max) * 100}%` }} title={`Receipts: ${row.receipts}`} />
                      <div className="bg-orange-400 transition-all" style={{ width: `${(row.adjustments / max) * 100}%` }} title={`Adjustments: ${row.adjustments}`} />
                    </div>
                    <span className="w-6 text-xs font-mono text-gray-500 text-right shrink-0">{total}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4 mt-3">
              {[["bg-blue-400", "Sales"], ["bg-green-400", "Receipts"], ["bg-orange-400", "Adjustments"]].map(([cls, label]) => (
                <div key={label} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <div className={`h-2.5 w-2.5 rounded-sm ${cls}`} />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Supplier Performance ── */}
      {activeTab === "suppliers" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={exportSuppliers}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
            >
              <Download className="h-4 w-4 text-blue-500" /> Export
            </button>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">Supplier</th>
                  <th className="px-4 py-3 text-right">Avg Lead Time</th>
                  <th className="px-4 py-3 text-right">Total Orders</th>
                  <th className="px-4 py-3 text-right">Fulfillment Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {supplierPerformance.map((sp) => (
                  <tr key={sp.supplierId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{sp.supplierName}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{sp.avgLeadTime} days</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-700">{sp.totalOrders}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${fulfillmentClass(sp.fulfillmentRate)}`}>
                        {sp.fulfillmentRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
