import React from 'react';
import { act } from 'react-dom/test-utils';
import { mount } from 'enzyme';
import watchRTC from '@testrtc/watchrtc-sdk';

import DetectPanel, { DetectPanelView } from './DetectPanel';
import { addPayload, DetectTimeline } from '../../detect/detectTimeline';
import { DetectPayload } from '../../detect/detectPayload';
import demoProfile from '../../detect/cyara.demo@1.json';

jest.mock('@testrtc/watchrtc-sdk', () => ({
  __esModule: true,
  default: {
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    detect: { describe: jest.fn() },
  },
}));

const event = (overrides: Partial<DetectPayload>): DetectPayload => ({
  schemaVersion: 1,
  signalId: 'voice.loss.inbound',
  state: 'raised',
  severity: 'warning',
  window: 'W1',
  question: 'Q1',
  peerConnectionId: 'pc-a',
  streamId: 'stream-1',
  conditionId: 'c-1',
  eventTimestamp: 1000,
  ...overrides,
});

describe('the Detect panel (FR8.5)', () => {
  it('shows peer connection, stream and the raise-to-clear timeline of a condition', () => {
    const timeline = [
      event({}),
      event({ state: 'refresh', window: 'W2', question: 'Q2', eventTimestamp: 17000 }),
      event({ state: 'cleared', window: 'W2', question: 'Q2', eventTimestamp: 31000 }),
    ].reduce<DetectTimeline>(addPayload, []);
    const wrapper = mount(<DetectPanelView timeline={timeline} />);
    const text = wrapper.text();
    expect(text).toContain('Peer connection pc-a');
    expect(text).toContain('Stream stream-1');
    expect(text).toContain('raise to clear 30 s');
    expect(wrapper.find('li')).toHaveLength(3);
  });

  // 2026-11-25, plan Step 16 part 2 (brief: the panel can use describe() for #1's title and description; R-426).
  it("titles a condition with the SDK's describe() text, and falls back to the signal id without it", () => {
    const timeline = [event({})].reduce<DetectTimeline>(addPayload, []);
    const described = mount(
      <DetectPanelView
        timeline={timeline}
        describe={id =>
          id === 'voice.loss.inbound' ? { title: 'test title', description: 'test description' } : undefined
        }
      />
    ).text();
    expect(described).toContain('test title');
    expect(described).toContain('test description');
    expect(described).not.toContain('voice.loss.inbound');

    const plain = mount(<DetectPanelView timeline={timeline} describe={() => undefined} />).text();
    expect(plain).toContain('voice.loss.inbound');
  });

  // Reworked 2026-11-25, S-120 (APPLIES R-222; plan Step 16 note "swap the simulated source"): the simulated
  // source, its badge and the sourceKind prop are removed. Was: "labels simulated events and shows no threshold".
  it('shows an empty panel with no threshold and nothing simulated', () => {
    const text = mount(<DetectPanelView timeline={[]} />).text();
    expect(text).toContain('No Detect events yet.');
    expect(text.toLowerCase()).not.toContain('threshold');
    expect(text.toLowerCase()).not.toContain('simulated');
  });

  // New 2026-11-25, S-118 point 7 (FR8.4, no threshold value anywhere in the UI): the panel shows no value of the
  // demo profile's engine fields or signal bands. Checked: every fractional value, and every integer of 100 or more
  // as a whole number. Integers below 100 (window counts, multipliers, k) are not checked: they collide with the
  // panel's clock times and durations.
  it("shows no value of the demo profile's engine fields or bands", () => {
    const values: number[] = [];
    const collect = (node: unknown) => {
      if (typeof node === 'number') values.push(node);
      else if (node && typeof node === 'object') Object.values(node as object).forEach(collect);
    };
    collect(demoProfile.engine);
    collect(demoProfile.signals);
    const checked = values.filter(v => !Number.isInteger(v) || v >= 100);
    expect(checked.length).toBeGreaterThan(10);

    const timeline = [
      event({}),
      event({ state: 'refresh', window: 'W2', question: 'Q2', eventTimestamp: 17000 }),
      event({ state: 'refresh', severity: 'critical', window: 'W3', question: 'Q3', eventTimestamp: 49000 }),
      event({ state: 'cleared', window: 'W2', question: 'Q2', eventTimestamp: 61000, clearCause: 'observation_ended' }),
    ].reduce<DetectTimeline>(addPayload, []);
    const text = mount(<DetectPanelView timeline={timeline} />).text();
    checked.forEach(value => {
      const pattern = new RegExp(`(^|[^0-9.])${String(value).replace('.', '\\.')}($|[^0-9])`);
      expect(`value ${value} shown`).toMatch(pattern); // the pattern does find the value when it is there
      expect(text).not.toMatch(pattern);
    });
  });

  // New 2026-11-25, S-119 point 7 (APPLIES R-233; FD 11.6.1): a config_error delivered through onDetect is never
  // shown in the host UI.
  it('shows nothing for a config_error delivered through onDetect', () => {
    const sdk = (watchRTC as unknown) as { subscribe: jest.Mock };
    sdk.subscribe.mockReset();
    const wrapper = mount(<DetectPanel />);
    expect(sdk.subscribe).toHaveBeenCalledTimes(1);
    const configError: DetectPayload = {
      schemaVersion: 1,
      state: 'config_error',
      sessionId: 'test-session',
      eventTimestamp: 5000,
      configErrors: [{ code: 'test_code', path: '/test/path' }],
    };
    act(() => {
      sdk.subscribe.mock.calls[0][1](configError);
    });
    wrapper.update();
    expect(wrapper.text()).toContain('No Detect events yet.');
    expect(wrapper.text()).not.toContain('config_error');
    wrapper.unmount();
  });
});
