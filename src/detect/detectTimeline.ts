import { DetectPayload, DetectSeverity } from './detectPayload';

/**
 * Groups delivered `onDetect` payloads by peer connection, then stream, then condition (FR8.5), and keeps each
 * condition's raise-to-clear timeline. Pure: the panel and the tests share it.
 *
 * Grouping uses only payload fields: `peerConnectionId`, `streamId`, `conditionId`, `state`, `eventTimestamp`.
 *
 * A `config_error` is never shown in the host UI (R-233; FD 11.6.1; S-119, 2026-11-25): `addPayload` returns the
 * timeline it is given, unchanged. The developer sees it as the SDK's one "[watchRTC detect]" console line (R-395)
 * and through `detect.capabilities().configErrors` (R-425).
 *
 * SESSION_GROUP and PEER_CONNECTION_GROUP are guards for a signal payload with no peer connection or no stream. At
 * watchrtc-sdk 7ee5b63 the SDK always sets `peerConnectionId` on a signal payload (detect-session.ts payloadOf), so
 * SESSION_GROUP cannot fire in live use; it is kept so such a payload is still grouped, and is reached in tests.
 */

export const SESSION_GROUP = '(session)';
export const PEER_CONNECTION_GROUP = '(peer connection)';

export interface TimelineEvent {
  state: DetectPayload['state'];
  severity?: DetectSeverity;
  window?: DetectPayload['window'];
  question?: DetectPayload['question'];
  eventTimestamp: number;
}

export interface ConditionTimeline {
  conditionId: string;
  signalId?: string;
  events: TimelineEvent[];
  raisedAt?: number;
  clearedAt?: number;
  clearCause?: string;
}

export interface StreamGroup {
  streamId: string;
  conditions: ConditionTimeline[];
}

export interface PeerConnectionGroup {
  peerConnectionId: string;
  streams: StreamGroup[];
}

export type DetectTimeline = PeerConnectionGroup[];

const findOrAdd = <T>(list: T[], match: (item: T) => boolean, create: () => T): T => {
  const found = list.find(match);
  if (found) return found;
  const created = create();
  list.push(created);
  return created;
};

/** Returns a new timeline with the payload added; the input is not changed. */
export function addPayload(timeline: DetectTimeline, payload: DetectPayload): DetectTimeline {
  // R-233 (S-119): a config_error is not shown in the panel.
  if (payload.state === 'config_error') return timeline;

  const next: DetectTimeline = timeline.map(pc => ({
    peerConnectionId: pc.peerConnectionId,
    streams: pc.streams.map(s => ({
      streamId: s.streamId,
      conditions: s.conditions.map(c => ({ ...c, events: c.events.slice() })),
    })),
  }));

  const pcId = payload.peerConnectionId || SESSION_GROUP;
  const streamId = payload.streamId || PEER_CONNECTION_GROUP;
  const conditionId = payload.conditionId || `${payload.state}@${payload.eventTimestamp}`;

  const pc = findOrAdd(
    next,
    p => p.peerConnectionId === pcId,
    () => ({ peerConnectionId: pcId, streams: [] })
  );
  const stream = findOrAdd(
    pc.streams,
    s => s.streamId === streamId,
    () => ({ streamId, conditions: [] })
  );
  const condition = findOrAdd(
    stream.conditions,
    c => c.conditionId === conditionId,
    () => ({ conditionId, signalId: payload.signalId, events: [] })
  );

  condition.events.push({
    state: payload.state,
    severity: payload.severity,
    window: payload.window,
    question: payload.question,
    eventTimestamp: payload.eventTimestamp,
  });
  if (payload.state === 'raised' && condition.raisedAt === undefined) {
    condition.raisedAt = payload.eventTimestamp;
  }
  if (payload.state === 'cleared') {
    condition.clearedAt = payload.eventTimestamp;
    condition.clearCause = payload.clearCause;
  }
  return next;
}

/** Raise-to-clear duration in ms, or undefined while the condition is open. */
export function raiseToClearMs(condition: ConditionTimeline): number | undefined {
  if (condition.raisedAt === undefined || condition.clearedAt === undefined) return undefined;
  return condition.clearedAt - condition.raisedAt;
}
