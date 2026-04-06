import { useCallback, useRef, useState } from "react";
import { Upload, FileSpreadsheet, Info, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateTemplateCSV } from "@/lib/parseImportFile";

const REQUIRED_COLUMNS = [
  { name: "product_sku",       required: true,  desc: "Unique product SKU (e.g., TSHIRT-001)" },
  { name: "product_name",      required: true,  desc: "Product name (e.g., Classic T-Shirt)" },
  { name: "category_name",     required: true,  desc: "Must match an existing category name" },
  { name: "unit_price",        required: true,  desc: "Selling price (numeric, e.g., 29.99)" },
  { name: "cost_price",        required: true,  desc: "Cost price (numeric, e.g., 12.00)" },
  { name: "reorder_point",     required: true,  desc: "Min stock threshold (integer)" },
  { name: "max_stock_level",   required: true,  desc: "Max stock level (integer)" },
  { name: "unit_of_measure",   required: true,  desc: "e.g., Each, kg, case" },
  { name: "variant_sku",       required: true,  desc: "Unique variant SKU (e.g., TSHIRT-001-RED-M)" },
  { name: "warehouse_name",    required: true,  desc: "Must match an existing warehouse name" },
  { name: "quantity_on_hand",  required: true,  desc: "Initial stock quantity (integer >= 0)" },
  { name: "description",       required: false, desc: "Product description text" },
  { name: "size",              required: false, desc: "Variant size (e.g., S, M, L)" },
  { name: "color",             required: false, desc: "Variant color (e.g., Red, Blue)" },
  { name: "bin_location",      required: false, desc: "Shelf/aisle code (e.g., A-12)" },
  { name: "expiration_date",   required: false, desc: "Format: YYYY-MM-DD" },
  { name: "variant_unit_price",required: false, desc: "Price override for this variant" },
  { name: "variant_cost_price",required: false, desc: "Cost override for this variant" },
  { name: "status",            required: false, desc: "Product status — Active or Inactive. Defaults to Active" },
];

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export default function ImportStep1Upload({ file, onFileSelect, onNext, onCancel }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback((f) => {
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (ext !== "csv" && ext !== "xlsx" && ext !== "xls") return;
    if (f.size > MAX_SIZE) return;
    onFileSelect(f);
  }, [onFileSelect]);

  const downloadTemplate = () => {
    const csv = generateTemplateCSV();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inventory_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Format guide */}
      <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Info className="h-4 w-4 text-accent" />
          File Format Guide
        </div>
        <p className="text-sm text-muted-foreground">
          Your file must be a <code className="bg-muted px-1 rounded text-xs">.csv</code> or{" "}
          <code className="bg-muted px-1 rounded text-xs">.xlsx</code> file. The first row must be the header row with the exact column names listed below.
        </p>
        <Button variant="outline" size="sm" onClick={downloadTemplate} className="text-accent border-accent/30 hover:bg-accent/10">
          <Download className="h-3.5 w-3.5 mr-1.5" /> Download Template
        </Button>
        <div className="max-h-48 overflow-y-auto rounded border border-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-2 font-medium">Column Name</th>
                <th className="text-center p-2 font-medium w-20">Required</th>
                <th className="text-left p-2 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              {REQUIRED_COLUMNS.map((col) => (
                <tr key={col.name} className="border-b last:border-0">
                  <td className="p-2 font-mono text-foreground">{col.name}</td>
                  <td className="p-2 text-center text-muted-foreground">{col.required ? "Yes" : "No"}</td>
                  <td className="p-2 text-muted-foreground">{col.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drop zone */}
      {!file ? (
        <div
          className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10 transition-colors ${dragOver ? "border-accent bg-accent/5" : "border-border"}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
        >
          <Upload className="h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm font-medium text-foreground">Drag and drop your file here</p>
          <p className="text-xs text-muted-foreground">Supports .csv and .xlsx — max 5 MB</p>
          <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
            Browse File
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
          />
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-4">
          <FileSpreadsheet className="h-8 w-8 text-accent" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onFileSelect(null)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={onNext} disabled={!file} className="bg-accent text-accent-foreground hover:bg-accent/90">
          Next: Preview
        </Button>
      </div>
    </div>
  );
}
