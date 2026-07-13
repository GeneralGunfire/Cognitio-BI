import * as XLSX from 'xlsx';

// Parses a File (xlsx/xls/csv) entirely client-side. Returns
// { sheetNames: string[], sheets: { [name]: object[] } } where each sheet's
// rows are plain objects keyed by header row values (SheetJS sheet_to_json defaults).
export async function parseWorkbookFile(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  const sheets = {};
  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    sheets[sheetName] = XLSX.utils.sheet_to_json(worksheet, { defval: null });
  }

  return { sheetNames: workbook.SheetNames, sheets };
}

export function inferSourceType(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith('.csv')) return 'csv';
  return 'xlsx';
}
