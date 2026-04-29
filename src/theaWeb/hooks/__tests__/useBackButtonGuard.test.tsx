import { renderHook, act } from '@testing-library/react';
import { useBackButtonGuard } from '../useBackButtonGuard';

// jsdom provides window.history. We don't need a router here — the hook
// only touches window.history + the popstate event, not react-router.
describe('useBackButtonGuard', () => {
  let pushStateSpy: jest.SpyInstance;
  let goSpy: jest.SpyInstance;
  let backSpy: jest.SpyInstance;

  beforeEach(() => {
    // Reset history to a clean state per test.
    window.history.replaceState(null, '', '/quiz');
    pushStateSpy = jest.spyOn(window.history, 'pushState');
    goSpy = jest.spyOn(window.history, 'go').mockImplementation((delta?: number) => {
      // Simulate the browser back: emit one popstate per step popped, each
      // with non-sentinel state (the hook only inspects sentinel-shape state,
      // so null is "non-sentinel"/release-style).
      const steps = Math.abs(delta ?? 0);
      for (let i = 0; i < steps; i += 1) {
        window.dispatchEvent(new PopStateEvent('popstate', { state: null }));
      }
    });
    // Cleanup path uses history.back() — keep that spy for that branch.
    backSpy = jest.spyOn(window.history, 'back').mockImplementation(() => {
      window.dispatchEvent(new PopStateEvent('popstate', { state: null }));
    });
  });

  afterEach(() => {
    pushStateSpy.mockRestore();
    goSpy.mockRestore();
    backSpy.mockRestore();
  });

  it('arms a sentinel on mount when enabled', () => {
    const onTrigger = jest.fn();
    renderHook(() => useBackButtonGuard(true, onTrigger));
    expect(pushStateSpy).toHaveBeenCalledTimes(1);
    expect(pushStateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ theaQuizGuard: true }),
      '',
    );
  });

  it('does NOT arm when disabled', () => {
    const onTrigger = jest.fn();
    renderHook(() => useBackButtonGuard(false, onTrigger));
    expect(pushStateSpy).not.toHaveBeenCalled();
  });

  it('on browser back: re-pushes sentinel and fires onTrigger (Stay path)', () => {
    const onTrigger = jest.fn();
    renderHook(() => useBackButtonGuard(true, onTrigger));
    expect(pushStateSpy).toHaveBeenCalledTimes(1); // arm

    // Simulate the user pressing browser back: popstate fires with the
    // previous state (non-sentinel).
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate', { state: null }));
    });

    expect(onTrigger).toHaveBeenCalledTimes(1);
    // Sentinel should have been re-pushed so the URL stays put and
    // the NEXT back press also gets intercepted.
    expect(pushStateSpy).toHaveBeenCalledTimes(2);
  });

  it('release() lets a subsequent popstate through without re-firing onTrigger (Leave path)', () => {
    const onTrigger = jest.fn();
    const { result } = renderHook(() => useBackButtonGuard(true, onTrigger));

    // User clicks "Leave" inside the modal. The hook calls history.go(-1),
    // which emits popstate; that popstate is the disarmed one and should
    // pass through silently.
    act(() => {
      result.current.release();
    });

    expect(goSpy).toHaveBeenCalledWith(-1);
    // The release-driven popstate did NOT fire onTrigger again.
    expect(onTrigger).not.toHaveBeenCalled();
  });

  it('release(1) pops 2 entries and silently passes BOTH popstates through (scroll-restore path)', () => {
    const onTrigger = jest.fn();
    const { result } = renderHook(() => useBackButtonGuard(true, onTrigger));
    expect(pushStateSpy).toHaveBeenCalledTimes(1); // arm

    // User confirmed Leave; we want to pop sentinel + the /quiz entry so the
    // browser's popstate-driven scroll restoration fires on the entry-point
    // page (e.g., /occasion/mothers_day).
    act(() => {
      result.current.release(1);
    });

    expect(goSpy).toHaveBeenCalledWith(-2);
    // Neither of the two intermediate popstates should re-arm/fire onTrigger.
    expect(onTrigger).not.toHaveBeenCalled();
    // No new sentinel push happened during release.
    expect(pushStateSpy).toHaveBeenCalledTimes(1);
  });

  it('after release(N), a subsequent independent back press re-arms (next leave still trapped)', () => {
    const onTrigger = jest.fn();
    const { result } = renderHook(() => useBackButtonGuard(true, onTrigger));

    act(() => {
      result.current.release(1);
    });
    expect(onTrigger).not.toHaveBeenCalled();

    // A fresh user-initiated back press AFTER release should fire normally —
    // the disarm counter is exhausted.
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate', { state: null }));
    });
    expect(onTrigger).toHaveBeenCalledTimes(1);
  });

  it('callback is captured by ref so re-renders pick up the latest closure', () => {
    const first = jest.fn();
    const second = jest.fn();
    const { rerender } = renderHook(
      ({ cb }: { cb: () => void }) => useBackButtonGuard(true, cb),
      { initialProps: { cb: first } },
    );

    rerender({ cb: second });

    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate', { state: null }));
    });

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
