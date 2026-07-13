import { useMemo, useState } from 'react';
import { Table, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

function SheetPreviewTable({ rows }) {
  const columns = useMemo(() => (rows.length > 0 ? Object.keys(rows[0]) : []), [rows]);
  const previewRows = rows.slice(0, 100);

  if (columns.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-[#8A8886]">
        This sheet has no data.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full border-collapse text-left text-xs">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col}
                className="sticky top-0 whitespace-nowrap border-b border-[#E1DFDD] bg-[#FAF9F8] px-3 py-2 font-semibold text-[#323130]"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {previewRows.map((row, i) => (
            <tr key={i} className="border-b border-[#F0F0F0]">
              {columns.map((col) => (
                <td key={col} className="whitespace-nowrap px-3 py-1.5 text-[#323130]">
                  {row[col] === null || row[col] === undefined ? '' : String(row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function NavigatorDialog({
  open,
  fileName,
  sheetNames,
  sheets,
  loading,
  onLoad,
  onTransform,
  onClose,
}) {
  const [selectedSheets, setSelectedSheets] = useState(() => new Set(sheetNames.slice(0, 1)));
  const [previewSheet, setPreviewSheet] = useState(sheetNames[0] ?? null);

  if (!open) return null;

  const toggleSheet = (name) => {
    setSelectedSheets((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const canLoad = selectedSheets.size > 0 && !loading;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40">
      <div className="flex h-[600px] w-[900px] flex-col rounded-lg bg-white shadow-xl">
        <div className="border-b border-[#E1DFDD] px-5 py-3">
          <h2 className="text-base font-semibold text-[#323130]">Navigator</h2>
          <p className="text-xs text-[#605E5C]">{fileName}</p>
        </div>

        <div className="flex min-h-0 flex-1">
          <div className="flex w-[30%] flex-shrink-0 flex-col overflow-y-auto border-r border-[#E1DFDD]">
            {sheetNames.map((name) => (
              <button
                key={name}
                onClick={() => setPreviewSheet(name)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[#F3F2F1]',
                  previewSheet === name && 'bg-[#EFF6FC]'
                )}
              >
                <input
                  type="checkbox"
                  checked={selectedSheets.has(name)}
                  onChange={(e) => {
                    e.stopPropagation();
                    toggleSheet(name);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="h-3.5 w-3.5 flex-shrink-0"
                />
                <Table className="h-4 w-4 flex-shrink-0 text-[#605E5C]" strokeWidth={1.5} />
                <span className="truncate text-[#323130]">{name}</span>
                <span className="ml-auto flex-shrink-0 text-[11px] text-[#8A8886]">
                  {sheets[name]?.length ?? 0} rows
                </span>
              </button>
            ))}
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            {previewSheet ? (
              <SheetPreviewTable rows={sheets[previewSheet] ?? []} />
            ) : (
              <div className="flex flex-1 items-center justify-center text-sm text-[#8A8886]">
                Select a sheet to preview.
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#E1DFDD] px-5 py-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-3 py-1.5 text-sm font-medium text-[#605E5C] hover:text-[#323130] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onTransform(Array.from(selectedSheets))}
            disabled={!canLoad}
            className="rounded-md border border-[#E1DFDD] bg-white px-4 py-1.5 text-sm font-medium text-[#323130] hover:bg-[#F3F2F1] disabled:opacity-50"
          >
            Transform Data
          </button>
          <button
            onClick={() => onLoad(Array.from(selectedSheets))}
            disabled={!canLoad}
            className="flex items-center gap-1.5 rounded-md bg-[#323130] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#1f1e1d] disabled:opacity-50"
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Load
          </button>
        </div>
      </div>
    </div>
  );
}
