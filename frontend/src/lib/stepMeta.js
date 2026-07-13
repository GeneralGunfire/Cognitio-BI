import {
  TextCursorInput,
  ToggleLeft,
  Trash2,
  ArrowLeftRight,
  Filter,
  Copy,
  Scissors,
  SplitSquareHorizontal,
  ArrowDownToLine,
  PlusSquare,
} from 'lucide-react';

const STEP_META = {
  rename_column: { icon: TextCursorInput, label: (p) => `Renamed "${p.column}" to "${p.new_name}"` },
  change_type: { icon: ToggleLeft, label: (p) => `Changed type of "${p.column}" to ${p.target_type}` },
  remove_column: { icon: Trash2, label: (p) => `Removed "${p.column}"` },
  reorder_columns: { icon: ArrowLeftRight, label: () => 'Reordered columns' },
  filter_rows: { icon: Filter, label: (p) => `Filtered rows on "${p.column}" (${p.operator})` },
  remove_duplicates: { icon: Copy, label: () => 'Removed duplicates' },
  trim_text: { icon: Scissors, label: (p) => `Trimmed text in "${p.column}"` },
  split_column: { icon: SplitSquareHorizontal, label: (p) => `Split column "${p.column}"` },
  fill_down: { icon: ArrowDownToLine, label: (p) => `Filled down "${p.column}"` },
  custom_column: { icon: PlusSquare, label: (p) => `Added custom column "${p.columnName}"` },
};

export function describeStep(step) {
  const meta = STEP_META[step.operation_type];
  if (!meta) {
    return { icon: TextCursorInput, label: step.operation_type };
  }
  return { icon: meta.icon, label: meta.label(step.params ?? {}) };
}

// Simplified pseudo-M representation for the Formula Bar — clearly not real M,
// just a readable stand-in for the step's operation + params.
export function pseudoFormula(step) {
  if (!step) return '';
  return `= Table.${step.operation_type}(${JSON.stringify(step.params ?? {})})`;
}
