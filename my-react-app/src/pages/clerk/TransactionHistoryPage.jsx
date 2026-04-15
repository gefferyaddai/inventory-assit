import { useState, useEffect, useMemo } from "react";
import { Download, ChevronLeft, ChevronRight, Search, X, Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import * as XLSX from "xlsx";
import { api } from "@/services/api";
import { toast } from "sonner";

const TYPES    = ["All", "Sale", "Receipt", "Adjustment", "Return", "Cancel"];
const PAGE_SIZE = 8;

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_STYLES = {
  Sale:       "bg-accent/10 text-accent border-accent/20",
  Receipt:    "bg-success/10 text-success border-success/20",
  Return:     "bg-destructive/10 text-destructive border-destructive/20",
  Adjustment: "bg-warning/10 text-warning border-warning/20",
  Cancel:     "bg-muted text-muted-foreground border-border",
};

const qtyDisplay = (type, qty) => {
  if (type === "Sale")    return { label: `-${qty}`, cls: "text-destructive" };
  if (type === "Return")  return { label: `+${qty}`, cls: "text-success" };
  if (type === "Receipt") return { label: `+${qty}`, cls: "text-success" };
  return { label: `${qty}`, cls: "text-foreground" };
};

function normalizeTxn(t) {
  const dt = new Date(t.TransactionDate);
  return {
    id:         `TXN-${t.TransactionID}`,
    date:       dt.toISOString().slice(0, 10),
    time:       dt.toTimeString().slice(0, 5),
    type:       t.TransactionType,
    product:    t.ProductName || "",
    sku:        t.SKU || "",
    qty:        Number(t.Quantity) || 0,
    unitPrice:  Number(t.UnitPrice) || 0,
    notes:      t.Notes || "",
    warehouse:  t.WarehouseName || "",
    tax:        t.TaxCode
      ? { code: t.TaxCode, rate: Number(t.TaxRate) || 0, exempt: false }
      : null,
  };
}

function exportToXLSX(rows) {
  const data = rows.map((t) => ({
    "Receipt No.":  t.id,
    Date:           t.date,
    Time:           t.time,
    Type:           t.type,
    Product:        t.product,
    SKU:            t.sku,
    Qty:            t.qty,
    "Unit Price":   t.unitPrice.toFixed(2),
    "Amount":       (t.qty * t.unitPrice).toFixed(2),
    Notes:          t.notes || "",
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Transactions");
  XLSX.writeFile(wb, "transaction-history.xlsx");
}

// ── Receipt preview ───────────────────────────────────────────────────────────

function computeTax(t) {
  const subtotal = t.qty * t.unitPrice;
  if (!t.tax || t.tax.exempt) return { subtotal, taxAmount: 0, grandTotal: subtotal };
  const taxAmount = subtotal * t.tax.rate;
  return { subtotal, taxAmount, grandTotal: subtotal + taxAmount };
}

function printTxnReceipt(t) {
  const { subtotal, taxAmount, grandTotal } = computeTax(t);
  const dateStr  = `${t.date}  ${t.time}`;
  const qtyLabel = t.type === "Sale" ? `${t.qty}` : `+${t.qty}`;

  const taxRow = t.tax?.exempt
    ? `<div class="summary-row"><span>Tax</span><span>EXEMPT</span></div>`
    : t.tax
    ? `<div class="summary-row"><span>${t.tax.code} (${(t.tax.rate * 100).toFixed(2).replace(/\.?0+$/, "")}%)</span><span>$${taxAmount.toFixed(2)}</span></div>`
    : "";

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Receipt ${t.id}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Courier New', monospace; font-size: 12px; color: #000; padding: 24px; max-width: 480px; margin: 0 auto; }
    h1 { font-size: 16px; font-weight: bold; text-align: center; letter-spacing: 1px; }
    .sub { font-size: 11px; text-align: center; color: #444; margin-top: 2px; }
    .divider { border-top: 1px dashed #000; margin: 10px 0; }
    .meta { font-size: 11px; margin: 4px 0; }
    .meta span { float: right; }
    table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 11px; }
    th { text-align: left; border-bottom: 1px solid #000; padding: 3px 2px; font-size: 10px; text-transform: uppercase; }
    td { padding: 4px 2px; vertical-align: top; }
    .summary-row { display: flex; justify-content: space-between; font-size: 11px; margin: 2px 0; color: #555; }
    .total-row { font-weight: bold; font-size: 13px; display: flex; justify-content: space-between; margin-top: 6px; }
    .notes { font-size: 11px; color: #555; margin-top: 6px; }
    .footer { text-align: center; font-size: 11px; color: #666; margin-top: 14px; }
    @media print { body { padding: 8px; } }
  </style>
</head>
<body>
  <h1>INVENTORY ASSIST</h1>
  <p class="sub">${t.warehouse || "Warehouse"}</p>
  <div class="divider"></div>
  <p class="meta">Receipt No. <span>${t.id}</span></p>
  <p class="meta">Date &amp; Time <span>${dateStr}</span></p>
  <div class="divider"></div>
  <table>
    <thead>
      <tr>
        <th>Product</th>
        <th style="text-align:center">Type</th>
        <th style="text-align:center">Qty</th>
        <th style="text-align:right">Unit</th>
        <th style="text-align:right">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${t.product}<br/><small style="color:#666">${t.sku}</small></td>
        <td style="text-align:center">${t.type}</td>
        <td style="text-align:center;font-family:monospace">${qtyLabel}</td>
        <td style="text-align:right;font-family:monospace">$${t.unitPrice.toFixed(2)}</td>
        <td style="text-align:right;font-family:monospace">$${subtotal.toFixed(2)}</td>
      </tr>
    </tbody>
  </table>
  <div class="divider"></div>
  <div class="summary-row"><span>Subtotal</span><span>$${subtotal.toFixed(2)}</span></div>
  ${taxRow}
  <div class="total-row"><span>GRAND TOTAL</span><span>$${grandTotal.toFixed(2)}</span></div>
  ${t.notes ? `<p class="notes">Notes: ${t.notes}</p>` : ""}
  <div class="divider"></div>
  <p class="footer">Thank you</p>
  <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }<\/script>
</body>
</html>`;

  const win = window.open("", "_blank", "width=520,height=700");
  win.document.write(html);
  win.document.close();
}

function ReceiptPreviewDialog({ txn, onClose }) {
  if (!txn) return null;
  const { subtotal, taxAmount, grandTotal } = computeTax(txn);
  const qtyLabel = txn.type === "Sale" ? `${txn.qty}` : `+${txn.qty}`;

  return (
    <Dialog open={!!txn} onOpenChange={onClose}>
      <DialogContent className="max-w-sm p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-0">
          <DialogTitle className="text-sm font-semibold">Receipt Preview</DialogTitle>
        </DialogHeader>

        <div className="px-5 py-4 space-y-4 font-mono text-xs">
          <div className="text-center space-y-0.5 border-b border-dashed border-border pb-3">
            <p className="text-sm font-bold tracking-widest text-foreground">INVENTORY ASSIST</p>
            <p className="text-muted-foreground">{txn.warehouse || "Warehouse"}</p>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Receipt No.</span>
              <span className="text-foreground">{txn.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date &amp; Time</span>
              <span className="text-foreground">{txn.date} {txn.time}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-border pt-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-foreground">{txn.product}</p>
                <p className="text-muted-foreground">{txn.sku}</p>
              </div>
              <div className="text-right shrink-0 space-y-0.5">
                <Badge
                  variant="outline"
                  className={`text-xs ${TYPE_STYLES[txn.type] ?? "bg-muted text-muted-foreground border-border"}`}
                >
                  {txn.type}
                </Badge>
                <p className="text-foreground">
                  {qtyLabel} × ${txn.unitPrice.toFixed(2)}
                </p>
                <p className="text-foreground font-semibold">${subtotal.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-dashed border-border pt-2 space-y-1">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>

            {txn.tax?.exempt ? (
              <div className="flex justify-between text-muted-foreground">
                <span>Tax</span>
                <span>EXEMPT</span>
              </div>
            ) : txn.tax ? (
              <div className="flex justify-between text-muted-foreground">
                <span>{txn.tax.code} ({(txn.tax.rate * 100).toFixed(2).replace(/\.?0+$/, "")}%)</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>
            ) : null}

            <div className="flex justify-between text-sm font-semibold text-foreground pt-1 border-t border-border">
              <span>GRAND TOTAL</span>
              <span>${grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {txn.notes && (
            <p className="text-muted-foreground border-t border-border pt-2">
              Notes: {txn.notes}
            </p>
          )}
        </div>

        <div className="px-5 pb-5">
          <Button
            onClick={() => printTxnReceipt(txn)}
            variant="outline"
            className="w-full gap-2"
          >
            <Printer className="h-4 w-4" />
            Print / Save PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TransactionHistoryPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search,      setSearch]        = useState("");
  const [dateFrom,    setDateFrom]      = useState("");
  const [dateTo,      setDateTo]        = useState("");
  const [typeFilter,  setTypeFilter]    = useState("All");
  const [page,        setPage]          = useState(1);
  const [previewTxn,  setPreviewTxn]    = useState(null);

  useEffect(() => {
    api.get('/transactions/mine')
      .then((data) => setTransactions(data.map(normalizeTxn)))
      .catch(() => toast.error('Failed to load transactions'))
      .finally(() => setLoading(false));
  }, []);

  const hasFilters = search || dateFrom || dateTo || typeFilter !== "All";

  function clearFilters() {
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setTypeFilter("All");
    setPage(1);
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return transactions.filter((t) => {
      if (q && !t.product.toLowerCase().includes(q) && !t.id.toLowerCase().includes(q) && !t.sku.toLowerCase().includes(q)) return false;
      if (dateFrom && t.date < dateFrom) return false;
      if (dateTo   && t.date > dateTo)   return false;
      if (typeFilter !== "All" && t.type !== typeFilter) return false;
      return true;
    });
  }, [transactions, search, dateFrom, dateTo, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageRows   = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const totalAmount = filtered.reduce((sum, t) => sum + t.unitPrice * t.qty, 0);

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Transaction History</h2>
        <button
          onClick={() => exportToXLSX(filtered)}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/40 transition-colors shadow-sm"
        >
          <Download className="h-4 w-4 text-accent" />
          Export
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex flex-wrap gap-3 items-end">

          <div className="space-y-1.5 min-w-[200px] flex-1">
            <Label className="text-xs">Search</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Receipt #, product, or SKU…"
                className="pl-8 h-9 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">From</Label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">To</Label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Type</Label>
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
              <SelectTrigger className="h-9 w-36 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 h-9 px-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Summary strip ── */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>
          {loading
            ? "Loading…"
            : filtered.length === 0
            ? "No transactions match filters"
            : `${filtered.length} transaction${filtered.length !== 1 ? "s" : ""}`}
        </span>
        {!loading && filtered.length > 0 && (
          <span className="font-mono">
            Total value: <span className="text-foreground font-semibold">${totalAmount.toFixed(2)}</span>
          </span>
        )}
      </div>

      {/* ── Table ── */}
      <div className="bg-card rounded-xl border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">Receipt #</th>
              <th className="px-4 py-3">Date &amp; Time</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3 text-right">Qty</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="hidden md:table-cell px-4 py-3">Notes</th>
              <th className="px-4 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-sm text-muted-foreground">Loading…</td>
              </tr>
            ) : pageRows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No transactions match the current filters.
                </td>
              </tr>
            ) : pageRows.map((t) => {
              const qty = qtyDisplay(t.type, t.qty);
              return (
                <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{t.id}</td>
                  <td className="px-4 py-3 text-foreground whitespace-nowrap">
                    {t.date}
                    <span className="ml-1.5 text-muted-foreground text-xs">{t.time}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={`text-xs ${TYPE_STYLES[t.type] ?? "bg-muted text-muted-foreground border-border"}`}>
                      {t.type}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">{t.product}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{t.sku}</td>
                  <td className={`px-4 py-3 text-right font-mono font-medium ${qty.cls}`}>{qty.label}</td>
                  <td className="px-4 py-3 text-right font-mono text-foreground">
                    ${(t.qty * t.unitPrice).toFixed(2)}
                  </td>
                  <td className="hidden md:table-cell px-4 py-3 text-xs text-muted-foreground max-w-[160px] truncate">
                    {t.notes || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setPreviewTxn(t)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                      title="Preview receipt"
                    >
                      <Printer className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {filtered.length === 0
            ? "No results"
            : `Showing ${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(safePage * PAGE_SIZE, filtered.length)} of ${filtered.length}`}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="p-1.5 rounded-md hover:bg-muted/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => setPage(n)}
              className={`h-7 w-7 rounded-md text-xs font-medium transition-colors ${
                n === safePage
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-muted/40 text-muted-foreground"
              }`}
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className="p-1.5 rounded-md hover:bg-muted/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <ReceiptPreviewDialog txn={previewTxn} onClose={() => setPreviewTxn(null)} />
    </div>
  );
}
