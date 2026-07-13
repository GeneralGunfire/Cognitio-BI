// Thin glue layer: the actual transform operation logic lives in the shared
// @bi-platform/transform-core package so it can be reused unchanged by the
// frontend's client-side step-index preview (frontend/src/lib/replaySteps.js)
// without a network round trip. This file exists only so the rest of the
// backend keeps importing from '../transforms/engine.js' as before.
export { applyStep, replaySteps, SUPPORTED_OPERATIONS } from '@bi-platform/transform-core';
