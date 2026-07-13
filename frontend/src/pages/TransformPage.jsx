import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TransformRibbon from '@/components/transform/TransformRibbon';
import QueriesPane from '@/components/transform/QueriesPane';
import FormulaBar from '@/components/transform/FormulaBar';
import DataPreviewGrid from '@/components/transform/DataPreviewGrid';
import QuerySettingsPane from '@/components/transform/QuerySettingsPane';
import StatusBar from '@/components/transform/StatusBar';
import StepDialog from '@/components/transform/StepDialog';
import { getDataset } from '@/lib/datasetsApi';
import { getOriginalRows, listSteps, createStep, deleteStep, reorderSteps } from '@/lib/transformsApi';
import { replayStepsClientSide } from '@/lib/replaySteps';
import { useToast } from '@/components/ui/Toast';

const OPERATION_TITLES = {
  rename_column: 'Rename Column',
  change_type: 'Change Type',
  remove_column: 'Remove Column',
  filter_rows: 'Filter Rows',
  remove_duplicates: 'Remove Duplicates',
  trim_text: 'Trim / Case',
  split_column: 'Split Column',
  fill_down: 'Fill Down',
};

const COLUMN_SCOPED_OPERATIONS = new Set([
  'rename_column',
  'change_type',
  'remove_column',
  'trim_text',
  'split_column',
  'fill_down',
]);

