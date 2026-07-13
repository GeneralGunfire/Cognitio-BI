import { useEffect, useState } from 'react';
import { Plus, X, AlertCircle } from 'lucide-react';
import { pseudoFormula } from '@/lib/stepMeta';

export default function FormulaBar({
  step,
  visible,
  creatingColumn,
  onStartCreate,
  onCancelCreate,
  onCreateCustomColumn,
  error,
}) {
  const [columnName, setColumnName] = useState('');
  const [expression, setExpression] = useState('');

  useEffect(() => {
    if (creatingColumn) {
      setColumnName('');
      setExpression('');
    }
  }, [creatingColumn]);

  if (!visible) return null;

  if (creatingColumn) {
    const canSubmit = columnName.trim().length > 0 && expression.trim().length > 0;

    const submit = () => {
      if (!canSubmit) return;
      onCreateCustomColumn({ columnName: columnName.trim(), expression: expression.trim() });
    };

    return (
      <div className="flex flex-shrink-0 flex-col border-b border-[#E1DFDD] bg-white">
        <div className="flex items-center gap-2 px-3 py-1.5">
          <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-sm border border-[#E1DFDD] text-[11px] font-serif italic text-[#605E5C]">
            fx
          </span>
          <input
            value={columnName}
            onChange={(e) => setColumnName(e.target.value)}
            placeholder="New column name"
            className="w-40 flex-shrink-0 rounded border border-[#D0D0D0] px-2 py-1 text-xs text-[#323130] focus:border-[#0F8564] focus:outline-none"
          />
          <span className="text-xs text-[#605E5C]">=</span>
          <input
            autoFocus
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
              if (e.key === 'Escape') onCancelCreate();
            }}
            placeholder="e.g. [Price] * [Qty]"
            title="Reference existing columns with [ColumnName]. Basic arithmetic, comparisons, and simple functions supported."
            className="w-full rounded border border-[#D0D0D0] px-2 py-1 font-mono text-xs text-[#323130] focus:border-[#0F8564] focus:outline-none"
          />
          <button
            onClick={submit}
            disabled={!canSubmit}
            className="rounded bg-[#323130] px-3 py-1 text-xs font-medium text-white hover:bg-[#1f1e1d] disabled:opacity-50"
          >
            Enter
          </button>
          <button onClick={onCancelCreate} className="text-[#605E5C] hover:text-[#323130]">
            <X className="h-4 w-4" />
          </button>
        </div>
        {error && (
          <div className="flex items-center gap-1.5 border-t border-[#F0D9DA] bg-[#FDE7E9] px-3 py-1 text-xs text-[#D13438]">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-shrink-0 items-center gap-2 border-b border-[#E1DFDD] bg-white px-3 py-1.5">
      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-sm border border-[#E1DFDD] text-[11px] font-serif italic text-[#605E5C]">
        fx
      </span>
      <input
        readOnly
        value={step ? pseudoFormula(step) : ''}
        placeholder="Select a step to view its formula (simplified, non-executable representation — not real M)"
        title="Simplified pseudo-M representation for display only — this is not executable M code"
        className="w-full bg-transparent font-mono text-xs text-[#323130] placeholder:text-[#8A8886] focus:outline-none"
      />
      <button
        onClick={onStartCreate}
        className="flex flex-shrink-0 items-center gap-1 rounded border border-[#E1DFDD] px-2 py-1 text-xs font-medium text-[#323130] hover:bg-[#F3F2F1]"
      >
        <Plus className="h-3.5 w-3.5" />
        New Column
      </button>
    </div>
  );
}
