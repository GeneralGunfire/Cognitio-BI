// Presentational-only inference for column header icons — does not affect
// change_type or any transform step, mirrors the same heuristic used in the
// Fields panel elsewhere in the app.
export function inferColumnType(rows, column) {
  for (const row of rows) {
    const value = row[column];
    if (value === null || value === undefined || value === '') continue;
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (!Number.isNaN(Date.parse(value)) && /\d{4}-\d{2}-\d{2}/.test(String(value))) return 'date';
    return 'text';
  }
  return 'text';
}
