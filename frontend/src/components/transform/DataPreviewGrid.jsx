import { useMemo, useState } from 'react';
import ColumnTypeIcon from '@/components/transform/ColumnTypeIcon';
import ColumnContextMenu from '@/components/transform/ColumnContextMenu';
import { inferColumnType } from '@/lib/inferColumnType';
import { cn } from '@/lib/utils';

export default function DataPreviewGrid({ rows, onColumnAction, selectedColumn, onSelectColumn }) {
  const [menu, setMenu] = useState(null);

  const columns = useMemo(() => (rows.length > 0 ? Object.keys(rows[0]) : []), [rows]);
  const columnTypes = useMemo(
    () => Object.fromEntries(columns.map((c) => [c, inferColumnType(rows, c)])),
    [rows, columns]
  );

  const handleContextMenu = (e, column) => {
    e.preventDefault();
    onSelectColumn(column);
    setMenu({ x: e.clientX, y: e.clientY, column });
  };

  if (columns.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-[#8A8886]">
        No data to preview.
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-auto bg-white"
      onClick={(e) => {
        if (e.target === e.currentTarget) onSelectColumn(null);
      }}
    >
      <table className="w-full border-collapse text-left text-xs">
        <thead>
          <tr>
            <th className="sticky top-0 w-10 border-b border-r border-[#E1DFDD] bg-[#FAF9F8] px-2 py-2 text-[#8A8886]">
              #
            </th>
            {columns.map((col) => (
              <th
                key={col}
                onClick={() => onSelectColumn(col)}
                onContextMenu={(e) => handleContextMenu(e, col)}
                className={cn(
                  'sticky top-0 cursor-pointer whitespace-nowrap border-b border-[#E1DFDD] px-3 py-2 font-semibold text-[#323130]',
                  col === selectedColumn ? 'bg-[#CFE4FA]' : 'bg-[#FAF9F8]'
                )}
                title="Click to select, right-click for column actions"
              >
                <span className="flex items-center gap-1.5">
                  <ColumnTypeIcon type={columnTypes[col]} />
                  {col}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-[#F0F0F0] hover:bg-[#FAF9F8]">
              <td className="border-r border-[#E1DFDD] px-2 py-1.5 text-[#8A8886]">{i + 1}</td>
              {columns.map((col) => (
                <td
                  key={col}
                  className={cn(
                    'whitespace-nowrap px-3 py-1.5 text-[#323130]',
                    col === selectedColumn && 'bg-[#EFF6FC]'
                  )}
                >
                  {row[col] === null || row[col] === undefined ? '' : String(row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {menu && (
        <ColumnContextMenu
          x={menu.x}
          y={menu.y}
          column={menu.column}
          onAction={(action, column) => {
            setMenu(null);
            onColumnAction(action, column);
          }}
          onClose={() => setMenu(null)}
        />
      )}
    </div>
  );
}
