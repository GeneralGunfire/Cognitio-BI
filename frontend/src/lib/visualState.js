// In-memory-only model for a visual placed on the report canvas this
// milestone (see Milestone 5 report-back: no backend persistence for report
// layout exists yet, so this state lives in React state and is lost on
// refresh). Shape deliberately mirrors the chart `config` shape documented
// for the eventual dashboards/charts backend model (`{ x, y, series }` for
// bar/line, `{ x, y }` for pie treated as category/value, `{ columns }` for
// table) so a future persistence layer can adopt it with minimal translation.
//
// A visual is:
//   { id, chartType, config: { x, y, series } | { columns }, position }
// - chartType: 'bar' | 'line' | 'pie' | 'table'
// - config.x / config.y / config.series: column names (strings) or null
// - config.columns: string[] (table only)
// - position: { x, y, width, height } in canvas pixels. Move (Part B) and
//   resize (Part C) both just update this object — nothing else about a
//   visual depends on its position.

let nextVisualId = 1;

export function createVisualId() {
  return nextVisualId++;
}

export function defaultChartTypeForField(fieldType) {
  return fieldType === 'number' ? 'bar' : 'table';
}

const DEFAULT_VISUAL_SIZE = { width: 360, height: 260 };
export const MIN_VISUAL_SIZE = { width: 150, height: 100 };

// Builds a starting visual from a single dropped field, matching Power BI's
// real single-field-drop behavior: a numeric field becomes a column/bar
// chart (aggregated by row position, since no aggregation UI exists yet in
// this milestone); a text/categorical field becomes a table. `dropPosition`
// is the canvas-relative point the field was dropped at; the visual is
// placed with that point as its top-left corner.
export function createVisualFromField(field, dropPosition) {
  const chartType = defaultChartTypeForField(field.type);
  const position = { ...dropPosition, ...DEFAULT_VISUAL_SIZE };

  if (chartType === 'table') {
    return {
      id: createVisualId(),
      chartType: 'table',
      config: { columns: [field.name] },
      position,
    };
  }

  return {
    id: createVisualId(),
    chartType: 'bar',
    config: { x: null, y: field.name, series: null },
    position,
  };
}

// Builds a starting visual from MULTIPLE dropped fields at once (Part E):
// numeric fields fill Values-like wells (y, then series slots for a table's
// columns), text fields fill Category-like wells (x). This mirrors the same
// numeric-vs-categorical default heuristic as the single-field case, just
// applied to a whole selection in one action instead of one visual per field.
export function createVisualFromFields(fields, dropPosition) {
  if (fields.length === 1) return createVisualFromField(fields[0], dropPosition);

  const position = { ...dropPosition, ...DEFAULT_VISUAL_SIZE };
  const numeric = fields.filter((f) => f.type === 'number');
  const categorical = fields.filter((f) => f.type !== 'number');

  // No sensible bar/line/pie mapping for "many numeric + many categorical"
  // with only x/y/series wells — a table can hold an arbitrary field count,
  // so multi-field drops land as a table unless it's exactly one category +
  // one measure (the one case bar/line naturally supports).
  if (numeric.length === 1 && categorical.length === 1) {
    return {
      id: createVisualId(),
      chartType: 'bar',
      config: { x: categorical[0].name, y: numeric[0].name, series: null },
      position,
    };
  }
  if (numeric.length === 1 && categorical.length === 2) {
    return {
      id: createVisualId(),
      chartType: 'bar',
      config: { x: categorical[0].name, y: numeric[0].name, series: categorical[1].name },
      position,
    };
  }

  return {
    id: createVisualId(),
    chartType: 'table',
    config: { columns: fields.map((f) => f.name) },
    position,
  };
}

export function assignFieldToWell(visual, wellKey, fieldName) {
  if (visual.chartType === 'table') {
    const columns = visual.config.columns.includes(fieldName)
      ? visual.config.columns
      : [...visual.config.columns, fieldName];
    return { ...visual, config: { ...visual.config, columns } };
  }
  return { ...visual, config: { ...visual.config, [wellKey]: fieldName } };
}

