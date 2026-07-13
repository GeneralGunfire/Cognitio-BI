import { X } from 'lucide-react';

const WELLS_BY_TYPE = {
  bar: [
    { key: 'x', label: 'X Axis' },
    { key: 'y', label: 'Y Axis' },
    { key: 'series', label: 'Series' },
  ],
  line: [
    { key: 'x', label: 'X Axis' },
    { key: 'y', label: 'Y Axis' },
    { key: 'series', label: 'Series' },
  ],
  pie: [
    { key: 'x', label: 'Category' },
    { key: 'y', label: 'Value' },
  ],
};

function Chip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[#0F8564] bg-[#E6F4EA] px-2 py-0.5 text-xs text-[#0F8564]">
      {label}
      <button onClick={onRemove} className="hover:text-[#0b6b4f]">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

export default function VisualWells({ visual, onRemoveField }) {
  if (visual.chartType === 'table') {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-[#323130]">Columns</span>
        <div className="flex flex-wrap gap-1.5 rounded border border-dashed border-[#D0D0D0] p-2">
          {visual.config.columns.length === 0 ? (
            <span className="text-xs italic text-[#8A8886]">No fields assigned.</span>
          ) : (
            visual.config.columns.map((col) => (
              <Chip key={col} label={col} onRemove={() => onRemoveField(col)} />
            ))
          )}
        </div>
      </div>
    );
  }

  const wells = WELLS_BY_TYPE[visual.chartType] ?? WELLS_BY_TYPE.bar;

  return (
    <div className="flex flex-col gap-3">
      {wells.map(({ key, label }) => (
        <div key={key} className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-[#323130]">{label}</span>
          <div className="flex flex-wrap gap-1.5 rounded border border-dashed border-[#D0D0D0] p-2">
            {visual.config[key] ? (
              <Chip label={visual.config[key]} onRemove={() => onRemoveField(key)} />
            ) : (
              <span className="text-xs italic text-[#8A8886]">Add data fields here</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
