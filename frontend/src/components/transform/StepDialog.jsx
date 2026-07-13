import { useState } from 'react';
import { X } from 'lucide-react';

const OPERATOR_OPTIONS = [
  { value: 'equals', label: 'Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'greater_than', label: 'Greater than' },
  { value: 'less_than', label: 'Less than' },
  { value: 'is_blank', label: 'Is blank' },
  { value: 'is_not_blank', label: 'Is not blank' },
];

const TYPE_OPTIONS = ['text', 'number', 'boolean', 'date'];

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-[#323130]">
      {label}
      {children}
    </label>
  );
}

const inputClass =
  'rounded border border-[#D0D0D0] px-2 py-1.5 text-sm text-[#323130] focus:border-[#0F8564] focus:outline-none';

function ColumnSelect({ columns, value, onChange }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
      <option value="" disabled>
        Select a column
      </option>
      {columns.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}

// Renders the param form for a given operation_type, initialized from
// `initialParams` when editing an existing step (delete+recreate flow — see
// StepDialog's caller for why there's no in-place PATCH).
function useStepForm(operationType, initialParams) {
  const [params, setParams] = useState(() => ({ ...initialParams }));
  const set = (key, value) => setParams((prev) => ({ ...prev, [key]: value }));
  return [params, set];
}

export default function StepDialog({ operationType, title, columns, initialParams = {}, onSubmit, onClose }) {
  const [params, set] = useStepForm(operationType, initialParams);

  const isValid = (() => {
    switch (operationType) {
      case 'rename_column':
        return !!params.column && !!params.new_name;
      case 'change_type':
        return !!params.column && !!params.target_type;
      case 'remove_column':
        return !!params.column;
      case 'filter_rows':
        return !!params.column && !!params.operator;
      case 'trim_text':
        return !!params.column;
      case 'split_column':
        return !!params.column && !!params.delimiter;
      case 'fill_down':
        return !!params.column;
      case 'remove_duplicates':
        return true;
      default:
        return false;
    }
  })();

  const renderFields = () => {
    switch (operationType) {
      case 'rename_column':
        return (
          <>
            <Field label="Column">
              <ColumnSelect columns={columns} value={params.column ?? ''} onChange={(v) => set('column', v)} />
            </Field>
            <Field label="New name">
              <input
                className={inputClass}
                value={params.new_name ?? ''}
                onChange={(e) => set('new_name', e.target.value)}
              />
            </Field>
          </>
        );
      case 'change_type':
        return (
          <>
            <Field label="Column">
              <ColumnSelect columns={columns} value={params.column ?? ''} onChange={(v) => set('column', v)} />
            </Field>
            <Field label="Target type">
              <select
                className={inputClass}
                value={params.target_type ?? ''}
                onChange={(e) => set('target_type', e.target.value)}
              >
                <option value="" disabled>
                  Select a type
                </option>
                {TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
          </>
        );
      case 'remove_column':
        return (
          <Field label="Column">
            <ColumnSelect columns={columns} value={params.column ?? ''} onChange={(v) => set('column', v)} />
          </Field>
        );
      case 'filter_rows':
        return (
          <>
            <Field label="Column">
              <ColumnSelect columns={columns} value={params.column ?? ''} onChange={(v) => set('column', v)} />
            </Field>
            <Field label="Operator">
              <select
                className={inputClass}
                value={params.operator ?? ''}
                onChange={(e) => set('operator', e.target.value)}
              >
                <option value="" disabled>
                  Select an operator
                </option>
                {OPERATOR_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
            {params.operator && !['is_blank', 'is_not_blank'].includes(params.operator) && (
              <Field label="Value">
                <input
                  className={inputClass}
                  value={params.value ?? ''}
                  onChange={(e) => set('value', e.target.value)}
                />
              </Field>
            )}
          </>
        );
      case 'trim_text':
        return (
          <>
            <Field label="Column">
              <ColumnSelect columns={columns} value={params.column ?? ''} onChange={(v) => set('column', v)} />
            </Field>
            <Field label="Case (optional)">
              <select
                className={inputClass}
                value={params.case_transform ?? ''}
                onChange={(e) => set('case_transform', e.target.value || undefined)}
              >
                <option value="">No change</option>
                <option value="upper">UPPER CASE</option>
                <option value="lower">lower case</option>
              </select>
            </Field>
          </>
        );
      case 'split_column':
        return (
          <>
            <Field label="Column">
              <ColumnSelect columns={columns} value={params.column ?? ''} onChange={(v) => set('column', v)} />
            </Field>
            <Field label="Delimiter">
              <input
                className={inputClass}
                value={params.delimiter ?? ''}
                onChange={(e) => set('delimiter', e.target.value)}
                placeholder="e.g. , or -"
              />
            </Field>
          </>
        );
      case 'fill_down':
        return (
          <Field label="Column">
            <ColumnSelect columns={columns} value={params.column ?? ''} onChange={(v) => set('column', v)} />
          </Field>
        );
      case 'remove_duplicates':
        return (
          <p className="text-xs text-[#605E5C]">
            Removes rows that are exact duplicates across all columns.
          </p>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40">
      <div className="w-[420px] rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#E1DFDD] px-5 py-3">
          <h2 className="text-sm font-semibold text-[#323130]">{title}</h2>
          <button onClick={onClose} className="text-[#605E5C] hover:text-[#323130]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3 px-5 py-4">{renderFields()}</div>

        <div className="flex items-center justify-end gap-2 border-t border-[#E1DFDD] px-5 py-3">
          <button onClick={onClose} className="px-3 py-1.5 text-sm font-medium text-[#605E5C] hover:text-[#323130]">
            Cancel
          </button>
          <button
            onClick={() => onSubmit(params)}
            disabled={!isValid}
            className="rounded-md bg-[#323130] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#1f1e1d] disabled:opacity-50"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
