import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { api } from "@/services/api";

const fulfillmentClass = (rate) =>
  rate == null
    ? "bg-gray-100 text-gray-500 border-gray-200"
    : rate >= 80
    ? "bg-green-50 text-green-700 border-green-200"
    : "bg-yellow-50 text-yellow-700 border-yellow-200";

const TABS = ["valuation", "sales", "suppliers"];
const TAB_LABELS = { valuation: "Inventory Valuation", sales: "Transaction Volume", suppliers: "Supplier Performance" };

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("valuation");
  const [valuation, setValuation] = useState([]);
  const [salesTrend, setSalesTrend] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTab(activeTab);
  }, [activeTab]);

  async function loadTab(tab) {
    setLoading(true);
    try {
      if (tab === "valuation") {
        const data = await api.get("/reports/inventory-value");
        setValuation(data.map((r) => ({
          sku: r.SKU || "",
          name: r.productName || "",
          stock: Number(r.totalStock) || 0,
          costPrice: Number(r.costPrice) || 0,
          totalValue: Number(r.totalValue) || 0,
        })));
      } else if (tab === "sales") {
        const end = new Date().toISOString().slice(0, 10);
        const start = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const data = await api.get(`/reports/transaction-volume?startDate=${start}&endDate=${end}`);
        setSalesTrend(data.map((r) => ({
          week: r.week || "",
          sales: Number(r.sales) || 0,
          receipts: Number(r.receipts) || 0,
          adjustments: Number(r.adjustments) || 0,
        })));
      } else if (tab === "suppliers") {
        const data = await api.get("/reports/supplier-performance");
        setSuppliers(data.map((r) => ({
          supplierId: r.supplierId,
          supplierName: r.supplier || "",
          avgLeadTime: Number(r.avgLeadTime) || 0,
          totalOrders: Number(r.totalOrders) || 0,
          fulfillmentRate: r.fulfillmentRate != null ? Number(r.fulfillmentRate) : null,
        })));
      }
    } catch (err) {
      toast.error("Failed to load report");
    } finally {
      setLoading(false);
    }
  }

  const totalInventoryValue = valuation.reduce((sum, v) => sum + v.totalValue, 0);

  const exportValuation = () => {
    const data = valuation.map((v) => ({
      SKU: v.sku, Product: v.name, "Stock on Hand": v.stock,
      "Cost Price": v.costPrice.toFixed(2), "Total Value": v.totalValue.toFixed(2),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory Valuation");
    XLSX.writeFile(wb, "inventory-valuation.xlsx");
  };

  const exportSales = () => {
    const data = salesTrend.map((r) => ({
      Week: r.week, Sales: r.sales, Receipts: r.receipts,
      Adjustments: r.adjustments, Total: r.sales + r.receipts + r.adjustments,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transaction Volume");
    XLSX.writeFile(wb, "transaction-volume.xlsx");
  };

  const exportSuppliers = () => {
    const data = suppliers.map((sp) => ({
      Supplier: sp.supplierName, "Avg Lead Time (days)": sp.avgLeadTime,
      "Total Orders": sp.totalOrders,
      "Fulfillment Rate (%)": sp.fulfillmentRate != null ? sp.fulfillmentRate : "N/A",
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

      {loading && (
        <p className="text-sm text-gray-400 py-4 text-center">Loading…</p>
      )}

      {/* ── Inventory Valuation ── */}
      {!loading && activeTab === "valuation" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
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

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
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
                {valuation.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No data.</td></tr>
                )}
                {valuation.map((v, i) => (
                  <tr key={v.sku || i} className="hover:bg-gray-50 transition-colors">
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

      {/* ── Transaction Volume ── */}
      {!loading && activeTab === "sales" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={exportSales}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
            >
              <Download className="h-4 w-4 text-blue-500" /> Export
            </button>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100">
              <h4 className="text-sm font-semibold text-gray-800">Transaction Volume by Week (last 90 days)</h4>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">Week</th>
                  <th className="px-4 py-3 text-right">Sales</th>
                  <th className="px-4 py-3 text-right">Receipts</th>
                  <th className="px-4 py-3 text-right">Adjustments</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {salesTrend.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No transaction data.</td></tr>
                )}
                {salesTrend.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
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

          {salesTrend.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
              <h4 className="text-sm font-semibold text-gray-800 mb-4">Weekly Activity Bars</h4>
              <div className="space-y-3">
                {salesTrend.map((row, i) => {
                  const total = row.sales + row.receipts + row.adjustments;
                  const max = Math.max(...salesTrend.map((r) => r.sales + r.receipts + r.adjustments), 1);
                  return (
                    <div key={i} className="flex items-center gap-3">
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
          )}
        </div>
      )}

      {/* ── Supplier Performance ── */}
      {!loading && activeTab === "suppliers" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={exportSuppliers}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
            >
              <Download className="h-4 w-4 text-blue-500" /> Export
            </button>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">Supplier</th>
                  <th className="px-4 py-3 text-right">Lead Time</th>
                  <th className="px-4 py-3 text-right">Total Orders</th>
                  <th className="px-4 py-3 text-right">Fulfillment Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {suppliers.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No supplier data.</td></tr>
                )}
                {suppliers.map((sp) => (
                  <tr key={sp.supplierId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{sp.supplierName}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{sp.avgLeadTime} days</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-700">{sp.totalOrders}</td>
                    <td className="px-4 py-3 text-right">
                      {sp.fulfillmentRate != null ? (
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${fulfillmentClass(sp.fulfillmentRate)}`}>
                          {sp.fulfillmentRate}%
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">No orders</span>
                      )}
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
