import { CheckCircle, XCircle } from 'lucide-react';

export default function ImportStep3Result({ successCount, skippedRows, onDone, onImportMore }) {
  return (
    <div className="space-y-6">
      {/* Counts */}
      <div className="flex gap-6">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <div>
            <p className="text-2xl font-bold text-gray-900">{successCount}</p>
            <p className="text-xs text-gray-500">Imported</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <XCircle className="h-5 w-5 text-red-400" />
          <div>
            <p className="text-2xl font-bold text-gray-900">{skippedRows.length}</p>
            <p className="text-xs text-gray-500">Skipped</p>
          </div>
        </div>
      </div>

      {/* Error list */}
      {skippedRows.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Skipped rows
          </p>
          <ul className="space-y-1 max-h-48 overflow-y-auto">
            {skippedRows.map(({ row, errors }, i) => (
              <li key={i} className="text-xs bg-red-50 border border-red-100 rounded px-3 py-2">
                <span className="font-medium text-gray-700">
                  Row {i + 1} — {String(row.name || row.sku || '(unnamed)')}:
                </span>{' '}
                <span className="text-red-600">{Object.values(errors).join(', ')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {successCount === 0 && skippedRows.length === 0 && (
        <p className="text-sm text-gray-500">No rows were processed.</p>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-1">
        <button
          onClick={onImportMore}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          Import More
        </button>
        <button
          onClick={onDone}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
}
