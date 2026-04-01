import clsx from 'clsx';

const VALID_STATUSES = new Set(['active', 'inactive']);

const COLUMNS = ['name', 'sku', 'category', 'status'];

export function validateRow(row) {
  const errors = {};
  COLUMNS.forEach((col) => {
    const val = String(row[col] ?? '').trim();
    if (!val) {
      errors[col] = 'Required';
      return;
    }
    if (col === 'status' && !VALID_STATUSES.has(val.toLowerCase())) {
      errors[col] = 'Must be Active or Inactive';
    }
  });
  return errors; // {} means valid
}

export default function ImportStep2Preview({ rows, onBack, onConfirm }) {
  const validated = rows.map((row) => ({ row, errors: validateRow(row) }));
  const errorCount = validated.filter((r) => Object.keys(r.errors).length > 0).length;
  const validCount = validated.length - errorCount;

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex gap-4 text-sm">
        <span className="text-green-600 font-medium">{validCount} valid</span>
        {errorCount > 0 && (
          <span className="text-red-600 font-medium">{errorCount} with errors</span>
        )}
        <span className="text-gray-400">{rows.length} total rows</span>
      </div>

      {/* Preview table */}
      <div className="overflow-x-auto rounded-md border border-gray-100 max-h-72 overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 text-gray-500 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left font-medium">#</th>
              {COLUMNS.map((c) => (
                <th key={c} className="px-3 py-2 text-left font-medium font-mono">{c}</th>
              ))}
              <th className="px-3 py-2 text-left font-medium">Errors</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {validated.map(({ row, errors }, i) => {
              const hasError = Object.keys(errors).length > 0;
              return (
                <tr key={i} className={hasError ? 'bg-red-50' : ''}>
                  <td className="px-3 py-1.5 text-gray-400">{i + 1}</td>
                  {COLUMNS.map((col) => {
                    const cellErr = errors[col];
                    return (
                      <td
                        key={col}
                        className={clsx(
                          'px-3 py-1.5',
                          cellErr
                            ? 'text-red-700 font-medium'
                            : 'text-gray-700'
                        )}
                        title={cellErr}
                      >
                        {String(row[col] ?? '')}
                        {cellErr && (
                          <span className="ml-1 text-red-400 text-xs">⚠</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-3 py-1.5">
                    {hasError ? (
                      <span className="text-red-600">
                        {Object.values(errors).join(', ')}
                      </span>
                    ) : (
                      <span className="text-green-500">✓</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-1">
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => onConfirm(validated)}
          disabled={validCount === 0}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Import {validCount} valid row{validCount !== 1 ? 's' : ''}
        </button>
      </div>
    </div>
  );
}
