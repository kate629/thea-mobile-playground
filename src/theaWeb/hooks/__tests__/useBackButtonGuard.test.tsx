import { renderHook, act } from '@testing-library/react';
import { useBackButtonGuard } from '../useBackButtonGuard';

// jsdom provides window.history. We don't need a router here — the hook
// only touches window.history + the popstate event, not react-router.
describe('useBackButtonGuard', () => {
  let pushStateSpy: jest.SpyInstance;
  let backSpy: jest.SpyInstance;

  beforeEach(() => {
    // Reset history to a clean state per test.
    window.history.replaceState(null, '', '/quiz');
    pushStateSpy = jest.spyOn(window.history, 'pushState');
    backSpy = jest.spyOn(window.history, 'back').mockImplementation(() => {
      // Simulate the browser back: emit popstate with the previous state
      // (here we just emit `null` — the hook only inspects sentinel-shaped
      // state, so a null popstate is "non-sentinel"/release-style).
      window.dispatchEvent(new PopStateEvent('popstate', { state: null }));
    });
  });

  afterEach(() => {
    pushStateSpy.mockRestore();
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

    // User clicks "Leave" inside the modal. The hook calls history.back(),
    // which emits popstate; that popstate is the disarmed one and should
    // pass through silently.
    act(() => {
      result.current.release();
    });

    expect(backSpy).toHaveBeenCalledTimes(1);
    // The release-driven popstate did NOT fire onTrigger again.
    expect(onTrigger).not.toHaveBeenCalled();
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
