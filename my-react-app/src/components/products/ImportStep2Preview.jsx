import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const badgeBase = "text-[10px] whitespace-nowrap px-1.5 py-0.5 leading-none";

function StatusBadge({ row }) {
  switch (row.importStatus) {
    case "new":
      return <Badge variant="outline" className={`bg-success/10 text-success border-success/20 ${badgeBase}`}>New</Badge>;
    case "new_category":
      return <Badge variant="outline" className={`bg-blue-500/10 text-blue-600 border-blue-500/20 ${badgeBase}`}>New Cat.</Badge>;
    case "update":
      return <Badge variant="outline" className={`bg-amber-500/10 text-amber-600 border-amber-500/20 ${badgeBase}`}>Update</Badge>;
    case "error":
      return (
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="outline" className={`bg-destructive/10 text-destructive border-destructive/20 ${badgeBase}`}>Error</Badge>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-xs">
            <ul className="text-xs space-y-0.5 list-disc pl-3">
              {row.errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </TooltipContent>
        </Tooltip>
      );
    default:
      return null;
  }
}

export default function ImportStep2Preview({ rows, onBack, onImport }) {
  const validRows      = rows.filter((r) => r.importStatus !== "error");
  const errorRows      = rows.filter((r) => r.importStatus === "error");
  const updateRows     = rows.filter((r) => r.importStatus === "update");
  const newCategoryRows= rows.filter((r) => r.importStatus === "new_category");
  const newCategories  = [...new Set(newCategoryRows.map((r) => r.category_name))];

  return (
    <div className="space-y-4">
      {/* Summary badges */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="bg-success/10 text-success border-success/20 px-3 py-1">
          {validRows.length} rows valid
        </Badge>
        {errorRows.length > 0 && (
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 px-3 py-1">
            {errorRows.length} rows with errors
          </Badge>
        )}
        {updateRows.length > 0 && (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 px-3 py-1">
            {updateRows.length} rows will update existing records
          </Badge>
        )}
        {newCategories.length > 0 && (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 px-3 py-1">
            {newCategories.length} new categor{newCategories.length > 1 ? "ies" : "y"} will be created
          </Badge>
        )}
      </div>

      {/* New category info */}
      {newCategories.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-blue-300 bg-blue-50/50 p-3 text-sm text-blue-800">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            The following categor{newCategories.length > 1 ? "ies" : "y"} will be created on import:{" "}
            <strong>{newCategories.join(", ")}</strong>
          </span>
        </div>
      )}

      {/* Error warning */}
      {errorRows.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50/50 p-3 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            {errorRows.length} row{errorRows.length > 1 ? "s have" : " has"} errors and will be skipped. Fix your file and re-upload, or proceed to import only the valid rows.
          </span>
        </div>
      )}

      {/* Preview table */}
      <div className="max-h-96 overflow-y-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
            <tr className="border-b border-border text-left">
              <th className="px-3 py-2 text-xs font-medium text-muted-foreground w-10">#</th>
              <th className="px-3 py-2 text-xs font-medium text-muted-foreground">product_sku</th>
              <th className="px-3 py-2 text-xs font-medium text-muted-foreground">product_name</th>
              <th className="px-3 py-2 text-xs font-medium text-muted-foreground hidden sm:table-cell">category</th>
              <th className="px-3 py-2 text-xs font-medium text-muted-foreground">variant_sku</th>
              <th className="px-3 py-2 text-xs font-medium text-muted-foreground hidden md:table-cell">warehouse</th>
              <th className="px-3 py-2 text-xs font-medium text-muted-foreground text-right">qty</th>
              <th className="px-3 py-2 text-xs font-medium text-muted-foreground text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.rowNum} className={row.importStatus === "error" ? "bg-destructive/5" : ""}>
                <td className="px-3 py-2 text-xs text-muted-foreground">{row.rowNum}</td>
                <td className="px-3 py-2 font-mono text-xs">{row.product_sku}</td>
                <td className="px-3 py-2">{row.product_name}</td>
                <td className="px-3 py-2 text-muted-foreground hidden sm:table-cell">{row.category_name}</td>
                <td className="px-3 py-2 font-mono text-xs">{row.variant_sku}</td>
                <td className="px-3 py-2 text-muted-foreground hidden md:table-cell">{row.warehouse_name}</td>
                <td className="px-3 py-2 text-right">{row.quantity_on_hand}</td>
                <td className="px-3 py-2 text-right"><StatusBadge row={row} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={onBack}>Back</Button>
        <Button
          onClick={onImport}
          disabled={validRows.length === 0}
          className="bg-accent text-accent-foreground hover:bg-accent/90"
        >
          Import {validRows.length} Valid Row{validRows.length !== 1 ? "s" : ""}
        </Button>
      </div>
    </div>
  );
}
