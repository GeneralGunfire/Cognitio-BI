import { MoreHorizontal, Maximize2, BarChart3, LineChart, PieChart, Table } from 'lucide-react';
import VisualWells from '@/components/report/VisualWells';
import { cn } from '@/lib/utils';

const CHART_TYPES = [
  { key: 'bar', label: 'Bar chart', icon: BarChart3 },
  { key: 'line', label: 'Line chart', icon: LineChart },
  { key: 'pie', label: 'Pie chart', icon: PieChart },
  { key: 'table', label: 'Table', icon: Table },
];

export default function BuildPane({ selectedVisual, onChangeType, onRemoveField }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <div className="flex items-center justify-between border-b border-[#E1DFDD] px-3 py-2">
        <span className="text-sm font-semibold text-[#323130]">Build</span>
        <div className="flex items-center gap-2 text-[#605E5C]">
          <MoreHorizontal className="h-4 w-4" strokeWidth={1.5} />
          <Maximize2 className="h-3.5 w-3.5" strokeWidth={1.5} />
        </div>
      </div>

      {!selectedVisual ? (
        <div className="flex flex-1 items-center justify-center px-4 text-center text-xs text-[#8A8886]">
          Select a visual on the canvas to edit its type and fields.
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-3 py-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[#323130]">Visual type</span>
            <div className="flex gap-1.5">
              {CHART_TYPES.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  title={label}
                  onClick={() => onChangeType(key)}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded border text-[#605E5C] hover:bg-[#F3F2F1]',
                    selectedVisual.chartType === key
                      ? 'border-[#0F8564] bg-[#E6F4EA] text-[#0F8564]'
                      : 'border-[#E1DFDD]'
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.5} />
                </button>
              ))}
            </div>
          </div>

          <VisualWells visual={selectedVisual} onRemoveField={onRemoveField} />
        </div>
      )}
    </div>
  );
}
