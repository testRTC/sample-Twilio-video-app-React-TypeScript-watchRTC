/**
 * The `onDetect` payload as the demo reads it.
 *
 * The SDK does not export a payload type yet (its delivery arrives at plan Steps 13-14), so the demo mirrors the field
 * names here. Every name is taken from the frozen payload list, schemaVersion 1 (R-251; watchrtc-detect
 * `docs/aidlc-knowledge/03-architecture-and-sdk.md` "Payload", lines 146-157) and the additive optional fields of
 * requirement FR12.6 (same section, lines 157-161). No other field is read. The literal unions (`state`, `severity`, `window`, `question`,
 * `direction`) are the ones in that list and in the SDK's `src/voice-signals/detector-contract.ts`. Fields whose type
 * the documents do not fix are typed `unknown` and are not displayed. When the SDK exports its own payload type, this
 * file is replaced by an import of it.
 */

export type DetectState = 'raised' | 'refresh' | 'cleared' | 'config_error';
export type DetectSeverity = 'informational' | 'warning' | 'critical';
export type DetectWindowName = 'W1' | 'W2' | 'W3' | 'W4';
export type DetectQuestion = 'Q1' | 'Q2' | 'Q3' | 'Q4';
export type DetectDirection = 'inbound' | 'outbound' | 'path' | 'device' | 'session';

export interface DetectPayload {
  schemaVersion: number;
  signalId?: string;
  definitionVersion?: string;
  catalogueVersion?: string;
  status?: string;
  state: DetectState;
  severity?: DetectSeverity;
  direction?: DetectDirection;
  peerConnectionId?: string | null;
  streamId?: string | null;
  ssrc?: number;
  window?: DetectWindowName;
  question?: DetectQuestion;
  provisional?: boolean;
  windowStart?: number;
  windowEnd?: number;
  impairedShare?: unknown;
  severityMetrics?: unknown;
  episodeCount?: number;
  persisted?: unknown;
  contributingFactors?: string[];
  reason?: string;
  side?: string;
  correlatedWith?: unknown;
  coverage?: unknown;
  shadow?: boolean;
  sessionId?: string;
  conditionId?: string;
  eventTimestamp: number;
  // FR12.6 additive optional fields (R-251)
  connectedAnchor?: unknown;
  ptimeMs?: unknown;
  ptimeSource?: unknown;
  measuredPtimeMs?: unknown;
  measuredPtimeSampleCount?: unknown;
  impairedShareSpanMs?: unknown;
  clearCause?: string;
}

/** Signal #1, the only signal the pilot builds (06-signal-catalogue.md §3 #1). */
export const SIGNAL_1_ID = 'voice.loss.inbound';
