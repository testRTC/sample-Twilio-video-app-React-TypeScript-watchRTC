import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import watchRTC from '@testrtc/watchrtc-sdk';

import { describeDetectSignal, detectInitOptions, subscribeToDetect } from './detectIntegration';
import { DetectPayload, SIGNAL_1_ID } from './detectPayload';
import { addPayload, DetectTimeline, raiseToClearMs } from './detectTimeline';

jest.mock('@testrtc/watchrtc-sdk', () => ({
  __esModule: true,
  default: {
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    detect: { describe: jest.fn() },
  },
}));

const sdk = (watchRTC as unknown) as {
  subscribe: jest.Mock;
  unsubscribe: jest.Mock;
  detect: { describe: jest.Mock };
};

/**
 * Payloads in the shape and field order the SDK's payloadOf builds them (watchrtc-sdk 7ee5b63,
 * src/live-windowing/detect-session.ts; 03 "Payload", R-251), with placeholder identifiers. Measured values are left
 * out: the panel shows none.
 */
const sdkPayload = (overrides: Partial<DetectPayload>): DetectPayload => ({
  schemaVersion: 1,
  signalId: SIGNAL_1_ID,
  definitionVersion: 'test-definition-version',
  catalogueVersion: 'test-catalogue-version',
  status: 'experimental',
  state: 'raised',
  severity: 'warning',
  direction: 'inbound',
  peerConnectionId: 'test-pc',
  streamId: 'test-stream',
  ssrc: 1234,
  window: 'W1',
  question: 'Q1',
  windowStart: 1000,
  windowEnd: 5000,
  shadow: false,
  sessionId: 'test-session',
  conditionId: 'test-condition',
  eventTimestamp: 5000,
  ...overrides,
});

describe('the Detect integration point (plan Step 16 part 2, FR8)', () => {
  beforeEach(() => {
    sdk.subscribe.mockReset();
    sdk.unsubscribe.mockReset();
    sdk.detect.describe.mockReset();
  });

  it("subscribes to the SDK's onDetect and forwards each payload unchanged", () => {
    const received: DetectPayload[] = [];
    subscribeToDetect(p => received.push(p));
    expect(sdk.subscribe).toHaveBeenCalledTimes(1);
    expect(sdk.subscribe.mock.calls[0][0]).toBe('onDetect');

    const payload = sdkPayload({});
    sdk.subscribe.mock.calls[0][1](payload);
    expect(received).toEqual([payload]);
  });

  it('unsubscribes the same listener it subscribed', () => {
    const stop = subscribeToDetect(() => undefined);
    expect(sdk.unsubscribe).not.toHaveBeenCalled();
    stop();
    expect(sdk.unsubscribe).toHaveBeenCalledWith('onDetect', sdk.subscribe.mock.calls[0][1]);
  });

  it("takes a signal's title and description from the SDK's describe(), and nothing when it has none", () => {
    sdk.detect.describe.mockReturnValueOnce({ title: 'test title', description: 'test description' });
    expect(describeDetectSignal(SIGNAL_1_ID)).toEqual({ title: 'test title', description: 'test description' });
    expect(sdk.detect.describe).toHaveBeenCalledWith(SIGNAL_1_ID);
    expect(describeDetectSignal('voice.not.registered')).toBeUndefined();
    sdk.detect.describe.mockImplementationOnce(() => {
      throw new Error('test');
    });
    expect(describeDetectSignal(SIGNAL_1_ID)).toBeUndefined();
  });

  // Reworked 2026-11-25, S-118 option B (the person's choice; step16-stop-answers.md, point 7): init() gets the D3
  // demo profile, and nothing else. Was: `{}` until S-118 was decided.
  it('passes the demo profile, and only it, as the detect block for init()', () => {
    const options = detectInitOptions();
    expect(Object.keys(options)).toEqual(['detect']);
    expect(options.detect.profile).toBe('cyara.demo@1');
    expect(options.detect.enabled).toBe(true);
  });
});

/** S-118 option B, point 7: the profile reaches the app as a gitignored install-time copy, never a committed file. */
describe('the demo profile copy (S-118 option B)', () => {
  const appRoot = path.resolve(__dirname, '..', '..');
  const copy = path.resolve(__dirname, 'cyara.demo@1.json');
  const sdkProfile = path.resolve(appRoot, '..', 'watchrtc-sdk', 'profiles', 'cyara.demo@1.json');

  it("equals the SDK's demo profile byte for byte", () => {
    expect(fs.readFileSync(copy).equals(fs.readFileSync(sdkProfile))).toBe(true);
  });

  // The distinguishing test for B (S-118 point 7): it fails under A (committed copy) and C (public/ copy).
  it('is gitignored and not tracked by git', () => {
    const ignored = spawnSync('git', ['check-ignore', '-q', 'src/detect/cyara.demo@1.json'], { cwd: appRoot });
    expect(ignored.status).toBe(0);
    const tracked = spawnSync('git', ['ls-files'], { cwd: appRoot, encoding: 'utf8' });
    expect(tracked.status).toBe(0);
    expect(tracked.stdout).not.toMatch(/cyara\.demo@1\.json/);
  });
});

describe("the panel's mapping of SDK payloads (FR8.5)", () => {
  it('groups a raise, refreshes and a clear on retire by peer connection, stream and condition', () => {
    const timeline = [
      sdkPayload({}),
      sdkPayload({ state: 'refresh', window: 'W2', question: 'Q2', eventTimestamp: 21000 }),
      sdkPayload({ state: 'refresh', window: 'W3', question: 'Q3', eventTimestamp: 53000, episodeCount: 3 }),
      sdkPayload({ state: 'cleared', window: 'W2', question: 'Q2', eventTimestamp: 65000 }),
      sdkPayload({
        state: 'cleared',
        eventTimestamp: 70000,
        conditionId: 'test-condition-2',
        clearCause: 'observation_ended',
      }),
    ].reduce<DetectTimeline>(addPayload, []);

    expect(timeline.map(pc => pc.peerConnectionId)).toEqual(['test-pc']);
    expect(timeline[0].streams.map(s => s.streamId)).toEqual(['test-stream']);
    const [first, second] = timeline[0].streams[0].conditions;
    expect(first.signalId).toBe(SIGNAL_1_ID);
    expect(first.events.map(e => `${e.state} ${e.window}/${e.question}`)).toEqual([
      'raised W1/Q1',
      'refresh W2/Q2',
      'refresh W3/Q3',
      'cleared W2/Q2',
    ]);
    expect(raiseToClearMs(first)).toBe(60000);
    expect(second.clearCause).toBe('observation_ended');
  });

  // Reworked 2026-11-25, S-119 (APPLIES R-233; FD 11.6.1): a config_error delivered to the listener is never shown
  // in the host UI. Was: kept under the session group.
  it('adds nothing to the timeline for a config_error delivered through onDetect', () => {
    sdk.subscribe.mockReset();
    let timeline: DetectTimeline = [];
    subscribeToDetect(p => {
      timeline = addPayload(timeline, p);
    });
    const configError: DetectPayload = {
      schemaVersion: 1,
      state: 'config_error',
      sessionId: 'test-session',
      eventTimestamp: 5000,
      configErrors: [{ code: 'test_code', path: '/test/path' }],
    };
    sdk.subscribe.mock.calls[0][1](configError);
    expect(timeline).toHaveLength(0);
  });
});
