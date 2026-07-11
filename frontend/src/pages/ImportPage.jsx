import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';

function parseFile(file) {
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  const sourceType = ext === '.csv' ? 'csv' : 'xlsx';

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.onload = () => {
      try {
        const workbook = XLSX.read(reader.result, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });
        resolve({ rows, sourceType });
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsBinaryString(file);
  });
}

export default function ImportPage() {
  const [file, setFile] = useState(null);
  const [rows, setRows] = useState(null);
  const [sourceType, setSourceType] = useState(null);
  const [datasetName, setDatasetName] = useState('');
  const [dataset, setDataset] = useState(null);
  const [error, setError] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function handleFileSelected(e) {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    setRows(null);
    setDataset(null);
    setError(null);
    if (!selected) return;

    setParsing(true);
    try {
      const { rows: parsedRows, sourceType: type } = await parseFile(selected);
      if (parsedRows.length === 0) {
        throw new Error('File contained no rows.');
      }
      setRows(parsedRows);
      setSourceType(type);
      setDatasetName(selected.name);
    } catch (err) {
      setError(err.message);
    } finally {
      setParsing(false);
    }
  }

  async function handleConfirm() {
    setConfirming(true);
    setError(null);

    try {
      const res = await fetch('/api/datasets/confirm-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: datasetName, sourceType, rows }),
      });
      const body = await res.json();

      if (!res.ok) {
        throw new Error(body.error || 'Import failed.');
      }

      setDataset(body.dataset);
    } catch (err) {
      setError(err.message);
    } finally {
      setConfirming(false);
    }
  }

  const preview = rows ? rows.slice(0, 20) : null;
  const columns = preview && preview.length > 0 ? Object.keys(preview[0]) : [];

  return (
    <section>
      <h1>Import Data</h1>
      <p>Files are parsed in your browser. Nothing is sent to the server until you confirm.</p>

      <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileSelected} />
      {parsing && <p>Parsing…</p>}

      {error && <p className="error">{error}</p>}

      {rows && !dataset && (
        <>
          <div className="import-confirm">
            <label>
              Dataset name{' '}
              <input
                type="text"
                value={datasetName}
                onChange={(e) => setDatasetName(e.target.value)}
              />
            </label>
            <button onClick={handleConfirm} disabled={confirming || !datasetName}>
              {confirming ? 'Importing…' : `Confirm import (${rows.length} rows)`}
            </button>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i}>
                    {columns.map((col) => (
                      <td key={col}>{String(row[col] ?? '')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {dataset && (
        <p>
          Imported <strong>{dataset.name}</strong> ({dataset.source_type}) — dataset id{' '}
          {dataset.id}. <Link to={`/datasets/${dataset.id}/transform`}>Transform this dataset</Link>
        </p>
      )}
    </section>
  );
}
