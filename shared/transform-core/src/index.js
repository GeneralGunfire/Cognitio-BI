// Single source of truth for the transform_steps operation logic. Pure,
// side-effect-free functions only — no DB access, no Express, no React/DOM.
// Used identically by:
//   - backend/src/transforms/engine.js (persistence/routing glue)
//   - frontend/src/lib/replaySteps.js (client-side step-index preview)
// Both call applyStep/replaySteps directly rather than each keeping their own
// copy of the operation logic, so a fix or new op only needs to happen here.

import { evaluate } from 'mathjs';

function isBlank(value) {
  return value === null || value === undefined || value === '';
}

function renameColumn(rows, { column, new_name }) {
  return rows.map((row) => {
    if (!(column in row)) return row;
    const { [column]: value, ...rest } = row;
    return { ...rest, [new_name]: value };
  });
}

function coerceType(value, type) {
  if (isBlank(value)) return null;

  switch (type) {
    case 'number': {
      const n = Number(value);
      return Number.isNaN(n) ? null : n;
    }
    case 'boolean': {
      if (typeof value === 'boolean') return value;
      const s = String(value).trim().toLowerCase();
      if (['true', '1', 'yes'].includes(s)) return true;
      if (['false', '0', 'no'].includes(s)) return false;
      return null;
    }
    case 'date': {
      const d = new Date(value);
      return Number.isNaN(d.getTime()) ? null : d.toISOString();
    }
    case 'text':
    default:
      return String(value);
  }
}

function changeType(rows, { column, target_type }) {
  return rows.map((row) => {
    if (!(column in row)) return row;
    return { ...row, [column]: coerceType(row[column], target_type) };
  });
}

function removeColumn(rows, { column }) {
  return rows.map((row) => {
    const { [column]: _omit, ...rest } = row;
    return rest;
  });
}

function reorderColumns(rows, { column_order }) {
  return rows.map((row) => {
    const reordered = {};
    for (const col of column_order) {
      if (col in row) reordered[col] = row[col];
    }
    for (const col of Object.keys(row)) {
      if (!(col in reordered)) reordered[col] = row[col];
    }
    return reordered;
  });
}

function matchesFilter(value, operator, compareValue) {
  switch (operator) {
    case 'equals':
      return String(value ?? '') === String(compareValue ?? '');
    case 'contains':
      return String(value ?? '').toLowerCase().includes(String(compareValue ?? '').toLowerCase());
    case 'greater_than':
      return Number(value) > Number(compareValue);
    case 'less_than':
      return Number(value) < Number(compareValue);
    case 'is_blank':
      return isBlank(value);
    case 'is_not_blank':
      return !isBlank(value);
    default:
      return true;
  }
}

function filterRows(rows, { column, operator, value }) {
  return rows.filter((row) => matchesFilter(row[column], operator, value));
}

function removeDuplicates(rows, { columns }) {
  const seen = new Set();
  const result = [];
  for (const row of rows) {
    const key = columns && columns.length > 0
      ? JSON.stringify(columns.map((c) => row[c]))
      : JSON.stringify(row);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(row);
  }
  return result;
}

function trimText(rows, { column, case_transform }) {
  return rows.map((row) => {
    if (!(column in row) || typeof row[column] !== 'string') return row;
    let value = row[column].trim();
    if (case_transform === 'upper') value = value.toUpperCase();
    else if (case_transform === 'lower') value = value.toLowerCase();
    return { ...row, [column]: value };
  });
}

function splitColumn(rows, { column, delimiter, new_columns }) {
  return rows.map((row) => {
    if (!(column in row)) return row;
    const parts = String(row[column] ?? '').split(delimiter);
    const additions = {};
    (new_columns || parts.map((_, i) => `${column}_${i + 1}`)).forEach((name, i) => {
      additions[name] = parts[i] ?? null;
    });
    return { ...row, ...additions };
  });
}

function fillDown(rows, { column }) {
  let last = null;
  return rows.map((row) => {
    if (!(column in row)) return row;
    if (isBlank(row[column])) {
      return { ...row, [column]: last };
    }
    last = row[column];
    return row;
  });
}

// Matches Power Query's bracket-reference convention, e.g. [Price] * [Qty].
const COLUMN_REFERENCE_PATTERN = /\[([^\]]+)\]/g;

// Turns bracket references into mathjs-safe scope variable names (mathjs
// identifiers can't contain spaces/punctuation the way column names can),
// then evaluates the rewritten expression against a scope of substituted
// values — never string-concatenation or eval(), so row data can't be
// interpreted as code.
export function evaluateCustomColumnExpression(expression, row) {
  const scope = {};
  let refIndex = 0;
  const referencedColumns = [];

  const rewritten = expression.replace(COLUMN_REFERENCE_PATTERN, (_match, columnName) => {
    const varName = `__col${refIndex++}`;
    referencedColumns.push(columnName);
    scope[varName] = isBlank(row[columnName]) ? null : row[columnName];
    return varName;
  });

  for (const columnName of referencedColumns) {
    if (!(columnName in row)) {
      throw new Error(`Unknown column reference: [${columnName}]`);
    }
  }

  try {
    return evaluate(rewritten, scope);
  } catch (err) {
    throw new Error(`Invalid expression "${expression}": ${err.message}`);
  }
}

function customColumn(rows, { columnName, expression }) {
  if (!columnName || typeof columnName !== 'string') {
    throw new Error('"custom_column" requires a "columnName" string.');
  }
  if (!expression || typeof expression !== 'string') {
    throw new Error('"custom_column" requires an "expression" string.');
  }

  // Validate against the first row up front so a bad expression fails the
  // whole step clearly, rather than silently producing null for every row.
  if (rows.length > 0) {
    evaluateCustomColumnExpression(expression, rows[0]);
  }

  return rows.map((row) => ({
    ...row,
    [columnName]: evaluateCustomColumnExpression(expression, row),
  }));
}

const OPERATIONS = {
  rename_column: renameColumn,
  change_type: changeType,
  remove_column: removeColumn,
  reorder_columns: reorderColumns,
  filter_rows: filterRows,
  remove_duplicates: removeDuplicates,
  trim_text: trimText,
  split_column: splitColumn,
  fill_down: fillDown,
  custom_column: customColumn,
};

export function applyStep(rows, step) {
  const operation = OPERATIONS[step.operation_type];
  if (!operation) {
    throw new Error(`Unknown operation_type: ${step.operation_type}`);
  }
  return operation(rows, step.params || {});
}

export function replaySteps(originalRows, steps) {
  return steps.reduce((rows, step) => applyStep(rows, step), originalRows);
}

export const SUPPORTED_OPERATIONS = Object.keys(OPERATIONS);
