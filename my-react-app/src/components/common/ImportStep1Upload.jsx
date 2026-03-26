import { useRef, useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Upload, FileDown } from 'lucide-react';

const ACCEPTED = '.csv,.xlsx';

const TEMPLATE_ROWS = [
  ['name', 'sku', 'category', 'status'],
  ['Wireless Mouse', 'WM-001', 'Peripherals', 'Active'],
  ['USB-C Hub', 'UH-002', 'Accessories', 'Inactive'],
];

function buildTemplateBlob() {
  const ws = XLSX.utils.aoa_to_sheet(TEMPLATE_ROWS);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Products');
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([buf], { type: 'application/octet-stream' });
}

function parseFile(file, onSuccess, onError) {
  const ext = file.name.split('.').pop().toLowerCase();

  if (ext === 'csv') {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data }) => onSuccess(data),
      error: (err) => onError(err.message),
    });
    return;
  }

  if (ext === 'xlsx') {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
        onSuccess(data);
      } catch {
        onError('Failed to parse Excel file.');
      }
    };
    reader.readAsArrayBuffer(file);
    return;
  }

  onError('Unsupported file type. Please upload a .csv or .xlsx file.');
}

export default function ImportStep1Upload({ onParsed }) {
  const inputRef  = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError]       = useState(null);
  const [fileName, setFileName] = useState(null);

  function handleFile(file) {
    if (!file) return;
    setError(null);
    setFileName(file.name);
    parseFile(
      file,
      (rows) => {
        if (rows.length === 0) {
          setError('The file is empty or has no data rows.');
          setFileName(null);
          return;
        }
        onParsed(rows);
      },
      (msg) => {
        setError(msg);
        setFileName(null);
      }
    );
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }

  function downloadTemplate() {
    const blob = buildTemplateBlob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'product_import_template.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-10 cursor-pointer transition-colors ${
          dragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
        }`}
      >
        <Upload className="h-8 w-8 text-gray-400 mb-3" />
        {fileName ? (
          <p className="text-sm font-medium text-blue-600">{fileName}</p>
        ) : (
          <>
            <p className="text-sm font-medium text-gray-700">
              Drag &amp; drop a file here, or click to browse
            </p>
            <p className="text-xs text-gray-400 mt-1">Supported: .csv, .xlsx</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {/* Format guide */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Required columns
        </p>
        <div className="overflow-x-auto rounded-md border border-gray-100">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Column</th>
                <th className="px-3 py-2 text-left font-medium">Required</th>
                <th className="px-3 py-2 text-left font-medium">Allowed values</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              <tr><td className="px-3 py-2 font-mono">name</td>     <td className="px-3 py-2">Yes</td><td className="px-3 py-2">Any text</td></tr>
              <tr><td className="px-3 py-2 font-mono">sku</td>      <td className="px-3 py-2">Yes</td><td className="px-3 py-2">Unique identifier</td></tr>
              <tr><td className="px-3 py-2 font-mono">category</td> <td className="px-3 py-2">Yes</td><td className="px-3 py-2">Any text</td></tr>
              <tr><td className="px-3 py-2 font-mono">status</td>   <td className="px-3 py-2">Yes</td><td className="px-3 py-2">Active · Inactive</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Template download */}
      <button
        onClick={(e) => { e.stopPropagation(); downloadTemplate(); }}
        className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
      >
        <FileDown className="h-4 w-4" />
        Download template (.xlsx)
      </button>
    </div>
  );
}
