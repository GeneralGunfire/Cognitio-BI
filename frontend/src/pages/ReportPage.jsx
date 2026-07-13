import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import Ribbon from '@/components/report/Ribbon';
import ViewSwitcherRail from '@/components/report/ViewSwitcherRail';
import ReportCanvas from '@/components/report/ReportCanvas';
import RightPanes from '@/components/report/RightPanes';
import PageTabsBar from '@/components/report/PageTabsBar';
import FieldsPanel from '@/components/report/FieldsPanel';
import ExcelImportFlow from '@/components/import/ExcelImportFlow';
import ColumnTypeIcon from '@/components/transform/ColumnTypeIcon';
import { getDataset } from '@/lib/datasetsApi';
import { getTransformedView } from '@/lib/transformsApi';
import { inferColumnType } from '@/lib/inferColumnType';
import {
  createVisualFromField,
  createVisualFromFields,
  assignFieldToWell,
  assignFieldAutoWell,
  assignFieldsAutoWell,
  removeFieldFromWell,
  changeVisualType,
  deleteVisual,
  moveVisual,
  resizeVisual,
} from '@/lib/visualState';
import { useToast } from '@/components/ui/Toast';

// Milestone 5b scope notes:
// - Dropping on empty canvas creates a new visual (single or multi-field
//   selection, see createVisualFromField(s)); dropping on an EXISTING
//   visual's card adds the field(s) to it instead (Part D) — both handled
//   in the same DndContext, disambiguated by `over.id` ("report-canvas" vs
//   "visual:<id>") in handleDragEnd below.
// - Canvas-internal move (Part B) reuses the same DndContext too: a visual's
//   header is itself draggable with `data.kind === 'visual'`, so
//   handleDragEnd branches on the DRAGGED item's kind, not just the drop
//   target. One DndContext cleanly covers all three interactions.
// - Resize (Part C) is deliberately NOT dnd-kit — it's a corner/edge pointer
//   drag local to VisualCard, simpler than modeling it as a dnd-kit
//   draggable, and never needs collision detection against other targets.

