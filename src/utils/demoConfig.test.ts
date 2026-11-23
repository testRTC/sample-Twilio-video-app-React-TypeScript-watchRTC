import { getRtcApiKey, isAudioOnly, isDetectOn, withoutKeyParams } from './demoConfig';

const setSearch = (search: string) => window.history.pushState({}, '', `/${search}`);

describe('the demo configuration (FR8.3, FR8.4)', () => {
  const originalKey = process.env.REACT_APP_RTC_API_KEY;

  afterEach(() => {
    setSearch('');
    if (originalKey === undefined) {
      delete process.env.REACT_APP_RTC_API_KEY;
    } else {
      process.env.REACT_APP_RTC_API_KEY = originalKey;
    }
  });

  it('takes rtcApiKey from the environment and ignores an ?apiKey= URL parameter', () => {
    process.env.REACT_APP_RTC_API_KEY = 'env-test-key';
    setSearch('?apiKey=url-test-key');
    expect(getRtcApiKey()).toBe('env-test-key');
  });

  it('returns no rtcApiKey when the environment has none, even with ?apiKey= in the URL', () => {
    delete process.env.REACT_APP_RTC_API_KEY;
    setSearch('?apiKey=url-test-key');
    expect(getRtcApiKey()).toBeUndefined();
  });

  it('turns audio-only mode on only for ?audioOnly=1', () => {
    expect(isAudioOnly()).toBe(false);
    setSearch('?audioOnly=1');
    expect(isAudioOnly()).toBe(true);
    setSearch('?audioOnly=true');
    expect(isAudioOnly()).toBe(false);
  });

  it('turns the Detect switch, which alone decides whether App renders the Detect panel, on only for ?detect=1', () => {
    expect(isDetectOn()).toBe(false);
    setSearch('?detect=1');
    expect(isDetectOn()).toBe(true);
    setSearch('?detect=0');
    expect(isDetectOn()).toBe(false);
  });

  it('drops every query parameter whose name contains "key", in any case, and keeps the rest', () => {
    expect(
      withoutKeyParams({
        apiKey: 'a',
        APIKEY: 'b',
        key: 'c',
        rtcApiKeyX: 'd',
        monkey: 'e',
        run: 'Location',
        logLevel: 'info',
      })
    ).toEqual({ run: 'Location', logLevel: 'info' });
  });
});
