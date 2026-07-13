import { useEffect, useRef } from 'react';
import { Trash2, TextCursorInput, ToggleLeft, Filter, Scissors } from 'lucide-react';

const ITEMS = [
  { key: 'remove', label: 'Remove', icon: Trash2 },
  { key: 'rename', label: 'Rename', icon: TextCursorInput },
  { key: 'change_type', label: 'Change Type', icon: ToggleLeft },
  { key: 'filter', label: 'Filter Rows', icon: Filter },
  { key: 'trim', label: 'Trim Text', icon: Scissors },
];

export default function ColumnContextMenu({ x, y, column, onAction, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{ top: y, left: x }}
      className="fixed z-[200] w-52 rounded-md border border-[#E1DFDD] bg-white py-1 shadow-lg"
    >
      <div className="border-b border-[#E1DFDD] px-3 py-1.5 text-xs font-semibold text-[#605E5C]">
        {column}
      </div>
      {ITEMS.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => onAction(key, column)}
          className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-[#323130] hover:bg-[#F3F2F1]"
        >
          <Icon className="h-3.5 w-3.5 text-[#605E5C]" strokeWidth={1.5} />
          {label}
        </button>
      ))}
    </div>
  );
}
