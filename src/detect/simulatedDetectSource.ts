import { DetectPayload, SIGNAL_1_ID } from './detectPayload';

/**
 * DEMO ONLY: a simulated `onDetect` source for the Detect panel, used until the SDK delivers real events (plan Steps
 * 13-14). Brief step 9 allows the demo host to be built against simulated events because the payload field names are
 * frozen (R-251).
 *
 * It plays one scripted raise-to-clear cycle of signal #1 on one made-up peer connection and stream, then repeats:
 * a raise, two refreshes, a clear. Identifiers are prefixed `sim-` so a simulated event can never be mistaken for a
 * real one. It carries no measured value and no threshold: the panel shows lifecycle and timing only.
 *
 * The script's step delays are display pacing for the demo, not Detect windows; they are not taken from any profile.
 */

type Listener = (payload: DetectPayload) => void;

interface ScriptStep {
  afterMs: number;
  state: DetectPayload['state'];
  window: DetectPayload['window'];
  question: DetectPayload['question'];
}

const SCRIPT: ScriptStep[] = [
  { afterMs: 3000, state: 'raised', window: 'W1', question: 'Q1' },
  { afterMs: 5000, state: 'refresh', window: 'W2', question: 'Q2' },
  { afterMs: 5000, state: 'refresh', window: 'W2', question: 'Q2' },
  { afterMs: 5000, state: 'cleared', window: 'W2', question: 'Q2' },
];
const PAUSE_BETWEEN_CYCLES_MS = 8000;

export const SIMULATED_PEER_CONNECTION_ID = 'sim-pc-1';
export const SIMULATED_STREAM_ID = 'sim-inbound-audio-1';

/** Builds one simulated payload. Exported for tests. */
export function simulatedPayload(
  step: ScriptStep,
  conditionId: string,
  windowStart: number,
  now: number
): DetectPayload {
  return {
    schemaVersion: 1,
    signalId: SIGNAL_1_ID,
    definitionVersion: 'simulated',
    catalogueVersion: 'simulated',
    status: 'experimental',
    state: step.state,
    severity: 'warning',
    direction: 'inbound',
    peerConnectionId: SIMULATED_PEER_CONNECTION_ID,
    streamId: SIMULATED_STREAM_ID,
    window: step.window,
    question: step.question,
    windowStart,
    windowEnd: now,
    shadow: false,
    sessionId: 'simulated',
    conditionId,
    eventTimestamp: now,
  };
}

/** Starts the simulation; returns the function that stops it. */
export function startSimulatedDetect(listener: Listener, now: () => number = Date.now): () => void {
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let cycle = 0;
  let stepIndex = 0;
  let lastEventAt = now();

  const scheduleNext = (delayMs: number) => {
    timer = setTimeout(fire, delayMs);
  };

  function fire() {
    if (stopped) return;
    const step = SCRIPT[stepIndex];
    const at = now();
    listener(simulatedPayload(step, `sim-condition-${cycle + 1}`, lastEventAt, at));
    lastEventAt = at;
    stepIndex += 1;
    if (stepIndex < SCRIPT.length) {
      scheduleNext(SCRIPT[stepIndex].afterMs);
    } else {
      stepIndex = 0;
      cycle += 1;
      scheduleNext(PAUSE_BETWEEN_CYCLES_MS + SCRIPT[0].afterMs);
    }
  }

  scheduleNext(SCRIPT[0].afterMs);

  return () => {
    stopped = true;
    if (timer !== undefined) clearTimeout(timer);
  };
}
