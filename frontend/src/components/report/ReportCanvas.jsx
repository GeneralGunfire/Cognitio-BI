import { useDroppable } from '@dnd-kit/core';
import { ArrowRight } from 'lucide-react';
import { ExcelIcon, SqlServerIcon } from '@/components/DataSourceIcons';
import { Clipboard, DatabaseZap } from 'lucide-react';
import VisualCard from '@/components/report/VisualCard';

const EMPTY_STATE_CARDS = [
  {
    key: 'excel',
    label: 'Import data from Excel',
    Icon: ExcelIcon,
    bg: 'bg-[#E6F4EA]',
  },
  {
    key: 'sql',
    label: 'Import data from SQL Server',
    Icon: SqlServerIcon,
    bg: 'bg-[#E5F1FB]',
  },
  {
    key: 'paste',
    label: 'Paste data into a blank table',
    Icon: Clipboard,
    bg: 'bg-[#FDF6E3]',
    lucide: true,
  },
  {
    key: 'sample',
    label: 'Use sample data',
    Icon: DatabaseZap,
    bg: 'bg-[#F3F2F1]',
    lucide: true,
  },
];

function EmptyImportPrompt({ onImportExcel }) {
  const handleCardClick = (key) => {
    if (key === 'excel') onImportExcel?.();
  };

  return (
    <div className="flex flex-1 items-center justify-center rounded border border-dashed border-[#D0D0D0] bg-white">
      <div className="flex flex-col items-center gap-6 px-6 text-center">
        <div>
          <h1 className="text-lg font-semibold text-[#323130]">Add data to your report</h1>
          <p className="mt-1 text-sm text-[#605E5C]">
            Once loaded, your data will appear in the <strong className="font-semibold text-[#323130]">Data</strong>{' '}
            pane.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          {EMPTY_STATE_CARDS.map(({ key, label, Icon, bg, lucide }) => (
            <button
              key={key}
              onClick={() => handleCardClick(key)}
              className={`flex w-[200px] flex-col items-center gap-3 rounded-lg ${bg} px-4 py-6 shadow-sm transition-shadow hover:shadow-md`}
            >
              {lucide ? <Icon className="h-8 w-8 text-[#605E5C]" strokeWidth={1.5} /> : <Icon />}
              <span className="text-sm text-[#323130]">{label}</span>
            </button>
          ))}
        </div>

        <button className="flex items-center gap-1.5 text-sm font-medium text-[#0F8564] hover:underline">
          Get data from another source
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function ReportCanvas({
  onImportExcel,
  hasDataset,
  rows,
  visuals,
  selectedVisualId,
  onSelectVisual,
  newVisualId,
  canvasRef,
  onResizeVisual,
  onDeleteVisual,
}) {
  const { setNodeRef, isOver } = useDroppable({ id: 'report-canvas' });

  const setRefs = (node) => {
    setNodeRef(node);
    if (canvasRef) canvasRef.current = node;
  };

  if (!hasDataset) {
    return (
      <div className="flex min-w-0 flex-1 flex-col gap-2 bg-[#FAFAFA] p-3">
        <EmptyImportPrompt onImportExcel={onImportExcel} />
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2 bg-[#FAFAFA] p-3">
      <div
        ref={setRefs}
        onClick={() => onSelectVisual(null)}
        className={`relative flex-1 overflow-auto rounded border bg-white transition-colors ${
          isOver ? 'border-[#0F8564] bg-[#E6F4EA]/40' : 'border-[#E1DFDD]'
        }`}
      >
        {visuals.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-[#8A8886]">
            Drag a field from the Data pane onto the canvas to create a visual.
          </div>
        )}
        {visuals.map((visual) => (
          <VisualCard
            key={visual.id}
            visual={visual}
            rows={rows}
            selected={visual.id === selectedVisualId}
            onSelect={onSelectVisual}
            isNew={visual.id === newVisualId}
            onResize={onResizeVisual}
            onDeleteClick={onDeleteVisual}
          />
        ))}
      </div>
    </div>
  );
}
