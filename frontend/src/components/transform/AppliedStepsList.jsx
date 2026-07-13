import { useState } from 'react';
import { Settings, MoreVertical, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { describeStep } from '@/lib/stepMeta';

// custom_column is deliberately excluded: it's created via the formula bar,
// not StepDialog, so there's no edit-in-place UI wired for it yet. Delete +
// recreate via the overflow menu still works for it like every other step.
const EDITABLE_OPERATIONS = new Set([
  'rename_column',
  'change_type',
  'remove_column',
  'filter_rows',
  'trim_text',
  'split_column',
  'fill_down',
]);

export default function AppliedStepsList({ steps, selectedStepId, onSelect, onEdit, onDelete, onMove }) {
  const [menuStepId, setMenuStepId] = useState(null);

  return (
    <div className="flex flex-col gap-0.5">
      {steps.map((step, i) => {
        const { icon: Icon, label } = describeStep(step);
        const isSelected = step.id === selectedStepId;
        const isLast = i === steps.length - 1;

        return (
          <div
            key={step.id}
            className={cn(
              'group flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-[#F3F2F1]',
              isSelected && 'bg-[#EFF6FC]'
            )}
          >
            <button onClick={() => onSelect(step.id)} className="flex flex-1 items-center gap-2 text-left">
              <Icon
                className={cn('h-3.5 w-3.5 flex-shrink-0', isSelected ? 'text-[#0F8564]' : 'text-[#605E5C]')}
                strokeWidth={1.75}
              />
              <span className={cn('truncate text-[#323130]', isSelected && 'font-semibold', isLast && 'italic')}>
                {label}
              </span>
            </button>

            {EDITABLE_OPERATIONS.has(step.operation_type) && (
              <button
                onClick={() => onEdit(step)}
                title="Edit step (deletes and recreates — no in-place edit API exists)"
                className="hidden text-[#605E5C] hover:text-[#323130] group-hover:block"
              >
                <Settings className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
            )}

            <div className="relative">
              <button
                onClick={() => setMenuStepId(menuStepId === step.id ? null : step.id)}
                className="text-[#605E5C] hover:text-[#323130]"
              >
                <MoreVertical className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
              {menuStepId === step.id && (
                <div className="absolute right-0 top-5 z-[100] w-36 rounded-md border border-[#E1DFDD] bg-white py-1 shadow-lg">
                  <button
                    disabled={i === 0}
                    onClick={() => {
                      setMenuStepId(null);
                      onMove(step.id, 'up');
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-[#323130] hover:bg-[#F3F2F1] disabled:opacity-40"
                  >
                    <ArrowUp className="h-3 w-3" /> Move up
                  </button>
                  <button
                    disabled={isLast}
                    onClick={() => {
                      setMenuStepId(null);
                      onMove(step.id, 'down');
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-[#323130] hover:bg-[#F3F2F1] disabled:opacity-40"
                  >
                    <ArrowDown className="h-3 w-3" /> Move down
                  </button>
                  <button
                    onClick={() => {
                      setMenuStepId(null);
                      onDelete(step.id);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-[#D13438] hover:bg-[#FDE7E9]"
                  >
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {steps.length === 0 && (
        <p className="px-2 py-3 text-xs italic text-[#8A8886]">No steps applied yet.</p>
      )}
    </div>
  );
}
