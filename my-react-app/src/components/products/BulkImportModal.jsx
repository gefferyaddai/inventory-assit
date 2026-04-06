import { useState, useCallback } from "react";
import { Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { parseImportFile } from "@/lib/parseImportFile";
import { products as allProducts, categories } from "@/data/mockData";
import ImportStep1Upload from "./ImportStep1Upload";
import ImportStep2Preview from "./ImportStep2Preview";
import ImportStep3Result from "./ImportStep3Result";

const STEPS = ["Upload File", "Preview & Validate", "Confirm Import"];

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function BulkImportModal({ open, onOpenChange, onImportComplete }) {
  const [step, setStep]       = useState(0);
  const [file, setFile]       = useState(null);
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState(null);

  const reset = useCallback(() => {
    setStep(0); setFile(null); setRows([]);
    setLoading(false); setResult(null); setError(null);
  }, []);

  const handleClose = (val) => {
    if (!val) reset();
    onOpenChange(val);
  };

  const handleNext = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const parsed = await parseImportFile(file);
      setRows(parsed);
      setStep(1);
    } catch (err) {
      toast.error("Parse Error", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    setStep(2);
    setLoading(true);
    setError(null);

    await new Promise((r) => setTimeout(r, 1200));

    try {
      const validRows = rows.filter((r) => r.importStatus !== "error");
      const productMap = new Map();
      let productsCreated = 0, variantsCreated = 0, stockUpdated = 0, categoriesCreated = 0;

      // Auto-create new categories
      const newCategoryNames = new Set();
      for (const row of validRows) {
        if (row.importStatus === "new_category") {
          const catName = row.category_name;
          if (catName && !newCategoryNames.has(catName.toLowerCase()) && !categories.find((c) => c.name.toLowerCase() === catName.toLowerCase())) {
            newCategoryNames.add(catName.toLowerCase());
            categories.push({ id: `cat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name: catName });
            categoriesCreated++;
          }
        }
      }

      for (const row of validRows) {
        const existingProduct = allProducts.find((p) => p.sku.toLowerCase() === row.product_sku.toLowerCase());

        if (!productMap.has(row.product_sku) && !existingProduct) {
          const newProd = {
            id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            sku: row.product_sku, name: row.product_name, description: row.description || "",
            category: row.category_name, unitPrice: Number(row.unit_price), costPrice: Number(row.cost_price),
            reorderPoint: Number(row.reorder_point), maxStockLevel: Number(row.max_stock_level),
            unitOfMeasure: row.unit_of_measure, expirationDate: row.expiration_date || null,
            status: ["Active", "Inactive"].includes(row.product_status) ? row.product_status : "Active",
            variants: [],
          };
          productMap.set(row.product_sku, newProd);
          productsCreated++;
        }

        const prod = productMap.get(row.product_sku) || existingProduct;
        if (prod) {
          const existingVariant = prod.variants.find((v) => v.variantSku.toLowerCase() === row.variant_sku.toLowerCase());
          if (existingVariant) {
            stockUpdated++;
          } else {
            prod.variants.push({
              id: `v-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              variantSku: row.variant_sku, size: row.size || "", color: row.color || "",
              unitPrice: row.variant_unit_price ? Number(row.variant_unit_price) : null,
              costPrice: row.variant_cost_price ? Number(row.variant_cost_price) : null,
              status: ["Active", "Inactive"].includes(row.product_status) ? row.product_status : "Active",
            });
            variantsCreated++;
          }
        }
      }

      const skipped = rows.filter((r) => r.importStatus === "error").length;
      const newProducts = Array.from(productMap.values());

      setResult({ productsCreated, variantsCreated, stockUpdated, skipped, categoriesCreated });
      setLoading(false);
      onImportComplete(newProducts);
      toast.success("Import complete", {
        description: `${productsCreated} products added, ${variantsCreated} variants created${categoriesCreated > 0 ? `, ${categoriesCreated} categories created` : ""}.`,
      });
    } catch (err) {
      setError(err.message || "An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Inventory Import</DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-1 py-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-1">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors",
                  i <= step ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <span className={cn("text-xs font-medium hidden sm:inline", i === step ? "text-foreground" : "text-muted-foreground")}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn("w-8 sm:w-12 h-px mx-1", i < step ? "bg-accent" : "bg-border")} />
              )}
            </div>
          ))}
        </div>

        {step === 0 && (
          <ImportStep1Upload
            file={file}
            onFileSelect={setFile}
            onNext={handleNext}
            loading={loading}
            onCancel={() => handleClose(false)}
          />
        )}
        {step === 1 && (
          <ImportStep2Preview
            rows={rows}
            onBack={() => setStep(0)}
            onImport={handleImport}
          />
        )}
        {step === 2 && (
          <ImportStep3Result
            loading={loading}
            result={result}
            error={error}
            onViewProducts={() => handleClose(false)}
            onImportAnother={reset}
            onRetry={() => setStep(1)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
