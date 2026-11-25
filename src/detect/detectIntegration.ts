import watchRTC from '@testrtc/watchrtc-sdk';

import { DetectPayload } from './detectPayload';
// Copied at install from ../watchrtc-sdk/profiles by scripts/copy-demo-profile.js (postinstall); gitignored, never
// committed (S-118 option B; the repository is public, FD 4.2.7, R-159).
import demoProfile from './cyara.demo@1.json';

/**
 * THE ONE PLACE the demo meets the SDK's Detect API (plan Step 16; FR8).
 *
 * Plan Step 16 part 2 (2026-11-25): the simulated source used until the SDK delivered Detect (plan Steps 13-14) is
 * replaced by the SDK's own delivery, and the simulated source, its panel badge and the source-kind flag are removed
 * (S-120, 2026-11-25, APPLIES R-222):
 *
 * 1. `subscribeToDetect` - `watchRTC.subscribe('onDetect', listener)`, undone by
 *    `watchRTC.unsubscribe('onDetect', listener)`. The SDK delivers only mode-`on` events; shadow events are uploaded
 *    and never delivered (R-42), so the panel never sees one.
 * 2. `detectInitOptions` - `{ detect: <the D3 demo profile> }` for `init()` (Step 16 STOP 1; S-118 option B, the
 *    person's choice, 2026-11-25, `step16-stop-answers.md`). The profile, `watchrtc-sdk/profiles/cyara.demo@1.json`,
 *    is copied byte for byte into the gitignored `src/detect/cyara.demo@1.json` at install. App.tsx passes it only when
 *    the Detect switch (`?detect=1`) is on. The app renders no value of it (FR8.4).
 */

export type DetectListener = (payload: DetectPayload) => void;

/** INTEGRATION POINT 1 of 2: the `onDetect` subscription. Returns the unsubscribe function. */
export function subscribeToDetect(listener: DetectListener): () => void {
  // The SDK types its payload loosely (`{ schemaVersion, state, [field]: unknown }`, detect-session.ts); the demo
  // reads it through its own field list (detectPayload.ts), which names the SDK's payloadOf fields.
  const sdkListener = (payload: unknown) => listener(payload as DetectPayload);
  watchRTC.subscribe('onDetect', sdkListener);
  return () => watchRTC.unsubscribe('onDetect', sdkListener);
}

/**
 * A signal's title and description from the SDK's bundled English table (`detect.describe`, R-250, R-426), or
 * undefined when the SDK has none. The demo writes no signal text of its own.
 */
export function describeDetectSignal(signalId: string): { title: string; description: string } | undefined {
  try {
    return watchRTC.detect.describe(signalId);
  } catch {
    return undefined;
  }
}

/** INTEGRATION POINT 2 of 2: the `init()` options App.tsx adds when the Detect switch is on: the demo profile only. */
export function detectInitOptions(): { detect: typeof demoProfile } {
  return { detect: demoProfile };
}
