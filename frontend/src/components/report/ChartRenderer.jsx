import { useEffect, useRef } from 'react';
import ReactECharts from 'echarts-for-react';

const AXIS_TEXT_STYLE = { color: '#605E5C', fontSize: 11 };

function toNumber(value) {
  const n = Number(value);
  return Number.isNaN(n) ? 0 : n;
}

function buildCategoricalOption(rows, config, chartType) {
  const { x, y, series } = config;
  if (!y) return null;

  const categories = x ? rows.map((row) => String(row[x] ?? '')) : rows.map((_, i) => `${i + 1}`);

  if (series) {
    const seriesValues = [...new Set(rows.map((row) => String(row[series] ?? '')))];
    const grouped = seriesValues.map((seriesValue) => ({
      name: seriesValue,
      type: chartType === 'line' ? 'line' : 'bar',
      data: rows
        .filter((row) => String(row[series] ?? '') === seriesValue)
        .map((row) => toNumber(row[y])),
    }));
    return {
      tooltip: { trigger: 'axis' },
      legend: { top: 0, textStyle: AXIS_TEXT_STYLE },
      grid: { left: 40, right: 16, top: 32, bottom: 32 },
      xAxis: { type: 'category', data: categories, axisLabel: AXIS_TEXT_STYLE },
      yAxis: { type: 'value', axisLabel: AXIS_TEXT_STYLE },
      series: grouped,
    };
  }

  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 16, top: 16, bottom: 32 },
    xAxis: { type: 'category', data: categories, axisLabel: AXIS_TEXT_STYLE },
    yAxis: { type: 'value', axisLabel: AXIS_TEXT_STYLE },
    series: [{ type: chartType === 'line' ? 'line' : 'bar', data: rows.map((row) => toNumber(row[y])) }],
  };
}

function buildPieOption(rows, config) {
  const { x, y } = config;
  if (!x || !y) return null;

  const totals = new Map();
  for (const row of rows) {
    const key = String(row[x] ?? '');
    totals.set(key, (totals.get(key) ?? 0) + toNumber(row[y]));
  }

  return {
    tooltip: { trigger: 'item' },
    legend: { top: 0, textStyle: AXIS_TEXT_STYLE },
    series: [
      {
        type: 'pie',
        radius: '65%',
        data: [...totals.entries()].map(([name, value]) => ({ name, value })),
      },
    ],
  };
}

function TableChart({ rows, columns }) {
  if (columns.length === 0) {
    return <div className="flex h-full items-center justify-center text-xs text-[#8A8886]">No columns assigned.</div>;
  }
  return (
    <div className="h-full overflow-auto">
      <table className="w-full border-collapse text-left text-xs">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col} className="sticky top-0 border-b border-[#E1DFDD] bg-[#FAF9F8] px-2 py-1.5 font-semibold text-[#323130]">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 200).map((row, i) => (
            <tr key={i} className="border-b border-[#F0F0F0]">
              {columns.map((col) => (
                <td key={col} className="whitespace-nowrap px-2 py-1 text-[#323130]">
                  {row[col] === null || row[col] === undefined ? '' : String(row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// echarts-for-react only calls chart.resize() automatically on a window
// resize event. Resizing a VisualCard via its own drag handles changes the
// container's dimensions without ever firing a window resize, so the chart
// canvas would otherwise stay stale (clipped/stretched) until the next
// window resize. `size` (the visual's own width/height) is passed in and
// watched explicitly so every card resize calls the ECharts instance's own
// resize() directly.
export default function ChartRenderer({ chartType, config, rows, size }) {
  const echartsRef = useRef(null);

  useEffect(() => {
    if (echartsRef.current) {
      echartsRef.current.getEchartsInstance().resize();
    }
  }, [size?.width, size?.height]);

  if (chartType === 'table') {
    return <TableChart rows={rows} columns={config.columns} />;
  }

  const option =
    chartType === 'pie' ? buildPieOption(rows, config) : buildCategoricalOption(rows, config, chartType);

  if (!option) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-[#8A8886]">
        Assign fields to this visual to see data.
      </div>
    );
  }

  return <ReactECharts ref={echartsRef} option={option} style={{ height: '100%', width: '100%' }} notMerge />;
}
