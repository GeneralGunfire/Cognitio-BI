// Client-side re-derivation of a dataset's state at an intermediate Applied
// Step. Needed because the backend has no per-step-index preview endpoint
// (only GET /transformed-view, which always replays every step) — this lets
// the Power Query Editor show "data as of step N" without a network round
// trip on every Applied Steps click.
//
// The actual operation logic (all 10 transform ops, including the mathjs-
// based custom_column evaluator) lives in the shared @bi-platform/
// transform-core package, imported unchanged here — the same code the
// backend's engine.js re-exports. There is no second implementation to keep
// in sync anymore; a fix or new op only has to happen in the shared package.
import { replaySteps } from '@bi-platform/transform-core';

export function replayStepsClientSide(originalRows, steps) {
  return replaySteps(originalRows, steps);
}
