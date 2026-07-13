import { useEffect, useRef, useState } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { X } from 'lucide-react';
import ChartRenderer from '@/components/report/ChartRenderer';
import { cn } from '@/lib/utils';

export default function VisualCard({ visual, rows, selected, onSelect, isNew, onResize, onDeleteClick }) {
  const [justAppeared, setJustAppeared] = useState(isNew);
  const cardRef = useRef(null);

  useEffect(() => {
    if (!isNew) return;
    const timeout = setTimeout(() => setJustAppeared(false), 900);
    return () => clearTimeout(timeout);
  }, [isNew]);

  // Move: the header/chrome strip is the drag handle (dnd-kit), not the
  // whole card, so chart content stays clickable/interactive later.
  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: `visual:${visual.id}`,
    data: { kind: 'visual', visualId: visual.id },
  });

  // Field-drop target: dropping a field from the Fields pane directly onto
  // an existing visual (Part D) adds it to that visual instead of creating
  // a new one — handled by the same DndContext, disambiguated in
  // ReportPage's onDragEnd by `over.id` starting with `visual:`.
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `visual:${visual.id}`,
    data: { kind: 'visual', visualId: visual.id },
  });

  const setRefs = (node) => {
    cardRef.current = node;
    setDragRef(node);
    setDropRef(node);
  };

  const startResize = (e, edge) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = visual.position.width;
    const startHeight = visual.position.height;

    const handleMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      const nextWidth = edge.includes('right') ? startWidth + dx : startWidth;
      const nextHeight = edge.includes('bottom') ? startHeight + dy : startHeight;
      onResize(visual.id, nextWidth, nextHeight);
    };
    const handleUp = () => {
      document.removeEventListener('pointermove', handleMove);
      document.removeEventListener('pointerup', handleUp);
    };
    document.addEventListener('pointermove', handleMove);
    document.addEventListener('pointerup', handleUp);
  };

  return (
    <div
      ref={setRefs}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(visual.id);
      }}
      className={cn(
        'absolute flex flex-col overflow-hidden rounded-md border bg-white shadow-sm transition-shadow',
        selected ? 'border-[#0F8564] ring-2 ring-[#0F8564]/30' : 'border-[#E1DFDD]',
        isOver && 'border-[#0F8564] ring-2 ring-[#0F8564]/60',
        isDragging && 'opacity-50',
        justAppeared && 'animate-[visual-pop_0.5s_ease-out]'
      )}
      style={{
        left: visual.position.x,
        top: visual.position.y,
        width: visual.position.width,
        height: visual.position.height,
      }}
    >
      <div
        {...listeners}
        {...attributes}
        className="flex h-5 flex-shrink-0 cursor-grab items-center justify-end bg-[#FAF9F8] px-1 active:cursor-grabbing"
      >
        {selected && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteClick(visual.id);
            }}
            title="Delete visual"
            className="flex h-4 w-4 items-center justify-center rounded text-[#605E5C] hover:bg-[#FDE7E9] hover:text-[#D13438]"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-hidden p-2">
        <ChartRenderer
          chartType={visual.chartType}
          config={visual.config}
          rows={rows}
          size={{ width: visual.position.width, height: visual.position.height }}
        />
      </div>

      {selected && (
        <>
          <div
            onPointerDown={(e) => startResize(e, 'right')}
            className="absolute right-0 top-0 h-full w-1.5 cursor-ew-resize"
          />
          <div
            onPointerDown={(e) => startResize(e, 'bottom')}
            className="absolute bottom-0 left-0 h-1.5 w-full cursor-ns-resize"
          />
          <div
            onPointerDown={(e) => startResize(e, 'bottom-right')}
            className="absolute bottom-0 right-0 h-3 w-3 cursor-nwse-resize bg-[#0F8564]/70"
            style={{ borderBottomRightRadius: 4 }}
          />
        </>
      )}
    </div>
  );
}
