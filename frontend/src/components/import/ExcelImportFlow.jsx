import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FilePickerDialog from '@/components/import/FilePickerDialog';
import NavigatorDialog from '@/components/import/NavigatorDialog';
import { parseWorkbookFile, inferSourceType } from '@/lib/parseWorkbook';
import { useToast } from '@/components/ui/Toast';

const STAGE = {
  CLOSED: 'closed',
  PICKING: 'picking',
  NAVIGATING: 'navigating',
};

export default function ExcelImportFlow({ open, onClose }) {
  const [stage, setStage] = useState(STAGE.CLOSED);
  const [parsing, setParsing] = useState(false);
  const [loadingImport, setLoadingImport] = useState(false);
  const [workbook, setWorkbook] = useState(null);
  const [fileMeta, setFileMeta] = useState(null);
  const navigate = useNavigate();
  const showToast = useToast();

  const currentStage = open ? (workbook ? STAGE.NAVIGATING : STAGE.PICKING) : STAGE.CLOSED;

  const reset = () => {
    setWorkbook(null);
    setFileMeta(null);
    setParsing(false);
    setLoadingImport(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFileSelected = async (file) => {
    setParsing(true);
    try {
      const parsed = await parseWorkbookFile(file);
      setWorkbook(parsed);
      setFileMeta({ name: file.name, sourceType: inferSourceType(file) });
    } catch (err) {
      showToast(`Could not read "${file.name}": ${err.message}`, 'error');
    } finally {
      setParsing(false);
    }
  };

  const importSelectedSheets = async (selectedSheetNames) => {
    // One dataset per selected sheet; caller navigates using the first.
    let firstDatasetId = null;
    for (const sheetName of selectedSheetNames) {
      const rows = workbook.sheets[sheetName] ?? [];
      const datasetName =
        selectedSheetNames.length > 1 ? `${fileMeta.name} — ${sheetName}` : fileMeta.name;

      const response = await fetch('/api/datasets/confirm-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: datasetName,
          sourceType: fileMeta.sourceType,
          rows,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Import failed (${response.status})`);
      }

      const { dataset } = await response.json();
      if (firstDatasetId === null) firstDatasetId = dataset.id;
    }
    return firstDatasetId;
  };

  const handleTransform = async (selectedSheetNames) => {
    if (selectedSheetNames.length === 0 || !workbook || !fileMeta) return;
    setLoadingImport(true);
    try {
      const firstDatasetId = await importSelectedSheets(selectedSheetNames);
      handleClose();
      navigate(`/transform/${firstDatasetId}`);
    } catch (err) {
      showToast(`Import failed: ${err.message}`, 'error');
    } finally {
      setLoadingImport(false);
    }
  };

  const handleLoad = async (selectedSheetNames) => {
    if (selectedSheetNames.length === 0 || !workbook || !fileMeta) return;
    setLoadingImport(true);
    try {
      const firstDatasetId = await importSelectedSheets(selectedSheetNames);
      showToast('Data loaded successfully.', 'success');
      handleClose();
      navigate(`/report/${firstDatasetId}`);
    } catch (err) {
      showToast(`Import failed: ${err.message}`, 'error');
    } finally {
      setLoadingImport(false);
    }
  };

  return (
    <>
      <FilePickerDialog
        open={currentStage === STAGE.PICKING}
        loading={parsing}
        onFileSelected={handleFileSelected}
        onClose={handleClose}
      />
      {workbook && (
        <NavigatorDialog
          open={currentStage === STAGE.NAVIGATING}
          fileName={fileMeta?.name}
          sheetNames={workbook.sheetNames}
          sheets={workbook.sheets}
          loading={loadingImport}
          onLoad={handleLoad}
          onTransform={handleTransform}
          onClose={handleClose}
        />
      )}
    </>
  );
}
