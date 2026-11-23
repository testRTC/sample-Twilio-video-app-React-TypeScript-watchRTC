import { DetectPayload } from './detectPayload';
import { startSimulatedDetect } from './simulatedDetectSource';

/**
 * THE ONE PLACE the demo meets the SDK's Detect API (plan Step 16; FR8).
 *
 * The SDK's `init({ detect })` and `subscribe('onDetect')` do not exist yet; they arrive at plan Steps 13-14. Until
 * then the panel is fed by the demo-only simulated source. When the SDK delivers Detect, only this file changes:
 *
 * 1. `subscribeToDetect` - replace the simulated source with
 *      watchRTC.subscribe('onDetect', listener);
 *      return () => watchRTC.unsubscribe('onDetect', listener);
 *    and set `detectSourceKind` to 'sdk'.
 * 2. `detectInitOptions` - return the `detect` block for `init()`. Where the demo takes that block from is not
 *    settled yet (see the Step 16 report), so it returns nothing today.
 */

export type DetectListener = (payload: DetectPayload) => void;

/** Shown in the panel so simulated events are never mistaken for real ones. */
export const detectSourceKind: 'simulated' | 'sdk' = 'simulated';

/** INTEGRATION POINT 1 of 2: the `onDetect` subscription. Returns the unsubscribe function. */
export function subscribeToDetect(listener: DetectListener): () => void {
  return startSimulatedDetect(listener);
}

/** INTEGRATION POINT 2 of 2: extra `init()` options when the Detect switch is on. Nothing until the SDK has `detect`. */
export function detectInitOptions(): {} {
  return {};
}
