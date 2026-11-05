import { getInCallWindowing } from './inCallWindowing';

describe('the getInCallWindowing function (in-call windowing demo, FR5.1)', () => {
  it('should switch windowing on with windowing=1', () => {
    expect(getInCallWindowing('?windowing=1')).toEqual({ enabled: true });
  });

  it('should pass windowingInterval as the sample interval', () => {
    expect(getInCallWindowing('?windowing=1&windowingInterval=2000')).toEqual({
      enabled: true,
      sampleIntervalMs: 2000,
    });
    expect(getInCallWindowing('?windowingInterval=1000&windowing=1')).toEqual({
      enabled: true,
      sampleIntervalMs: 1000,
    });
  });

  it('should leave windowing off without windowing=1', () => {
    expect(getInCallWindowing('')).toBeUndefined();
    expect(getInCallWindowing('?windowingInterval=2000')).toBeUndefined();
    expect(getInCallWindowing('?windowing=0')).toBeUndefined();
    expect(getInCallWindowing('?windowing=true')).toBeUndefined();
  });

  it('should pass an unsupported interval through so the SDK rejects it with a warning (PF8)', () => {
    expect(getInCallWindowing('?windowing=1&windowingInterval=5000')).toEqual({
      enabled: true,
      sampleIntervalMs: 5000,
    });
    expect(getInCallWindowing('?windowing=1&windowingInterval=fast')).toEqual({
      enabled: true,
      sampleIntervalMs: 'fast',
    });
  });

  it('should ignore the other demo parameters', () => {
    expect(getInCallWindowing('?collectionInterval=8000&windowing=1&splitChannels=true')).toEqual({ enabled: true });
  });
});

describe('the voiceSignals parameters (RTC-5616 voice signals demo)', () => {
  it('should add voiceSignals: true with windowing=1 and voiceSignals=1', () => {
    expect(getInCallWindowing('?windowing=1&voiceSignals=1')).toEqual({ enabled: true, voiceSignals: true });
    expect(getInCallWindowing('?windowing=1&windowingInterval=1000&voiceSignals=1')).toEqual({
      enabled: true,
      sampleIntervalMs: 1000,
      voiceSignals: true,
    });
  });

  it('should turn the comma lists into { enable, disable }, trimmed and without empty entries', () => {
    expect(
      getInCallWindowing('?windowing=1&voiceSignals=1&voiceSignalsEnable=C3,%20G3&voiceSignalsDisable=A2,,H1,')
    ).toEqual({ enabled: true, voiceSignals: { enable: ['C3', 'G3'], disable: ['A2', 'H1'] } });
    expect(getInCallWindowing('?windowing=1&voiceSignals=1&voiceSignalsEnable=E1')).toEqual({
      enabled: true,
      voiceSignals: { enable: ['E1'] },
    });
    expect(getInCallWindowing('?windowing=1&voiceSignals=1&voiceSignalsDisable=')).toEqual({
      enabled: true,
      voiceSignals: { disable: [] },
    });
  });

  it('should pass signal ids through as given so the SDK decides their validity', () => {
    expect(getInCallWindowing('?windowing=1&voiceSignals=1&voiceSignalsEnable=Z9,g3')).toEqual({
      enabled: true,
      voiceSignals: { enable: ['Z9', 'g3'] },
    });
  });

  it('should leave voice signals off without voiceSignals=1, and everything off without windowing=1', () => {
    expect(getInCallWindowing('?windowing=1&voiceSignalsEnable=C3')).toEqual({ enabled: true });
    expect(getInCallWindowing('?windowing=1&voiceSignals=true')).toEqual({ enabled: true });
    expect(getInCallWindowing('?windowing=1&voiceSignals=0')).toEqual({ enabled: true });
    expect(getInCallWindowing('?voiceSignals=1&voiceSignalsEnable=C3')).toBeUndefined();
  });
});
