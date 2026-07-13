import { useDraggable } from '@dnd-kit/core';
import { Table2 } from 'lucide-react';
import ColumnTypeIcon from '@/components/transform/ColumnTypeIcon';
import { cn } from '@/lib/utils';

function FieldRow({ field, selected, onClick }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `field:${field.name}`,
    data: { kind: 'field', field },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={(e) => onClick(field, e)}
      className={cn(
        'flex cursor-grab items-center gap-2 rounded px-2 py-1.5 text-sm text-[#323130] hover:bg-[#F3F2F1] active:cursor-grabbing',
        selected && 'bg-[#EFF6FC] hover:bg-[#EFF6FC]',
        isDragging && 'opacity-40'
      )}
    >
      <ColumnTypeIcon type={field.type} />
      <span className="truncate">{field.name}</span>
    </div>
  );
}

// Multi-select: click selects one field and clears the rest; Ctrl/Cmd+click
// toggles a field in/out of the current selection; Shift+click selects the
// contiguous range from the last-clicked field to the clicked one — the
// standard file-manager/Power-BI-Fields-pane convention.
export default function FieldsPanel({ datasetName, fields, loading, error, selectedFields, onSelectFields }) {
  const handleFieldClick = (field, event) => {
    const isSelected = selectedFields.includes(field.name);

    if (event.shiftKey && selectedFields.length > 0) {
      const lastClicked = selectedFields[selectedFields.length - 1];
      const lastIndex = fields.findIndex((f) => f.name === lastClicked);
      const clickedIndex = fields.findIndex((f) => f.name === field.name);
      const [start, end] = lastIndex < clickedIndex ? [lastIndex, clickedIndex] : [clickedIndex, lastIndex];
      const range = fields.slice(start, end + 1).map((f) => f.name);
      onSelectFields([...new Set([...selectedFields, ...range])]);
      return;
    }

    if (event.ctrlKey || event.metaKey) {
      onSelectFields(
        isSelected ? selectedFields.filter((name) => name !== field.name) : [...selectedFields, field.name]
      );
      return;
    }

    onSelectFields(isSelected && selectedFields.length === 1 ? [] : [field.name]);
  };

  return (
    <div className="flex w-64 flex-shrink-0 flex-col border-l border-[#E1DFDD] bg-white">
      <div className="border-b border-[#E1DFDD] px-3 py-2 text-sm font-semibold text-[#323130]">Data</div>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        {loading && <p className="px-2 py-3 text-xs italic text-[#8A8886]">Loading fields...</p>}
        {error && <p className="px-2 py-3 text-xs text-[#D13438]">{error}</p>}

        {!loading && !error && (
          <>
            <div className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-semibold text-[#323130]">
              <Table2 className="h-3.5 w-3.5 text-[#605E5C]" strokeWidth={1.5} />
              {datasetName}
            </div>
            {fields.length === 0 ? (
              <p className="px-2 py-3 text-xs italic text-[#8A8886]">This dataset has no columns yet.</p>
            ) : (
              fields.map((field) => (
                <FieldRow
                  key={field.name}
                  field={field}
                  selected={selectedFields.includes(field.name)}
                  onClick={handleFieldClick}
                />
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
