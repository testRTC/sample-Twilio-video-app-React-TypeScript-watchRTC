/**
 * The watchRTC SDK `inCallWindowing` setting for the in-call windowing demo, read from the page URL.
 * `?windowing=1` switches it on; `windowingInterval` sets the sample interval in milliseconds.
 */
export interface InCallWindowingSetting {
  enabled: true;
  /** Passed to the SDK as given; the SDK accepts 1000, 2000 or 3000 and turns windowing off for anything else. */
  sampleIntervalMs?: number | string;
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
  const interval = params.get('windowingInterval');
  if (interval === null) {
    return { enabled: true };
  }
  const asNumber = Number(interval);
  return { enabled: true, sampleIntervalMs: interval.trim() !== '' && isFinite(asNumber) ? asNumber : interval };
}
