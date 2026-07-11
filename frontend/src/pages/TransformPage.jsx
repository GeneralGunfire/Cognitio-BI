import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';

const OPERATIONS = [
  { value: 'rename_column', label: 'Rename column' },
  { value: 'change_type', label: 'Change type' },
  { value: 'remove_column', label: 'Remove column' },
  { value: 'reorder_columns', label: 'Reorder columns' },
  { value: 'filter_rows', label: 'Filter rows' },
  { value: 'remove_duplicates', label: 'Remove duplicates' },
  { value: 'trim_text', label: 'Trim text' },
  { value: 'split_column', label: 'Split column' },
  { value: 'fill_down', label: 'Fill down' },
];

function StepForm({ columns, onAdd }) {
  const [operation, setOperation] = useState(OPERATIONS[0].value);
  const [column, setColumn] = useState('');
  const [newName, setNewName] = useState('');
  const [targetType, setTargetType] = useState('text');
  const [operator, setOperator] = useState('equals');
  const [value, setValue] = useState('');
  const [caseTransform, setCaseTransform] = useState('none');
  const [delimiter, setDelimiter] = useState(',');
  const [newColumns, setNewColumns] = useState('');
  const [columnOrder, setColumnOrder] = useState('');
  const [dupColumns, setDupColumns] = useState('');

  function buildParams() {
    switch (operation) {
      case 'rename_column':
        return { column, new_name: newName };
      case 'change_type':
        return { column, target_type: targetType };
      case 'remove_column':
        return { column };
      case 'reorder_columns':
        return { column_order: columnOrder.split(',').map((s) => s.trim()).filter(Boolean) };
      case 'filter_rows':
        return { column, operator, value };
      case 'remove_duplicates':
        return {
          columns: dupColumns.split(',').map((s) => s.trim()).filter(Boolean),
        };
      case 'trim_text':
        return { column, case_transform: caseTransform === 'none' ? undefined : caseTransform };
      case 'split_column':
        return {
          column,
          delimiter,
          new_columns: newColumns.split(',').map((s) => s.trim()).filter(Boolean),
        };
      case 'fill_down':
        return { column };
      default:
        return {};
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    onAdd(operation, buildParams());
  }

  const needsColumn = !['reorder_columns', 'remove_duplicates'].includes(operation);

  return (
    <form className="step-form" onSubmit={handleSubmit}>
      <label>
        Operation{' '}
        <select value={operation} onChange={(e) => setOperation(e.target.value)}>
          {OPERATIONS.map((op) => (
            <option key={op.value} value={op.value}>
              {op.label}
            </option>
          ))}
        </select>
      </label>

      {needsColumn && (
        <label>
          Column{' '}
          <select value={column} onChange={(e) => setColumn(e.target.value)}>
            <option value="">-- select --</option>
            {columns.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      )}

      {operation === 'rename_column' && (
        <label>
          New name <input value={newName} onChange={(e) => setNewName(e.target.value)} />
        </label>
      )}

      {operation === 'change_type' && (
        <label>
          Target type{' '}
          <select value={targetType} onChange={(e) => setTargetType(e.target.value)}>
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="date">Date</option>
            <option value="boolean">Boolean</option>
          </select>
        </label>
      )}

      {operation === 'reorder_columns' && (
        <label>
          Column order (comma-separated){' '}
          <input value={columnOrder} onChange={(e) => setColumnOrder(e.target.value)} />
        </label>
      )}

      {operation === 'filter_rows' && (
        <>
          <label>
            Operator{' '}
            <select value={operator} onChange={(e) => setOperator(e.target.value)}>
              <option value="equals">Equals</option>
              <option value="contains">Contains</option>
              <option value="greater_than">Greater than</option>
              <option value="less_than">Less than</option>
              <option value="is_blank">Is blank</option>
              <option value="is_not_blank">Is not blank</option>
            </select>
          </label>
          {!['is_blank', 'is_not_blank'].includes(operator) && (
            <label>
              Value <input value={value} onChange={(e) => setValue(e.target.value)} />
            </label>
          )}
        </>
      )}

      {operation === 'remove_duplicates' && (
        <label>
          Columns to match on (comma-separated, blank = whole row){' '}
          <input value={dupColumns} onChange={(e) => setDupColumns(e.target.value)} />
        </label>
      )}

      {operation === 'trim_text' && (
        <label>
          Case{' '}
          <select value={caseTransform} onChange={(e) => setCaseTransform(e.target.value)}>
            <option value="none">No change</option>
            <option value="upper">UPPER</option>
            <option value="lower">lower</option>
          </select>
        </label>
      )}

      {operation === 'split_column' && (
        <>
          <label>
            Delimiter <input value={delimiter} onChange={(e) => setDelimiter(e.target.value)} />
          </label>
          <label>
            New column names (comma-separated){' '}
            <input value={newColumns} onChange={(e) => setNewColumns(e.target.value)} />
          </label>
        </>
      )}

      <button type="submit">Add step</button>
    </form>
  );
}

export default function TransformPage() {
  const { id } = useParams();
  const [steps, setSteps] = useState([]);
  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [stepsRes, viewRes] = await Promise.all([
        fetch(`/api/datasets/${id}/transform-steps`),
        fetch(`/api/datasets/${id}/transformed-view`),
      ]);
      const stepsBody = await stepsRes.json();
      const viewBody = await viewRes.json();

      if (!stepsRes.ok) throw new Error(stepsBody.error || 'Failed to load steps.');
      if (!viewRes.ok) throw new Error(viewBody.error || 'Failed to load transformed view.');

      setSteps(stepsBody);
      setRows(viewBody.rows);
      setRowCount(viewBody.rowCount);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleAdd(operationType, params) {
    setError(null);
    try {
      const res = await fetch(`/api/datasets/${id}/transform-steps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation_type: operationType, params }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Failed to add step.');
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(stepId) {
    setError(null);
    try {
      const res = await fetch(`/api/datasets/${id}/transform-steps/${stepId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Failed to delete step.');
      }
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <section>
      <h1>Transform Dataset #{id}</h1>
      <p>
        <Link to="/import">Back to Import</Link>
      </p>

      {error && <p className="error">{error}</p>}
      {loading && <p>Loading…</p>}

      <div className="transform-layout">
        <div className="applied-steps">
          <h2>Applied Steps</h2>
          {steps.length === 0 && <p>No steps yet.</p>}
          <ol>
            {steps.map((step) => (
              <li key={step.id}>
                <strong>{step.operation_type}</strong>
                <pre>{JSON.stringify(step.params, null, 0)}</pre>
                <button onClick={() => handleDelete(step.id)}>Delete</button>
              </li>
            ))}
          </ol>

          <h3>Add Step</h3>
          <StepForm columns={columns} onAdd={handleAdd} />
        </div>

        <div className="preview">
          <h2>Preview ({rowCount} rows total)</h2>
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
                {rows.map((row, i) => (
                  <tr key={i}>
                    {columns.map((col) => (
                      <td key={col}>{String(row[col] ?? '')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
