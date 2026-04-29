import { fireWhenIdle } from '../idleCallback';

describe('fireWhenIdle', () => {
  const realRequestIdle = (window as any).requestIdleCallback;

  afterEach(() => {
    (window as any).requestIdleCallback = realRequestIdle;
    jest.useRealTimers();
  });

  it('uses requestIdleCallback when available', () => {
    const ric = jest.fn((cb: any) => {
      cb();
      return 1;
    });
    (window as any).requestIdleCallback = ric;

    const work = jest.fn();
    fireWhenIdle(work);

    expect(ric).toHaveBeenCalledTimes(1);
    expect(work).toHaveBeenCalledTimes(1);
  });

  it('falls back to setTimeout when requestIdleCallback is unavailable', () => {
    (window as any).requestIdleCallback = undefined;
    jest.useFakeTimers();

    const work = jest.fn();
    fireWhenIdle(work);

    expect(work).not.toHaveBeenCalled();
    jest.runAllTimers();
    expect(work).toHaveBeenCalledTimes(1);
  });

  it('swallows exceptions thrown by the callback', () => {
    (window as any).requestIdleCallback = (cb: any) => {
      cb();
      return 1;
    };

    expect(() =>
      fireWhenIdle(() => {
        throw new Error('boom');
      }),
    ).not.toThrow();
  });
});
