import { _resetBotCacheForTesting, isBot } from '../botDetect';

// jsdom defaults: navigator.userAgent contains 'jsdom', plugins is empty,
// languages is ['en-US']. We override per-test to exercise specific branches.

function setNavigator(overrides: Partial<{
  webdriver: boolean;
  userAgent: string;
  languages: readonly string[];
  plugins: ArrayLike<unknown>;
  chromeWindow: boolean;
}>) {
  if ('webdriver' in overrides) {
    Object.defineProperty(navigator, 'webdriver', {
      configurable: true,
      get: () => overrides.webdriver,
    });
  }
  if ('userAgent' in overrides) {
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      get: () => overrides.userAgent,
    });
  }
  if ('languages' in overrides) {
    Object.defineProperty(navigator, 'languages', {
      configurable: true,
      get: () => overrides.languages,
    });
  }
  if ('plugins' in overrides) {
    Object.defineProperty(navigator, 'plugins', {
      configurable: true,
      get: () => overrides.plugins,
    });
  }
  if ('chromeWindow' in overrides) {
    if (overrides.chromeWindow) {
      (window as unknown as { chrome?: unknown }).chrome = {};
    } else {
      delete (window as unknown as { chrome?: unknown }).chrome;
    }
  }
}

function setScreenDims(width: number, height: number) {
  Object.defineProperty(window.screen, 'width', { configurable: true, get: () => width });
  Object.defineProperty(window.screen, 'height', { configurable: true, get: () => height });
}

beforeEach(() => {
  _resetBotCacheForTesting();
  // Reset to a sane "real desktop Chrome" baseline. jsdom defaults screen
  // to 0×0, which would trip the bot heuristic — override.
  setNavigator({
    webdriver: false,
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    languages: ['en-US', 'en'],
    plugins: [{}, {}],
    chromeWindow: true,
  });
  setScreenDims(1280, 800);
});

describe('isBot', () => {
  test('returns false for a real desktop Chrome', () => {
    expect(isBot()).toBe(false);
  });

  test('returns true when navigator.webdriver is set', () => {
    setNavigator({ webdriver: true });
    expect(isBot()).toBe(true);
  });

  test('returns true when desktop Chrome UA but window.chrome missing', () => {
    setNavigator({ chromeWindow: false });
    expect(isBot()).toBe(true);
  });

  test('returns true when navigator.languages is empty', () => {
    setNavigator({ languages: [] });
    expect(isBot()).toBe(true);
  });

  test('returns true when desktop Chrome has zero plugins', () => {
    setNavigator({ plugins: [] });
    expect(isBot()).toBe(true);
  });

  test('caches the result across calls', () => {
    expect(isBot()).toBe(false);
    setNavigator({ webdriver: true });
    // Cached — even though we mutated navigator, the previous result sticks.
    expect(isBot()).toBe(false);
  });
});
