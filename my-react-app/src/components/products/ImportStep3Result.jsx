import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ImportStep3Result({ loading, result, error, onViewProducts, onImportAnother, onRetry }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
        <p className="text-sm font-medium text-muted-foreground">Importing your inventory data…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <XCircle className="h-14 w-14 text-destructive" />
        <h3 className="text-lg font-semibold">Import Failed</h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm">{error}</p>
        <Button onClick={onRetry} className="bg-accent text-accent-foreground hover:bg-accent/90">Try Again</Button>
      </div>
    );
  }

  if (!result) return null;

  const stats = [
    { label: "Products Created",       value: result.productsCreated  },
    { label: "Variants Created",       value: result.variantsCreated  },
    { label: "Categories Created",     value: result.categoriesCreated},
    { label: "Stock Records Updated",  value: result.stockUpdated     },
    { label: "Rows Skipped (errors)",  value: result.skipped          },
  ];

  return (
    <div className="flex flex-col items-center justify-center py-8 gap-6">
      <CheckCircle2 className="h-14 w-14 text-success" />
      <h3 className="text-lg font-semibold">Import Complete</h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="ghost" onClick={onImportAnother}>Import Another File</Button>
        <Button onClick={onViewProducts} className="bg-accent text-accent-foreground hover:bg-accent/90">
          View Products
        </Button>
      </div>
    </div>
  );
}
