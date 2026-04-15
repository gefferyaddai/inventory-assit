import { useState, useCallback, useEffect } from "react";
import { Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { parseImportFile } from "@/lib/parseImportFile";
import { api } from "@/services/api";
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

  // Live validation context loaded from API when modal opens
  const [validationCtx, setValidationCtx] = useState({ categories: [], warehouses: [], products: [] });

  useEffect(() => {
    if (!open) return;
    Promise.all([
      api.get("/categories"),
      api.get("/warehouses"),
      api.get("/products"),
    ])
      .then(([cats, whs, prods]) => {
        setValidationCtx({ categories: cats, warehouses: whs, products: prods });
      })
      .catch(() => {
        toast.error("Failed to load validation data");
      });
  }, [open]);

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
      const parsed = await parseImportFile(file, validationCtx);
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

    try {
      const validRows = rows.filter((r) => r.importStatus !== "error");
      const data = await api.post("/products/bulk-import", { rows: validRows });

      const { productsCreated = 0, variantsCreated = 0, categoriesCreated = 0 } = data;
      const skipped = rows.filter((r) => r.importStatus === "error").length;

      setResult({ productsCreated, variantsCreated, stockUpdated: 0, skipped, categoriesCreated });
      setLoading(false);
      onImportComplete([]);
      toast.success("Import complete", {
        description: `${productsCreated} products, ${variantsCreated} variants created${categoriesCreated > 0 ? `, ${categoriesCreated} categories` : ""}.`,
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
