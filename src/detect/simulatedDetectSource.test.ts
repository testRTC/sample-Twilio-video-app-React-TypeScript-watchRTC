import { DetectPayload, SIGNAL_1_ID } from './detectPayload';
import { startSimulatedDetect } from './simulatedDetectSource';

/** The frozen payload list (03-architecture-and-sdk.md "Payload") plus the FR12.6 additive fields. */
const ALLOWED_FIELDS = [
  'schemaVersion',
  'signalId',
  'definitionVersion',
  'catalogueVersion',
  'status',
  'state',
  'severity',
  'direction',
  'peerConnectionId',
  'streamId',
  'ssrc',
  'window',
  'question',
  'provisional',
  'windowStart',
  'windowEnd',
  'impairedShare',
  'severityMetrics',
  'episodeCount',
  'persisted',
  'contributingFactors',
  'reason',
  'side',
  'correlatedWith',
  'coverage',
  'shadow',
  'sessionId',
  'conditionId',
  'eventTimestamp',
  'connectedAnchor',
  'ptimeMs',
  'ptimeSource',
  'measuredPtimeMs',
  'measuredPtimeSampleCount',
  'impairedShareSpanMs',
  'clearCause',
];

describe('the simulated onDetect source (demo only)', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  const run = (ms: number) => {
    const received: DetectPayload[] = [];
    let clock = 0;
    const stop = startSimulatedDetect(
      p => received.push(p),
      () => clock
    );
    for (let t = 0; t < ms; t += 1000) {
      clock += 1000;
      jest.advanceTimersByTime(1000);
    }
    return { received, stop };
  };

  it('plays one raise-to-clear cycle of signal #1 under one condition id', () => {
    const { received, stop } = run(20000);
    stop();
    expect(received.map(p => p.state)).toEqual(['raised', 'refresh', 'refresh', 'cleared']);
    expect(new Set(received.map(p => p.conditionId)).size).toBe(1);
    expect(received.every(p => p.signalId === SIGNAL_1_ID)).toBe(true);
  });

  it('uses only payload-list field names and marks its identifiers as simulated', () => {
    const { received, stop } = run(20000);
    stop();
    received.forEach(p => {
      Object.keys(p).forEach(key => expect(ALLOWED_FIELDS).toContain(key));
      expect(p.peerConnectionId).toMatch(/^sim-/);
      expect(p.streamId).toMatch(/^sim-/);
    });
  });

  it('delivers nothing after it is stopped', () => {
    const received: DetectPayload[] = [];
    const stop = startSimulatedDetect(p => received.push(p));
    stop();
    jest.advanceTimersByTime(60000);
    expect(received).toEqual([]);
  });
});
