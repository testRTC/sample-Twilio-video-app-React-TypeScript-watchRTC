/**
 * The watchRTC SDK `inCallWindowing` setting for the in-call windowing demo, read from the page URL.
 * `?windowing=1` switches it on; `windowingInterval` sets the sample interval in milliseconds.
 * * RTC-5616: with `windowing=1`, `voiceSignals=1` also switches on the SDK's voice signals (its default set), and the
 * comma lists `voiceSignalsEnable` and `voiceSignalsDisable` adjust that set, for example
 * `?windowing=1&voiceSignals=1&voiceSignalsEnable=C3,G3&voiceSignalsDisable=A2`.
 */
export interface InCallWindowingSetting {
  enabled: true;
  /** Passed to the SDK as given; the SDK accepts 1000, 2000 or 3000 and turns windowing off for anything else. */
  sampleIntervalMs?: number | string;
  /** `true` for the SDK's default set, or the lists that adjust it; signal ids are passed through as given. */
  voiceSignals?: true | { enable?: string[]; disable?: string[] };
}

/** The non-empty, trimmed entries of a comma list, or `undefined` when the parameter is absent. */
function commaList(value: string | null): string[] | undefined {
  if (value === null) {
    return undefined;
  }
  return value
    .split(',')
    .map(id => id.trim())
    .filter(id => id !== '');
}

/**
 * The `voiceSignals` part, or `undefined` unless the URL has `voiceSignals=1`. Signal ids are passed through as given
 * so the SDK, not the app, decides which are valid (an unknown id prints one SDK warning and is ignored).
 */
function getVoiceSignals(params: URLSearchParams): InCallWindowingSetting['voiceSignals'] {
  if (params.get('voiceSignals') !== '1') {
    return undefined;
  }
  const enable = commaList(params.get('voiceSignalsEnable'));
  const disable = commaList(params.get('voiceSignalsDisable'));
  if (enable === undefined && disable === undefined) {
    return true;
  }
  const lists: { enable?: string[]; disable?: string[] } = {};
  if (enable !== undefined) {
    lists.enable = enable;
  }
  if (disable !== undefined) {
    lists.disable = disable;
  }
  return lists;
}

/**
 * Returns the setting to pass to `watchRTC.init`, or `undefined` (windowing off) unless the URL has `windowing=1`.
 * A numeric `windowingInterval` is passed as a number and anything else as given, so the SDK, not the app, decides
 * whether it is valid (an unsupported value prints one SDK warning and leaves windowing off).
 */
export function getInCallWindowing(search: string): InCallWindowingSetting | undefined {
  const params = new URLSearchParams(search);
  if (params.get('windowing') !== '1') {
    return undefined;
  }
  const setting: InCallWindowingSetting = { enabled: true };
  const interval = params.get('windowingInterval');
  if (interval !== null) {
    const asNumber = Number(interval);
    setting.sampleIntervalMs = interval.trim() !== '' && isFinite(asNumber) ? asNumber : interval;
  }
  const voiceSignals = getVoiceSignals(params);
  if (voiceSignals !== undefined) {
    setting.voiceSignals = voiceSignals;
  }
  return setting;
}