export default function TransformPage() {
  const { datasetId } = useParams();
  const navigate = useNavigate();
  const showToast = useToast();

  const [dataset, setDataset] = useState(null);
  const [originalRows, setOriginalRows] = useState([]);
  const [steps, setSteps] = useState([]);
  const [selectedStepId, setSelectedStepId] = useState(null);
  const [pendingDialog, setPendingDialog] = useState(null); // { operationType, editingStep }
  const [formulaBarVisible, setFormulaBarVisible] = useState(true);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState(null);
  const [creatingColumn, setCreatingColumn] = useState(false);
  const [customColumnError, setCustomColumnError] = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [datasetInfo, rows, stepList] = await Promise.all([
        getDataset(datasetId),
        getOriginalRows(datasetId, 500),
        listSteps(datasetId),
      ]);
      setDataset(datasetInfo);
      setOriginalRows(rows);
      setSteps(stepList);
      setSelectedStepId(stepList.length > 0 ? stepList[stepList.length - 1].id : null);
    } catch (err) {
      showToast(`Failed to load dataset: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [datasetId, showToast]);

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasetId]);

  const selectedStepIndex = useMemo(
    () => steps.findIndex((s) => s.id === selectedStepId),
    [steps, selectedStepId]
  );

  // No per-step-index preview endpoint exists on the backend (only the fully
  // replayed /transformed-view). Re-derive the preview at the selected step
  // client-side using the same op logic as the backend engine (see
  // lib/replaySteps.js) — this never writes anything, purely a display concern.
  const previewRows = useMemo(() => {
    if (steps.length === 0) return originalRows;
    const stepsUpToSelected = steps.slice(0, selectedStepIndex + 1);
    return replayStepsClientSide(originalRows, stepsUpToSelected);
  }, [originalRows, steps, selectedStepIndex]);

  const currentColumns = useMemo(
    () => (previewRows.length > 0 ? Object.keys(previewRows[0]) : []),
    [previewRows]
  );

  const selectedStep = steps[selectedStepIndex] ?? null;

  const openDialogFor = (operationType, column) => {
    setPendingDialog({ operationType, editingStep: null, presetColumn: column });
  };

  const handleRibbonAction = (action) => {
    if (action === 'close_and_load') {
      handleCloseAndLoad();
      return;
    }
    openDialogFor(action, COLUMN_SCOPED_OPERATIONS.has(action) ? selectedColumn : undefined);
  };

  const handleColumnAction = (action, column) => {
    const map = {
      remove: 'remove_column',
      rename: 'rename_column',
      change_type: 'change_type',
      filter: 'filter_rows',
      trim: 'trim_text',
    };
    openDialogFor(map[action], column);
  };

  const handleEditStep = (step) => {
    setPendingDialog({ operationType: step.operation_type, editingStep: step, presetColumn: null });
  };

  const handleDialogSubmit = async (params) => {
    const { operationType, editingStep } = pendingDialog;
    setPendingDialog(null);
    try {
      if (editingStep) {
        // No PATCH exists for step content — edit-in-place is delete + recreate.
        // Recreate always appends to the end, so if the step wasn't already
        // last, reorder afterward to keep it in its original position.
        const originalIndex = steps.findIndex((s) => s.id === editingStep.id);
        await deleteStep(datasetId, editingStep.id);
        const created = await createStep(datasetId, operationType, params);
        let nextSteps = steps.filter((s) => s.id !== editingStep.id).concat(created);
        if (originalIndex < steps.length - 1) {
          const reordered = [...steps.filter((s) => s.id !== editingStep.id)];
          reordered.splice(originalIndex, 0, created);
          const stepIds = reordered.map((s) => s.id);
          nextSteps = await reorderSteps(datasetId, stepIds);
        }
        setSteps(nextSteps);
        setSelectedStepId(created.id);
      } else {
        const created = await createStep(datasetId, operationType, params);
        setSteps((prev) => [...prev, created]);
        setSelectedStepId(created.id);
      }
    } catch (err) {
      showToast(`Step failed: ${err.message}`, 'error');
    }
  };

  const handleDeleteStep = async (stepId) => {
    try {
      await deleteStep(datasetId, stepId);
      const nextSteps = steps.filter((s) => s.id !== stepId);
      setSteps(nextSteps);
      if (selectedStepId === stepId) {
        setSelectedStepId(nextSteps.length > 0 ? nextSteps[nextSteps.length - 1].id : null);
      }
    } catch (err) {
      showToast(`Delete failed: ${err.message}`, 'error');
    }
  };

  const handleMoveStep = async (stepId, direction) => {
    const index = steps.findIndex((s) => s.id === stepId);
    const swapWith = direction === 'up' ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= steps.length) return;

    const reordered = [...steps];
    [reordered[index], reordered[swapWith]] = [reordered[swapWith], reordered[index]];
    try {
      const nextSteps = await reorderSteps(datasetId, reordered.map((s) => s.id));
      setSteps(nextSteps);
    } catch (err) {
      showToast(`Reorder failed: ${err.message}`, 'error');
    }
  };

  const handleCloseAndLoad = async () => {
    setClosing(true);
    try {
      showToast('Transform steps saved.', 'success');
      navigate(`/report/${datasetId}`);
    } finally {
      setClosing(false);
    }
  };

  const handleStartCreateColumn = () => {
    setCustomColumnError(null);
    setFormulaBarVisible(true);
    setCreatingColumn(true);
  };

  const handleCancelCreateColumn = () => {
    setCreatingColumn(false);
    setCustomColumnError(null);
  };

  const handleCreateCustomColumn = async ({ columnName, expression }) => {
    setCustomColumnError(null);
    try {
      const created = await createStep(datasetId, 'custom_column', { columnName, expression });
      setSteps((prev) => [...prev, created]);
      setSelectedStepId(created.id);
      setCreatingColumn(false);
    } catch (err) {
      setCustomColumnError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white text-sm text-[#605E5C]">
        Loading query editor...
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-white">
      <TransformRibbon
        onAction={handleRibbonAction}
        formulaBarVisible={formulaBarVisible}
        onToggleFormulaBar={() => setFormulaBarVisible((v) => !v)}
        hasColumnSelected={!!selectedColumn}
        onStartCustomColumn={handleStartCreateColumn}
      />
      <FormulaBar
        step={selectedStep}
        visible={formulaBarVisible}
        creatingColumn={creatingColumn}
        onStartCreate={handleStartCreateColumn}
        onCancelCreate={handleCancelCreateColumn}
        onCreateCustomColumn={handleCreateCustomColumn}
        error={customColumnError}
      />

      <div className="flex min-h-0 flex-1">
        <QueriesPane datasetName={dataset?.name ?? `Dataset ${datasetId}`} />
        <DataPreviewGrid
          rows={previewRows}
          onColumnAction={handleColumnAction}
          selectedColumn={selectedColumn}
          onSelectColumn={setSelectedColumn}
        />
        <QuerySettingsPane
          datasetName={dataset?.name ?? `Dataset ${datasetId}`}
          steps={steps}
          selectedStepId={selectedStepId}
          onSelectStep={setSelectedStepId}
          onEditStep={handleEditStep}
          onDeleteStep={handleDeleteStep}
          onMoveStep={handleMoveStep}
        />
      </div>

      <StatusBar rowCount={previewRows.length} columnCount={currentColumns.length} />

      {pendingDialog && (
        <StepDialog
          operationType={pendingDialog.operationType}
          title={OPERATION_TITLES[pendingDialog.operationType] ?? pendingDialog.operationType}
          columns={currentColumns}
          initialParams={
            pendingDialog.editingStep?.params ??
            (pendingDialog.presetColumn ? { column: pendingDialog.presetColumn } : {})
          }
          onSubmit={handleDialogSubmit}
          onClose={() => setPendingDialog(null)}
        />
      )}

      {closing && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30 text-sm text-white">
          Loading...
        </div>
      )}
    </div>
  );
}
