import Papa from "papaparse";
import * as XLSX from "xlsx";
import { products, categories, warehouses } from "@/data/mockData";

export interface ImportRow {
  rowNum: number;
  product_sku: string;
  product_name: string;
  category_name: string;
  unit_price: string;
  cost_price: string;
  reorder_point: string;
  max_stock_level: string;
  unit_of_measure: string;
  variant_sku: string;
  warehouse_name: string;
  quantity_on_hand: string;
  description?: string;
  size?: string;
  color?: string;
  bin_location?: string;
  expiration_date?: string;
  variant_unit_price?: string;
  variant_cost_price?: string;
  product_status?: string;
  importStatus: "new" | "update" | "error" | "new_category";
  errors: string[];
}

const REQUIRED_COLUMNS = [
  "product_sku", "product_name", "category_name", "unit_price", "cost_price",
  "reorder_point", "max_stock_level", "unit_of_measure", "variant_sku",
  "warehouse_name", "quantity_on_hand",
];

function validateRow(row: Record<string, string>, rowNum: number, seenVariantSkus: Set<string>): ImportRow {
  const errors: string[] = [];

  for (const col of REQUIRED_COLUMNS) {
    if (!row[col] || row[col].trim() === "") {
      errors.push(`Missing required field: ${col}`);
    }
  }

  const numericFields = ["unit_price", "cost_price", "reorder_point", "max_stock_level", "quantity_on_hand"];
  for (const f of numericFields) {
    const val = row[f];
    if (val && val.trim() !== "") {
      const num = Number(val);
      if (isNaN(num) || num < 0) errors.push(`${f} must be a non-negative number`);
      if (["quantity_on_hand", "reorder_point", "max_stock_level"].includes(f) && !Number.isInteger(num))
        errors.push(`${f} must be an integer`);
    }
  }

  for (const f of ["variant_unit_price", "variant_cost_price"]) {
    const val = row[f];
    if (val && val.trim() !== "") {
      const num = Number(val);
      if (isNaN(num) || num < 0) errors.push(`${f} must be a non-negative number`);
    }
  }

  if (row["expiration_date"] && row["expiration_date"].trim() !== "") {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row["expiration_date"].trim()))
      errors.push("expiration_date must be YYYY-MM-DD format");
  }

  const vsku = row["variant_sku"]?.trim();
  if (vsku) {
    if (seenVariantSkus.has(vsku)) errors.push(`Duplicate variant_sku: ${vsku}`);
    seenVariantSkus.add(vsku);
  }

  const isNewCategory =
    row["category_name"] &&
    !categories.find((c) => c.name.toLowerCase() === row["category_name"].trim().toLowerCase());

  if (row["warehouse_name"] && !warehouses.find((w) => w.name.toLowerCase() === row["warehouse_name"].trim().toLowerCase())) {
    errors.push(`Warehouse '${row["warehouse_name"]}' not found`);
  }

  let importStatus: "new" | "update" | "error" | "new_category" = "new";
  if (errors.length > 0) {
    importStatus = "error";
  } else if (isNewCategory) {
    importStatus = "new_category";
  } else {
    const existingProduct = products.find((p) => p.sku.toLowerCase() === row["product_sku"]?.trim().toLowerCase());
    if (existingProduct) {
      const existingVariant = existingProduct.variants.find(
        (v) => v.variantSku.toLowerCase() === vsku?.toLowerCase()
      );
      importStatus = existingVariant ? "update" : "new";
    }
  }

  return {
    rowNum,
    product_sku: row["product_sku"]?.trim() || "",
    product_name: row["product_name"]?.trim() || "",
    category_name: row["category_name"]?.trim() || "",
    unit_price: row["unit_price"]?.trim() || "",
    cost_price: row["cost_price"]?.trim() || "",
    reorder_point: row["reorder_point"]?.trim() || "",
    max_stock_level: row["max_stock_level"]?.trim() || "",
    unit_of_measure: row["unit_of_measure"]?.trim() || "",
    variant_sku: vsku || "",
    warehouse_name: row["warehouse_name"]?.trim() || "",
    quantity_on_hand: row["quantity_on_hand"]?.trim() || "",
    description: row["description"]?.trim(),
    size: row["size"]?.trim(),
    color: row["color"]?.trim(),
    bin_location: row["bin_location"]?.trim(),
    expiration_date: row["expiration_date"]?.trim(),
    variant_unit_price: row["variant_unit_price"]?.trim(),
    variant_cost_price: row["variant_cost_price"]?.trim(),
    product_status: row["status"]?.trim() || "Active",
    importStatus,
    errors,
  };
}

export function parseCSV(file: File): Promise<ImportRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h: string) => h.trim().toLowerCase().replace(/\s+/g, "_"),
      complete: (results) => {
        const seenVariantSkus = new Set<string>();
        const rows = (results.data as Record<string, string>[]).map((row, i) =>
          validateRow(row, i + 2, seenVariantSkus)
        );
        resolve(rows);
      },
      error: (err) => reject(err),
    });
  });
}

export function parseXLSX(file: File): Promise<ImportRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" });
        const normalized = jsonData.map((row) => {
          const newRow: Record<string, string> = {};
          for (const key of Object.keys(row)) {
            newRow[key.trim().toLowerCase().replace(/\s+/g, "_")] = String(row[key]);
          }
          return newRow;
        });
        const seenVariantSkus = new Set<string>();
        const rows = normalized.map((row, i) => validateRow(row, i + 2, seenVariantSkus));
        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
}

export function parseImportFile(file: File): Promise<ImportRow[]> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "csv") return parseCSV(file);
  if (ext === "xlsx" || ext === "xls") return parseXLSX(file);
  return Promise.reject(new Error("Unsupported file type. Please use .csv or .xlsx"));
}

export function generateTemplateCSV(): string {
  const headers = [
    "product_sku", "product_name", "category_name", "unit_price", "cost_price",
    "reorder_point", "max_stock_level", "unit_of_measure", "variant_sku",
    "warehouse_name", "quantity_on_hand", "description", "size", "color",
    "bin_location", "expiration_date", "variant_unit_price", "variant_cost_price", "status",
  ];
  const sampleRow = [
    "TSHIRT-001", "Classic T-Shirt", "Apparel", "29.99", "12.00",
    "10", "200", "Each", "TSHIRT-001-RED-M",
    "Main Warehouse", "50", "Comfortable cotton t-shirt", "M", "Red",
    "A-12", "2026-12-31", "31.99", "13.00", "Active",
  ];
  return [headers.join(","), sampleRow.join(",")].join("\n");
}
