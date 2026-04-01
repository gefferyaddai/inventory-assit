import { useState } from 'react';
import { X } from 'lucide-react';
import ImportStep1Upload from './ImportStep1Upload';
import ImportStep2Preview from './ImportStep2Preview';
import { validateRow } from './ImportStep2Preview';
import ImportStep3Result from './ImportStep3Result';

const STEP_LABELS = ['Upload', 'Preview', 'Result'];

/**
 * BulkImportModal
 *
 * Props:
 *   onClose()                  — close the modal
 *   onImport(validRows)        — called with the array of valid row objects to persist
 */
export default function BulkImportModal({ onClose, onImport }) {
  const [step, setStep]             = useState(1);
  const [parsedRows, setParsedRows] = useState([]);
  const [result, setResult]         = useState(null); // { successCount, skippedRows }

  function handleParsed(rows) {
    setParsedRows(rows);
    setStep(2);
  }

  function handleConfirm(validated) {
    const valid   = validated.filter((r) => Object.keys(r.errors).length === 0).map((r) => r.row);
    const skipped = validated.filter((r) => Object.keys(r.errors).length > 0);
    onImport?.(valid);
    setResult({ successCount: valid.length, skippedRows: skipped });
    setStep(3);
  }

  function handleImportMore() {
    setParsedRows([]);
    setResult(null);
    setStep(1);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Bulk Import Products</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {STEP_LABELS.map((label, idx) => {
            const n = idx + 1;
            const active  = step === n;
            const done    = step > n;
            return (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={`flex items-center justify-center h-7 w-7 rounded-full text-xs font-semibold transition-colors ${
                    done    ? 'bg-blue-600 text-white' :
                    active  ? 'bg-blue-600 text-white' :
                              'bg-gray-100 text-gray-400'
                  }`}
                >
                  {done ? '✓' : n}
                </div>
                <span className={`text-sm ${active ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                  {label}
                </span>
                {idx < STEP_LABELS.length - 1 && (
                  <div className={`h-px w-8 mx-1 ${step > n ? 'bg-blue-600' : 'bg-gray-200'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        {step === 1 && <ImportStep1Upload onParsed={handleParsed} />}
        {step === 2 && (
          <ImportStep2Preview
            rows={parsedRows}
            onBack={() => setStep(1)}
            onConfirm={handleConfirm}
          />
        )}
        {step === 3 && result && (
          <ImportStep3Result
            successCount={result.successCount}
            skippedRows={result.skippedRows}
            onDone={onClose}
            onImportMore={handleImportMore}
          />
        )}
      </div>
    </div>
  );
}
