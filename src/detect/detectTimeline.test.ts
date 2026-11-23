import { DetectPayload, SIGNAL_1_ID } from './detectPayload';
import { addPayload, DetectTimeline, PEER_CONNECTION_GROUP, raiseToClearMs, SESSION_GROUP } from './detectTimeline';

const payload = (overrides: Partial<DetectPayload>): DetectPayload => ({
  schemaVersion: 1,
  signalId: SIGNAL_1_ID,
  state: 'raised',
  peerConnectionId: 'pc-a',
  streamId: 'stream-1',
  conditionId: 'c-1',
  eventTimestamp: 1000,
  ...overrides,
});

const build = (payloads: DetectPayload[]) => payloads.reduce<DetectTimeline>(addPayload, []);

describe('the Detect timeline (FR8.5)', () => {
  it('groups by peer connection, then stream, then condition', () => {
    const timeline = build([
      payload({}),
      payload({ streamId: 'stream-2', conditionId: 'c-2' }),
      payload({ peerConnectionId: 'pc-b', conditionId: 'c-3' }),
      payload({ state: 'refresh', eventTimestamp: 2000 }),
    ]);
    expect(timeline.map(pc => pc.peerConnectionId)).toEqual(['pc-a', 'pc-b']);
    expect(timeline[0].streams.map(s => s.streamId)).toEqual(['stream-1', 'stream-2']);
    expect(timeline[0].streams[0].conditions).toHaveLength(1);
    expect(timeline[0].streams[0].conditions[0].events.map(e => e.state)).toEqual(['raised', 'refresh']);
  });

  it('records the raise-to-clear span of one condition across a re-raise and refreshes', () => {
    const timeline = build([
      payload({ severity: 'warning', eventTimestamp: 1000 }),
      payload({ state: 'refresh', eventTimestamp: 17000 }),
      payload({ severity: 'critical', eventTimestamp: 20000 }),
      payload({ state: 'cleared', eventTimestamp: 41000, clearCause: 'observation_ended' }),
    ]);
    const condition = timeline[0].streams[0].conditions[0];
    expect(condition.raisedAt).toBe(1000);
    expect(condition.clearedAt).toBe(41000);
    expect(condition.clearCause).toBe('observation_ended');
    expect(raiseToClearMs(condition)).toBe(40000);
  });

  it('leaves an open condition without a raise-to-clear span', () => {
    const condition = build([payload({})])[0].streams[0].conditions[0];
    expect(raiseToClearMs(condition)).toBeUndefined();
  });

  it('keeps a session-level config_error under the session group', () => {
    const timeline = build([
      payload({ state: 'config_error', peerConnectionId: null, streamId: null, conditionId: undefined }),
    ]);
    expect(timeline[0].peerConnectionId).toBe(SESSION_GROUP);
    expect(timeline[0].streams[0].streamId).toBe(PEER_CONNECTION_GROUP);
    expect(timeline[0].streams[0].conditions[0].events[0].state).toBe('config_error');
  });

  it('does not change the timeline it is given', () => {
    const before = build([payload({})]);
    const snapshot = JSON.stringify(before);
    addPayload(before, payload({ state: 'cleared', eventTimestamp: 5000 }));
    expect(JSON.stringify(before)).toBe(snapshot);
  });
});
