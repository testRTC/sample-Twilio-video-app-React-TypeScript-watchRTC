import React from 'react';
import { mount } from 'enzyme';

import { DetectPanelView } from './DetectPanel';
import { addPayload, DetectTimeline } from '../../detect/detectTimeline';
import { DetectPayload } from '../../detect/detectPayload';

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
    const wrapper = mount(<DetectPanelView timeline={timeline} sourceKind="sdk" />);
    const text = wrapper.text();
    expect(text).toContain('Peer connection pc-a');
    expect(text).toContain('Stream stream-1');
    expect(text).toContain('raise to clear 30 s');
    expect(wrapper.find('li')).toHaveLength(3);
    expect(text).not.toContain('simulated events');
  });

  it('labels simulated events and shows no threshold', () => {
    const wrapper = mount(<DetectPanelView timeline={[]} sourceKind="simulated" />);
    expect(wrapper.text()).toContain('simulated events');
    expect(wrapper.text()).toContain('No Detect events yet.');
    expect(wrapper.text().toLowerCase()).not.toContain('threshold');
  });
});