export default function ReportPage() {
  const { id: datasetId } = useParams();
  const showToast = useToast();

  const [dataset, setDataset] = useState(null);
  const [rows, setRows] = useState([]);
  const [fields, setFields] = useState([]);
  const [fieldsLoading, setFieldsLoading] = useState(false);
  const [fieldsError, setFieldsError] = useState(null);
  const [selectedFieldNames, setSelectedFieldNames] = useState([]);

  const [importOpen, setImportOpen] = useState(false);
  const [visuals, setVisuals] = useState([]);
  const [selectedVisualId, setSelectedVisualId] = useState(null);
  const [newVisualId, setNewVisualId] = useState(null);
  const [activeDrag, setActiveDrag] = useState(null); // { kind: 'field', fields: [...] } | { kind: 'visual', visual }
  const canvasNodeRef = useRef(null);

  const hasDataset = !!datasetId && datasetId !== 'new';

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const loadData = useCallback(async () => {
    if (!hasDataset) return;
    setFieldsLoading(true);
    setFieldsError(null);
    try {
      const [datasetInfo, view] = await Promise.all([
        getDataset(datasetId),
        getTransformedView(datasetId, 500),
      ]);
      setDataset(datasetInfo);
      setRows(view.rows);
      const columnNames = view.rows.length > 0 ? Object.keys(view.rows[0]) : [];
      setFields(columnNames.map((name) => ({ name, type: inferColumnType(view.rows, name) })));
    } catch (err) {
      setFieldsError(err.message);
    } finally {
      setFieldsLoading(false);
    }
  }, [datasetId, hasDataset]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedVisual = useMemo(
    () => visuals.find((v) => v.id === selectedVisualId) ?? null,
    [visuals, selectedVisualId]
  );

  const canvasSize = () => {
    const rect = canvasNodeRef.current?.getBoundingClientRect();
    return rect ? { width: rect.width, height: rect.height } : { width: Infinity, height: Infinity };
  };

  const getDropPosition = (event) => {
    const rect = canvasNodeRef.current?.getBoundingClientRect();
    const pointer = event.activatorEvent;
    if (!rect || !pointer || !event.delta) return { x: 24, y: 24 };
    const approxX = pointer.clientX + event.delta.x - rect.left;
    const approxY = pointer.clientY + event.delta.y - rect.top;
    return { x: Math.max(8, Math.round(approxX - 40)), y: Math.max(8, Math.round(approxY - 20)) };
  };

  const handleDragStart = (event) => {
    const data = event.active.data.current;
    if (data?.kind === 'field') {
      // Dragging a field that's part of the current multi-selection drags
      // the whole selection; dragging a field OUTSIDE the current selection
      // starts a fresh single-field drag (and replaces the selection to
      // match), matching real Fields-pane drag semantics.
      const draggedFields = selectedFieldNames.includes(data.field.name)
        ? fields.filter((f) => selectedFieldNames.includes(f.name))
        : [data.field];
      if (draggedFields.length === 1 && !selectedFieldNames.includes(data.field.name)) {
        setSelectedFieldNames([data.field.name]);
      }
      setActiveDrag({ kind: 'field', fields: draggedFields });
    } else if (data?.kind === 'visual') {
      const visual = visuals.find((v) => v.id === data.visualId);
      if (visual) setActiveDrag({ kind: 'visual', visual });
    }
  };

  const handleDragEnd = (event) => {
    const drag = activeDrag;
    setActiveDrag(null);
    const { active, over, delta } = event;
    const activeData = active.data.current;

    // --- Moving an existing visual within the canvas (Part B) ---
    if (activeData?.kind === 'visual') {
      const visualId = activeData.visualId;
      setVisuals((prev) =>
        prev.map((v) => {
          if (v.id !== visualId) return v;
          return moveVisual(v, v.position.x + delta.x, v.position.y + delta.y, canvasSize());
        })
      );
      return;
    }

    if (!over || activeData?.kind !== 'field' || !drag) return;
    const draggedFields = drag.fields;

    // --- Dropping field(s) onto an EXISTING visual (Part D) ---
    if (typeof over.id === 'string' && over.id.startsWith('visual:')) {
      const visualId = Number(over.id.slice('visual:'.length));
      setVisuals((prev) =>
        prev.map((v) => {
          if (v.id !== visualId) return v;
          return draggedFields.length === 1
            ? assignFieldAutoWell(v, draggedFields[0])
            : assignFieldsAutoWell(v, draggedFields);
        })
      );
      setSelectedVisualId(visualId);
      return;
    }

    // --- Dropping field(s) onto empty canvas creates a new visual ---
    if (over.id !== 'report-canvas') return;
    const dropPosition = getDropPosition(event);
    const visual =
      draggedFields.length === 1
        ? createVisualFromField(draggedFields[0], dropPosition)
        : createVisualFromFields(draggedFields, dropPosition);

    setVisuals((prev) => [...prev, visual]);
    setSelectedVisualId(visual.id);
    setNewVisualId(visual.id);
    setTimeout(() => setNewVisualId((current) => (current === visual.id ? null : current)), 1000);
  };

  const handleSelectVisual = (visualId) => {
    setSelectedVisualId(visualId);
  };

  const handleChangeVisualType = (newChartType) => {
    if (!selectedVisual) return;
    setVisuals((prev) =>
      prev.map((v) => (v.id === selectedVisual.id ? changeVisualType(v, newChartType) : v))
    );
  };

  const handleRemoveField = (wellKeyOrColumn) => {
    if (!selectedVisual) return;
    setVisuals((prev) =>
      prev.map((v) => (v.id === selectedVisual.id ? removeFieldFromWell(v, wellKeyOrColumn) : v))
    );
  };

  const handleResizeVisual = (visualId, nextWidth, nextHeight) => {
    setVisuals((prev) =>
      prev.map((v) => (v.id === visualId ? resizeVisual(v, nextWidth, nextHeight, canvasSize()) : v))
    );
  };

  // Part A: delete with an undo toast, since there's no persistence yet and
  // an accidental delete with no recovery path would be a real regression.
  const handleDeleteVisual = (visualId) => {
    const deletedVisual = visuals.find((v) => v.id === visualId);
    if (!deletedVisual) return;

    setVisuals((prev) => deleteVisual(prev, visualId));
    if (selectedVisualId === visualId) setSelectedVisualId(null);

    showToast(
      'Visual deleted',
      'info',
      {
        durationMs: 8000,
        action: {
          label: 'Undo',
          // Restores the exact same object that was removed (same id,
          // config, and position) — not a freshly re-created visual — so
          // undo can't accidentally drop field assignments or move it.
          onClick: () => {
            setVisuals((prev) => [...prev, deletedVisual]);
            setSelectedVisualId(deletedVisual.id);
          },
        },
      }
    );
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      const target = e.target;
      const isEditableTarget =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if (isEditableTarget || !selectedVisualId) return;
      handleDeleteVisual(selectedVisualId);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVisualId, visuals]);

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex h-screen flex-col bg-white">
        <Ribbon datasetId={datasetId} />
        <div className="flex min-h-0 flex-1">
          <ViewSwitcherRail />
          <ReportCanvas
            onImportExcel={() => setImportOpen(true)}
            hasDataset={hasDataset}
            rows={rows}
            visuals={visuals}
            selectedVisualId={selectedVisualId}
            onSelectVisual={handleSelectVisual}
            newVisualId={newVisualId}
            canvasRef={canvasNodeRef}
            onResizeVisual={handleResizeVisual}
            onDeleteVisual={handleDeleteVisual}
          />
          {hasDataset ? (
            <>
              <RightPanes
                selectedVisual={selectedVisual}
                onChangeType={handleChangeVisualType}
                onRemoveField={handleRemoveField}
              />
              <FieldsPanel
                datasetName={dataset?.name ?? `Dataset ${datasetId}`}
                fields={fields}
                loading={fieldsLoading}
                error={fieldsError}
                selectedFields={selectedFieldNames}
                onSelectFields={setSelectedFieldNames}
              />
            </>
          ) : (
            <RightPanes selectedVisual={null} onChangeType={() => {}} onRemoveField={() => {}} />
          )}
        </div>
        <PageTabsBar />
        <ExcelImportFlow open={importOpen} onClose={() => setImportOpen(false)} />
      </div>

      <DragOverlay>
        {activeDrag?.kind === 'field' && (
          <div className="flex items-center gap-2 rounded border border-[#0F8564] bg-white px-2 py-1.5 text-sm text-[#323130] shadow-lg">
            {activeDrag.fields.length === 1 ? (
              <>
                <ColumnTypeIcon type={activeDrag.fields[0].type} />
                {activeDrag.fields[0].name}
              </>
            ) : (
              <span className="flex items-center gap-1.5">
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#0F8564] px-1 text-xs font-semibold text-white">
                  {activeDrag.fields.length}
                </span>
                fields
              </span>
            )}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
