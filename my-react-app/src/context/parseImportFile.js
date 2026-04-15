import Papa from "papaparse";
import * as XLSX from "xlsx";

/**
 * parseCSV
 * Parses a CSV File object and returns a Promise resolving to an array of row objects.
 * Each object key is the column header from the first row.
 *
 * @param {File} file - A File object from an <input type="file"> or drag-and-drop
 * @returns {Promise<Object[]>} - Resolves to array of row objects
 */
export function parseCSV(file) {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,         // use first row as keys
            skipEmptyLines: true, // ignore blank rows
            trimHeaders: true,    // strip whitespace from header names
            transform: (value) => value.trim(), // trim every cell value
            complete: (results) => resolve(results.data),
            error: (error) => reject(new Error(`CSV parse error: ${error.message}`)),
        });
    });
}

/**
 * parseExcel
 * Parses an .xlsx (or .xls) File object and returns a Promise resolving to
 * an array of row objects, using the first sheet and first row as headers.
 *
 * @param {File} file - A File object
 * @returns {Promise<Object[]>} - Resolves to array of row objects
 */
export function parseExcel(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: "array" });

                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                // header: 1 gives us raw array-of-arrays; we convert manually so we
                // can trim header names and cell values just like the CSV path does.
                const rawRows = XLSX.utils.sheet_to_json(worksheet, {
                    header: 1,
                    defval: "",
                });

                if (rawRows.length === 0) {
                    resolve([]);
                    return;
                }

                const [headerRow, ...dataRows] = rawRows;
                const headers = headerRow.map((h) => String(h).trim());

                const rows = dataRows
                    .filter((row) => row.some((cell) => String(cell).trim() !== "")) // skip blank rows
                    .map((row) =>
                        Object.fromEntries(
                            headers.map((h, i) => [h, String(row[i] ?? "").trim()])
                        )
                    );

                resolve(rows);
            } catch (err) {
                reject(new Error(`Excel parse error: ${err.message}`));
            }
        };

        reader.onerror = () => reject(new Error("Failed to read file."));
        reader.readAsArrayBuffer(file);
    });
}

/**
 * validateImportRow
 * Checks that a parsed row has the minimum required fields for a product import.
 * Required: name, sku, qty
 *
 * @param {Object} row - A single parsed row object
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateImportRow(row) {
    const errors = [];

    // --- name ---
    if (!row.name || String(row.name).trim() === "") {
        errors.push("Missing required field: name");
    }

    // --- sku ---
    if (!row.sku || String(row.sku).trim() === "") {
        errors.push("Missing required field: sku");
    }

    // --- qty ---
    const rawQty = row.qty ?? row.quantity ?? "";
    if (rawQty === "" || rawQty === null || rawQty === undefined) {
        errors.push("Missing required field: qty");
    } else {
        const numQty = Number(rawQty);
        if (isNaN(numQty)) {
            errors.push(`Invalid qty: "${rawQty}" is not a number`);
        } else if (numQty < 0) {
            errors.push(`Invalid qty: quantity cannot be negative`);
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
