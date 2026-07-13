// No GET /api/datasets/:id exists — only the list endpoint. Fetch the list
// and find the matching row rather than adding a new backend route for this.
export async function getDataset(datasetId) {
  const res = await fetch('/api/datasets');
  if (!res.ok) throw new Error('Failed to load datasets.');
  const datasets = await res.json();
  return datasets.find((d) => String(d.id) === String(datasetId)) ?? null;
}
