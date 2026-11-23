import * as queryString from 'query-string';

/**
 * Demo-host settings for the watchRTC Detect pilot (RTC-5586, plan Step 16; FR8.3, FR8.4).
 *
 * - `rtcApiKey` comes from the environment only (`REACT_APP_RTC_API_KEY`), never from a URL parameter (R-79). It is
 *   never printed.
 * - `?audioOnly=1` joins with no camera track.
 * - `?detect=1` is the one demo-only Detect on/off switch (R-222). There is no threshold switch and no threshold value.
 */

const queryFlag = (name: string): boolean => {
  const value = queryString.parse(window.location.search)?.[name];
  return value === '1';
};

/** The watchRTC API key, from the environment only. */
export const getRtcApiKey = (): string | undefined => process.env.REACT_APP_RTC_API_KEY || undefined;

/** `?audioOnly=1`: no camera is acquired or published, so the call carries audio only. */
export const isAudioOnly = (): boolean => queryFlag('audioOnly');

/** `?detect=1`: the demo-only Detect switch. Off unless set. */
export const isDetectOn = (): boolean => queryFlag('detect');

/**
 * Removes every query parameter whose name contains "key" (any case) before URL parameters are passed on, for example
 * to `qualityrtc.run` options, so no URL value can act as or reveal a key (FR8.3).
 */
export const withoutKeyParams = <T>(params: Record<string, T>): Record<string, T> => {
  const result: Record<string, T> = {};
  Object.keys(params).forEach(name => {
    if (!/key/i.test(name)) result[name] = params[name];
  });
  return result;
};