// Assigns one field to whichever well suits its inferred type, for a
// drop-onto-existing-visual action (Part D) where the user didn't pick a
// specific well — numeric -> Values (y), text/categorical -> Category (x)
// preferentially, falling back to series/columns if that well is taken.
// Re-dropping a field already assigned to this visual is a no-op, matching
// assignFieldToWell's existing single-field-per-well behavior (last drop
// wins, no duplicate wells invented here).
export function assignFieldAutoWell(visual, field) {
  if (visual.chartType === 'table') {
    return assignFieldToWell(visual, 'columns', field.name);
  }

  const { x, y, series } = visual.config;
  if (field.type === 'number') {
    if (y === field.name) return visual;
    return assignFieldToWell(visual, 'y', field.name);
  }

  if (x === field.name || series === field.name) return visual;
  if (!x) return assignFieldToWell(visual, 'x', field.name);
  if (!series) return assignFieldToWell(visual, 'series', field.name);
  return assignFieldToWell(visual, 'x', field.name);
}

// Same as assignFieldAutoWell but for a whole multi-select drop (Part E onto
// an existing visual): applies each field in turn, numeric fields first so a
// lone Values well is filled before Category/Series, matching the same
// heuristic used when creating a new visual from a multi-field drop.
export function assignFieldsAutoWell(visual, fields) {
  const ordered = [...fields].sort((a, b) => (a.type === 'number' ? -1 : 1) - (b.type === 'number' ? -1 : 1));
  return ordered.reduce((acc, field) => assignFieldAutoWell(acc, field), visual);
}

export function removeFieldFromWell(visual, wellKey) {
  if (visual.chartType === 'table') {
    return {
      ...visual,
      config: { ...visual.config, columns: visual.config.columns.filter((c) => c !== wellKey) },
    };
  }
  return { ...visual, config: { ...visual.config, [wellKey]: null } };
}

// Switching chart type keeps the same field assignments where the well
// model is compatible (bar/line/pie all share x/y/series conceptually).
export function changeVisualType(visual, newChartType) {
  if (newChartType === 'table') {
    const columns = [visual.config.x, visual.config.y, visual.config.series].filter(Boolean);
    return { ...visual, chartType: 'table', config: { columns } };
  }
  if (visual.chartType === 'table') {
    const [x, y] = visual.config.columns;
    return { ...visual, chartType: newChartType, config: { x: x ?? null, y: y ?? null, series: null } };
  }
  return { ...visual, chartType: newChartType };
}

export function deleteVisual(visuals, visualId) {
  return visuals.filter((v) => v.id !== visualId);
}

// Clamps a proposed { x, y } move so the visual's current width/height stays
// fully within [0, canvasWidth] x [0, canvasHeight] — dragging can't push a
// visual fully off the visible canvas.
export function moveVisual(visual, nextX, nextY, canvasSize) {
  const maxX = Math.max(0, canvasSize.width - visual.position.width);
  const maxY = Math.max(0, canvasSize.height - visual.position.height);
  return {
    ...visual,
    position: {
      ...visual.position,
      x: Math.min(Math.max(0, nextX), maxX),
      y: Math.min(Math.max(0, nextY), maxY),
    },
  };
}

// Clamps a proposed { width, height } resize to the enforced minimum size
// and (optionally) to not overflow the canvas from the visual's current x/y.
export function resizeVisual(visual, nextWidth, nextHeight, canvasSize) {
  const maxWidth = canvasSize ? canvasSize.width - visual.position.x : Infinity;
  const maxHeight = canvasSize ? canvasSize.height - visual.position.y : Infinity;
  return {
    ...visual,
    position: {
      ...visual.position,
      width: Math.min(Math.max(MIN_VISUAL_SIZE.width, nextWidth), maxWidth),
      height: Math.min(Math.max(MIN_VISUAL_SIZE.height, nextHeight), maxHeight),
    },
  };
}
