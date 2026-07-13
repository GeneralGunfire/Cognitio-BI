export async function listSteps(datasetId) {
  const res = await fetch(`/api/datasets/${datasetId}/transform-steps`);
  if (!res.ok) throw new Error('Failed to load transform steps.');
  return res.json();
}

export async function createStep(datasetId, operationType, params) {
  const res = await fetch(`/api/datasets/${datasetId}/transform-steps`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operation_type: operationType, params }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to create step.');
  }
  return res.json();
}

export async function deleteStep(datasetId, stepId) {
  const res = await fetch(`/api/datasets/${datasetId}/transform-steps/${stepId}`, {
    method: 'DELETE',
  });
  if (!res.ok && res.status !== 204) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to delete step.');
  }
}

export async function reorderSteps(datasetId, stepIds) {
  const res = await fetch(`/api/datasets/${datasetId}/transform-steps/reorder`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ step_ids: stepIds }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to reorder steps.');
  }
  return res.json();
}

export async function getTransformedView(datasetId, limit = 100) {
  const res = await fetch(`/api/datasets/${datasetId}/transformed-view?limit=${limit}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to load transformed data.');
  }
  return res.json();
}

export async function getOriginalRows(datasetId, limit = 500) {
  const res = await fetch(`/api/datasets/${datasetId}/rows?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to load original rows.');
  return res.json();
}
