import { useState, useMemo, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { warehouseStocks, getAllVariants, products, warehouses } from "@/data/mockData";
import { TAX_REGIONS } from "@/data/taxRegions";
import { Plus, Trash2, CheckCircle2, ChevronsUpDown, Check, Printer, Settings2 } from "lucide-react";
import { toast } from "sonner";

const CLERK_WAREHOUSE_ID   = "W1";
const CLERK_WAREHOUSE_NAME = "Main Warehouse";
const stocks = warehouseStocks[CLERK_WAREHOUSE_ID] || [];
const allVariants = getAllVariants();
const warehouseSkus = new Set(stocks.map((s) => s.variantSku));
const availableVariants = allVariants.filter((v) => warehouseSkus.has(v.variantSku));

const TRANSACTION_TYPES = ["Sale", "Receipt", "Adjustment", "Return", "Cancel"];

const TAXABLE_TYPES = new Set(["Sale", "Return", "Adjustment"]);

// Derive available tax codes from the warehouse's configured tax region
const clerkWarehouse  = warehouses.find((w) => w.id === CLERK_WAREHOUSE_ID);
const clerkTaxRegion  = clerkWarehouse?.taxRegion
  ? TAX_REGIONS.find((r) => r.provinceCode === clerkWarehouse.taxRegion)
  : null;
const WAREHOUSE_TAXES = clerkTaxRegion?.taxes ?? [];

function getUnitPrice(sku) {
  const product = products.find(
    (p) => p.sku === sku || p.variants.some((pv) => pv.variantSku === sku)
  );
  return product?.unitPrice ?? 0;
}

function formatClerkNo(userId) {
  return `CLK-${String(userId).padStart(3, "0")}`;
}

function generateReceiptNo() {
  return `RCT-${Date.now().toString(36).toUpperCase().slice(-8)}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Card({ children, className = "" }) {
  return (
    <div className={`bg-card rounded-xl border border-border ${className}`}>
      {children}
    </div>
  );
}

function ProductCombobox({ value, onChange, variants }) {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState("");
  const containerRef        = useRef(null);
  const inputRef            = useRef(null);

  const selected = variants.find((v) => v.variantSku === value);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return variants.filter(
      (v) =>
        !q ||
        v.productName.toLowerCase().includes(q) ||
        v.variantSku.toLowerCase().includes(q) ||
        v.color.toLowerCase().includes(q)
    );
  }, [search, variants]);

  useEffect(() => {
    function onPointerDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function select(sku) {
    onChange(sku);
    setOpen(false);
    setSearch("");
  }

  function handleInputChange(e) {
    setSearch(e.target.value);
    if (!open) setOpen(true);
    if (e.target.value === "") onChange("");
  }

  function handleTriggerClick() {
    setOpen((o) => !o);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  const displayValue = open
    ? search
    : selected
    ? `${selected.productName}${selected.color ? ` — ${selected.color}` : ""} (${selected.variantSku})`
    : "";

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center border border-input rounded-md bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          placeholder="Search by name or SKU…"
          className="flex-1 h-9 px-3 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
        />
        <button
          type="button"
          onClick={handleTriggerClick}
          className="px-2 text-muted-foreground hover:text-foreground"
        >
          <ChevronsUpDown className="h-3.5 w-3.5" />
        </button>
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md max-h-56 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-3 py-4 text-sm text-center text-muted-foreground">No products found.</p>
          ) : filtered.map((v) => (
            <button
              key={v.variantSku}
              type="button"
              onPointerDown={(e) => { e.preventDefault(); select(v.variantSku); }}
              className="flex items-center w-full gap-2 px-3 py-2 text-sm text-left hover:bg-accent/10 transition-colors"
            >
              <Check className={`h-3.5 w-3.5 shrink-0 ${value === v.variantSku ? "opacity-100 text-accent" : "opacity-0"}`} />
              <span className="truncate">
                {v.productName}{v.color ? ` — ${v.color}` : ""}
                <span className="text-muted-foreground ml-1">({v.variantSku})</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TaxSettingsPopover({ taxCode, onTaxCode, taxExempt, onTaxExempt, onClose }) {
  const [search, setSearch] = useState("");
  const containerRef        = useRef(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q
      ? WAREHOUSE_TAXES.filter((t) => t.label.toLowerCase().includes(q) || t.code.toLowerCase().includes(q))
      : WAREHOUSE_TAXES;
  }, [search]);

  useEffect(() => {
    function onPointerDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onClose();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [onClose]);

  return (
    <div
      ref={containerRef}
      className="absolute right-0 top-10 z-50 w-72 rounded-xl border border-border bg-popover shadow-lg p-3 space-y-3"
    >
      <p className="text-xs font-semibold text-foreground">Tax Settings</p>

      {/* Tax exempt toggle */}
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={taxExempt}
          onChange={(e) => {
            onTaxExempt(e.target.checked);
            if (e.target.checked) onTaxCode(null);
          }}
          className="h-3.5 w-3.5 accent-accent"
        />
        <span className="text-sm text-foreground">Tax Exempt</span>
      </label>

      {taxExempt && (
        <p className="text-xs text-muted-foreground bg-muted/40 rounded-md px-2 py-1.5">
          Include your tax exempt code in the Notes field.
        </p>
      )}

      {/* Tax code list — driven by warehouse tax region */}
      {!taxExempt && (
        <div className="space-y-1.5">
          {WAREHOUSE_TAXES.length === 0 ? (
            <p className="text-xs text-muted-foreground bg-muted/40 rounded-md px-2 py-1.5">
              No tax region configured for this warehouse. Ask an admin to set one.
            </p>
          ) : (
            <>
              {WAREHOUSE_TAXES.length > 4 && (
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tax code…"
                  className="w-full h-8 px-2.5 text-xs rounded-md border border-input bg-background outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                />
              )}
              <div className="rounded-md border border-border divide-y divide-border">
                {filtered.map((t) => (
                  <button
                    key={t.code}
                    type="button"
                    onPointerDown={(e) => { e.preventDefault(); onTaxCode(t); onClose(); }}
                    className={`flex items-center justify-between w-full px-2.5 py-2 text-xs text-left transition-colors hover:bg-accent/10 ${taxCode?.code === t.code ? "bg-accent/10 text-accent" : "text-foreground"}`}
                  >
                    <span className="font-medium">{t.code}</span>
                    <span className="text-muted-foreground">{(t.rate * 100).toFixed(2).replace(/\.?0+$/, "")}%</span>
                  </button>
                ))}
              </div>
              {clerkTaxRegion && (
                <p className="text-xs text-muted-foreground">Region: {clerkTaxRegion.region}</p>
              )}
              {taxCode && (
                <button
                  type="button"
                  onClick={() => onTaxCode(null)}
                  className="text-xs text-destructive/70 hover:text-destructive"
                >
                  Clear tax
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ReceiptPanel({ receipt, onNew }) {
  const { receiptNo, items, notes, clerkNo, timestamp, warehouse, taxCode, taxExempt } = receipt;
  const dateStr = new Date(timestamp).toLocaleString();

  const subtotal     = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const taxableTotal = items.filter((i) => TAXABLE_TYPES.has(i.type)).reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const taxAmount    = (!taxExempt && taxCode) ? taxableTotal * taxCode.rate : 0;
  const grandTotal   = subtotal + taxAmount;

  function printReceipt() {
    const rows = items.map((item) => {
      const subtotalAmt = (item.unitPrice * item.quantity).toFixed(2);
      const qtyDisplay  = item.type === "Sale" ? `${item.quantity}` : `+${item.quantity}`;
      return `
        <tr>
          <td>${item.productName}<br/><small style="color:#666">${item.variantSku}</small></td>
          <td style="text-align:center">${item.type}</td>
          <td style="text-align:center;font-family:monospace">${qtyDisplay}</td>
          <td style="text-align:right;font-family:monospace">$${item.unitPrice.toFixed(2)}</td>
          <td style="text-align:right;font-family:monospace">$${subtotalAmt}</td>
        </tr>`;
    }).join("");

    const taxRow = taxExempt
      ? `<tr><td colspan="4" style="padding-top:6px;color:#555">TAX EXEMPT</td><td style="text-align:right;color:#555">—</td></tr>`
      : taxCode
      ? `<tr><td colspan="4" style="padding-top:6px;color:#555">${taxCode.code} (${(taxCode.rate * 100).toFixed(2).replace(/\.?0+$/, "")}%)</td><td style="text-align:right;font-family:monospace">$${taxAmount.toFixed(2)}</td></tr>`
      : "";

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Receipt ${receiptNo}</title>
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
    .summary-row { display: flex; justify-content: space-between; font-size: 11px; margin: 2px 0; }
    .total-row { font-weight: bold; font-size: 13px; display: flex; justify-content: space-between; margin-top: 6px; }
    .notes { font-size: 11px; color: #555; margin-top: 6px; }
    .footer { text-align: center; font-size: 11px; color: #666; margin-top: 14px; }
    @media print { body { padding: 8px; } }
  </style>
</head>
<body>
  <h1>INVENTORY ASSIST</h1>
  <p class="sub">${warehouse}</p>
  <div class="divider"></div>
  <p class="meta">Receipt No. <span>${receiptNo}</span></p>
  <p class="meta">Date &amp; Time <span>${dateStr}</span></p>
  <p class="meta">Clerk # <span>${clerkNo}</span></p>
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
    <tbody>${rows}</tbody>
  </table>
  <div class="divider"></div>
  <div class="summary-row"><span>Subtotal</span><span>$${subtotal.toFixed(2)}</span></div>
  ${taxRow}
  <div class="total-row"><span>GRAND TOTAL</span><span>$${grandTotal.toFixed(2)}</span></div>
  ${notes ? `<p class="notes">Notes: ${notes}</p>` : ""}
  <div class="divider"></div>
  <p class="footer">Thank you</p>
  <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }<\/script>
</body>
</html>`;

    const win = window.open("", "_blank", "width=520,height=700");
    win.document.write(html);
    win.document.close();
  }

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
        <h2 className="text-sm font-semibold text-foreground">Transaction Recorded</h2>
      </div>

      {/* Receipt body */}
      <div className="px-5 py-4 space-y-4 font-mono text-xs">
        {/* Meta */}
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Receipt No.</span>
            <span className="text-foreground">{receiptNo}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date &amp; Time</span>
            <span className="text-foreground">{dateStr}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Clerk #</span>
            <span className="text-foreground">{clerkNo}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Warehouse</span>
            <span className="text-foreground">{warehouse}</span>
          </div>
        </div>

        {/* Items */}
        <div className="border-t border-dashed border-border pt-3 space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-foreground truncate">{item.productName}</p>
                <p className="text-muted-foreground">{item.variantSku}</p>
              </div>
              <div className="text-right shrink-0 space-y-0.5">
                <Badge
                  variant="outline"
                  className={
                    item.type === "Sale"   ? "bg-accent/10 text-accent border-accent/20 text-xs" :
                    item.type === "Return" ? "bg-destructive/10 text-destructive border-destructive/20 text-xs" :
                    "bg-success/10 text-success border-success/20 text-xs"
                  }
                >
                  {item.type}
                </Badge>
                <p className="text-foreground">
                  {item.type === "Sale" ? `${item.quantity}` : `+${item.quantity}`}
                  {" × "}
                  ${item.unitPrice.toFixed(2)}
                </p>
                <p className="text-foreground font-semibold">
                  ${(item.unitPrice * item.quantity).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Subtotal / Tax / Grand Total */}
        <div className="border-t border-dashed border-border pt-2 space-y-1">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>

          {taxExempt ? (
            <div className="flex justify-between text-muted-foreground">
              <span>Tax</span>
              <span>EXEMPT</span>
            </div>
          ) : taxCode ? (
            <div className="flex justify-between text-muted-foreground">
              <span>{taxCode.code} ({(taxCode.rate * 100).toFixed(2).replace(/\.?0+$/, "")}%)</span>
              <span>${taxAmount.toFixed(2)}</span>
            </div>
          ) : null}

          <div className="flex justify-between text-sm font-semibold text-foreground pt-1 border-t border-border">
            <span>GRAND TOTAL</span>
            <span>${grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {notes && (
          <p className="text-muted-foreground border-t border-border pt-2">
            Notes: {notes}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="px-5 pb-5 flex gap-2">
        <Button
          onClick={printReceipt}
          variant="outline"
          className="flex-1 gap-2"
        >
          <Printer className="h-4 w-4" />
          Print / Save PDF
        </Button>
        <Button
          onClick={onNew}
          className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
        >
          New Transaction
        </Button>
      </div>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RecordTransactionPage() {
  const { user } = useAuth();

  const [type, setType]               = useState("Sale");
  const [variantId, setVariantId]     = useState("");
  const [quantity, setQuantity]       = useState("");
  const [notes, setNotes]             = useState("");
  const [cancelReceiptNo, setCancelReceiptNo] = useState("");
  const [cartItems, setCartItems]     = useState([]);
  const [editingId, setEditingId]     = useState(null);
  const [submitted, setSubmitted]     = useState(false);
  const [receipt, setReceipt]         = useState(null);

  // Tax settings
  const [taxCode, setTaxCode]         = useState(WAREHOUSE_TAXES[0] ?? null);
  const [taxExempt, setTaxExempt]     = useState(false);
  const [showTaxSettings, setShowTaxSettings] = useState(false);

  const isCancel = type === "Cancel";

  const selectedStock = variantId
    ? stocks.find((s) => s.variantSku === variantId)
    : null;

  const qty = Number(quantity) || 0;

  const newQty = selectedStock
    ? type === "Sale"
      ? selectedStock.qtyOnHand - qty
      : selectedStock.qtyOnHand + qty
    : null;

  const isInvalid = !!(selectedStock && type === "Sale" && qty > selectedStock.qtyOnHand);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const selectedVariant = useMemo(
    () => availableVariants.find((v) => v.variantSku === variantId),
    [variantId]
  );

  function addToCart() {
    if (!selectedStock || qty <= 0 || isInvalid) return;

    const itemData = {
      id:          editingId ?? `ITEM-${Date.now().toString(36)}`,
      variantSku:  selectedStock.variantSku,
      productName: selectedStock.productName,
      quantity:    qty,
      unitPrice:   getUnitPrice(variantId),
      type,
    };

    if (editingId) {
      setCartItems((prev) => prev.map((i) => i.id === editingId ? itemData : i));
      setEditingId(null);
      toast.success("Item updated");
    } else {
      setCartItems((prev) => [...prev, itemData]);
      toast.success("Item added to transaction");
    }

    setVariantId("");
    setQuantity("");
  }

  function removeFromCart(id) {
    setCartItems((prev) => prev.filter((i) => i.id !== id));
  }

  function editCartItem(id) {
    const item = cartItems.find((i) => i.id === id);
    if (!item) return;
    setType(item.type);
    setVariantId(item.variantSku);
    setQuantity(String(item.quantity));
    setEditingId(id);
  }

  function submitTransaction() {
    if (isCancel) {
      if (!cancelReceiptNo.trim()) return;
      toast.success("Transaction cancelled", {
        description: `Receipt ${cancelReceiptNo} has been cancelled`,
      });
      setSubmitted(true);
      return;
    }

    if (cartItems.length === 0) return;

    setReceipt({
      receiptNo: generateReceiptNo(),
      items:     cartItems,
      notes,
      clerkNo:   formatClerkNo(user?.id ?? 0),
      timestamp: new Date().toISOString(),
      warehouse: CLERK_WAREHOUSE_NAME,
      taxCode,
      taxExempt,
    });

    toast.success("Transaction submitted", {
      description: `${cartItems.length} item(s) recorded successfully`,
    });
    setSubmitted(true);
  }

  function resetForm() {
    setSubmitted(false);
    setReceipt(null);
    setType("Sale");
    setCartItems([]);
    setVariantId("");
    setQuantity("");
    setNotes("");
    setCancelReceiptNo("");
    setEditingId(null);
    setTaxCode(WAREHOUSE_TAXES[0] ?? null);
    setTaxExempt(false);
    setShowTaxSettings(false);
  }

  const showRightPanel = !isCancel;

  // Tax badge label for the form header
  const taxBadgeLabel = taxExempt ? "Exempt" : taxCode ? taxCode.code : null;

  return (
    <div className={`gap-6 ${showRightPanel ? "grid grid-cols-1 lg:grid-cols-2" : "max-w-lg"}`}>

      {/* ── Left: Form ── */}
      <div className="space-y-4">
        <Card className="p-5 space-y-4">
          {/* Form header with More (tax settings) button */}
          <div className="flex items-center justify-between relative">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-foreground">Record Transaction</h2>
              {taxBadgeLabel && (
                <Badge variant="outline" className="text-xs bg-accent/10 text-accent border-accent/20">
                  Tax: {taxBadgeLabel}
                </Badge>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowTaxSettings((v) => !v)}
              className={`p-1.5 rounded-md transition-colors ${showTaxSettings ? "bg-accent/10 text-accent" : "text-muted-foreground hover:text-foreground hover:bg-muted/40"}`}
              title="Tax settings"
            >
              <Settings2 className="h-4 w-4" />
            </button>

            {showTaxSettings && (
              <TaxSettingsPopover
                taxCode={taxCode}
                onTaxCode={setTaxCode}
                taxExempt={taxExempt}
                onTaxExempt={setTaxExempt}
                onClose={() => setShowTaxSettings(false)}
              />
            )}
          </div>

          {/* Transaction type */}
          <div className="space-y-1.5">
            <Label>Transaction Type</Label>
            <Select
              value={type}
              onValueChange={(v) => {
                setType(v);
                if (submitted) resetForm();
                if ((v === "Sale" || v === "Return") && !taxExempt) {
                  setTaxCode(WAREHOUSE_TAXES[0] ?? null);
                } else if (v !== "Sale" && v !== "Return") {
                  setTaxCode(null);
                }
              }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TRANSACTION_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isCancel ? (
            <div className="space-y-1.5">
              <Label>Receipt Number</Label>
              <Input
                placeholder="e.g. RCT-M1234ABC"
                value={cancelReceiptNo}
                onChange={(e) => setCancelReceiptNo(e.target.value)}
              />
            </div>
          ) : (
            <>
              {/* Product combobox */}
              <div className="space-y-1.5">
                <Label>Product</Label>
                <ProductCombobox
                  value={variantId}
                  onChange={setVariantId}
                  variants={availableVariants}
                />
              </div>

              {/* Quantity */}
              <div className="space-y-1.5">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
                {isInvalid && (
                  <p className="text-xs text-destructive">
                    Exceeds current stock ({selectedStock?.qtyOnHand})
                  </p>
                )}
              </div>

              {/* Warehouse (read-only) */}
              <div className="space-y-1.5">
                <Label>Warehouse</Label>
                <Input value={CLERK_WAREHOUSE_NAME} disabled />
              </div>
            </>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
            {taxExempt && (
              <p className="text-xs text-muted-foreground">
                Include your tax exempt code in this field.
              </p>
            )}
          </div>
        </Card>

        {/* Live qty preview */}
        {!isCancel && selectedStock && qty > 0 && (
          <Card className="p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Current Qty On Hand</span>
              <span className="font-mono font-medium text-foreground">{selectedStock.qtyOnHand}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{type} ({qty})</span>
              <span className="font-mono text-foreground">
                {type === "Sale" ? `-${qty}` : `+${qty}`}
              </span>
            </div>
            <div className="border-t border-border pt-2 flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">New Qty</span>
              <Badge
                variant="outline"
                className={
                  isInvalid
                    ? "bg-destructive/10 text-destructive border-destructive/20"
                    : "bg-success/10 text-success border-success/20"
                }
              >
                {newQty}
              </Badge>
            </div>
          </Card>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          {!isCancel && !submitted && (
            <Button
              onClick={addToCart}
              disabled={!variantId || qty <= 0 || isInvalid}
              variant="outline"
              className="flex-1 gap-1"
            >
              <Plus className="h-4 w-4" />
              {editingId ? "Update Item" : "Add"}
            </Button>
          )}

          {isCancel ? (
            <Button
              onClick={submitTransaction}
              disabled={!cancelReceiptNo.trim()}
              className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Transaction
            </Button>
          ) : (
            <Button
              onClick={submitted ? resetForm : submitTransaction}
              disabled={!submitted && cartItems.length === 0}
              className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {submitted ? "New Transaction" : "Submit Transaction"}
            </Button>
          )}
        </div>
      </div>

      {/* ── Right: Cart / Receipt ── */}
      {showRightPanel && (
        <div>
          {submitted && receipt ? (
            <ReceiptPanel receipt={receipt} onNew={resetForm} />
          ) : (
            <Card className="overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="text-sm font-semibold text-foreground">
                  Transaction Items
                  {cartItems.length > 0 && (
                    <span className="ml-2 text-xs text-muted-foreground font-normal">
                      ({cartItems.length})
                    </span>
                  )}
                </h2>
              </div>

              {cartItems.length === 0 ? (
                <div className="px-5 py-12 text-center text-sm text-muted-foreground">
                  Add items using the form to build your transaction.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/40 transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">{item.variantSku}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-3">
                        <Badge
                          variant="outline"
                          className={
                            item.type === "Sale"   ? "bg-accent/10 text-accent border-accent/20 text-xs" :
                            item.type === "Return" ? "bg-destructive/10 text-destructive border-destructive/20 text-xs" :
                            "bg-success/10 text-success border-success/20 text-xs"
                          }
                        >
                          {item.type}
                        </Badge>
                        <span className="text-sm font-mono text-foreground">
                          {item.type === "Sale" ? `-${item.quantity}` : `+${item.quantity}`}
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => editCartItem(item.id)}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors px-1"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-xs text-destructive/70 hover:text-destructive transition-colors px-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {cartItems.length > 0 && (
                <div className="px-5 py-3 border-t border-border flex justify-between text-sm">
                  <span className="text-muted-foreground">Total items</span>
                  <span className="font-mono font-medium text-foreground">
                    {cartItems.reduce((s, i) => s + i.quantity, 0)} units
                  </span>
                </div>
              )}
            </Card>
          )}
        </div>
      )}

    </div>
  );
}
