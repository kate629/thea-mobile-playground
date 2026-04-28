import { act, renderHook } from '@testing-library/react';
import { useResultsCarousel } from '../useResultsCarousel';
import type { ResultsProductCardItem } from '../types';

const FAKE_PRODUCTS: ResultsProductCardItem[] = [
  { id: 'p1', imageUrl: '', title: 'A', brand: 'X', price: 10, productUrl: '#' },
  { id: 'p2', imageUrl: '', title: 'B', brand: 'Y', price: 20, productUrl: '#' },
];

function predicateAlways(value: boolean): (id: string) => boolean {
  return () => value;
}

describe('useResultsCarousel', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  test('dismiss puts the slot in "dismissing" state immediately', () => {
    const { result } = renderHook(() =>
      useResultsCarousel(FAKE_PRODUCTS, {
        isLiked: predicateAlways(false),
        isDismissed: predicateAlways(false),
        isPurchased: predicateAlways(false),
        exitingIds: new Set(),
      }),
    );

    expect(result.current.slots[0].state).toBe('idle');

    act(() => {
      result.current.dismiss('p1');
    });

    const p1Slot = result.current.slots.find((s) => s.item.id === 'p1');
    expect(p1Slot?.state).toBe('dismissing');
  });

  test('regression: slot STAYS in "dismissing" past 250ms while waiting for BE listener (was bug #19 flicker)', () => {
    // Caller-side `isDismissed` returns false for the entire test — simulating
    // the realistic case where the Firestore listener takes >250ms to fire.
    const { result } = renderHook(() =>
      useResultsCarousel(FAKE_PRODUCTS, {
        isLiked: predicateAlways(false),
        isDismissed: predicateAlways(false),
        isPurchased: predicateAlways(false),
        exitingIds: new Set(),
      }),
    );

    act(() => {
      result.current.dismiss('p1');
    });

    // Advance past the OLD 250ms hold + well into the typical BE window.
    act(() => {
      jest.advanceTimersByTime(1500);
    });

    // The OLD code would have cleared dismissingIds at 250ms and bounced
    // the slot back to 'idle' here — the visible flicker. The fix keeps it
    // in 'dismissing' until the BE listener flips isDismissed(id)=true.
    const p1Slot = result.current.slots.find((s) => s.item.id === 'p1');
    expect(p1Slot?.state).toBe('dismissing');
  });

  test('slot is filtered out once isDismissed(id) flips true (BE listener catches up)', () => {
    const dismissed = new Set<string>();
    const isDismissed = (id: string) => dismissed.has(id);

    const { result, rerender } = renderHook(
      ({ isDismissed: pred }) =>
        useResultsCarousel(FAKE_PRODUCTS, {
          isLiked: predicateAlways(false),
          isDismissed: pred,
          isPurchased: predicateAlways(false),
          exitingIds: new Set(),
        }),
      { initialProps: { isDismissed } },
    );

    act(() => {
      result.current.dismiss('p1');
    });
    expect(result.current.slots.find((s) => s.item.id === 'p1')?.state).toBe('dismissing');

    // Simulate the Firestore listener landing — the BE truth now says p1 is
    // dismissed. The hook watches the predicate identity, so we hand back
    // a fresh function with the updated set.
    dismissed.add('p1');
    rerender({ isDismissed: (id: string) => dismissed.has(id) });

    // p1 is now hidden (filtered out), p2 remains.
    expect(result.current.slots.map((s) => s.item.id)).toEqual(['p2']);
  });

  test('safety net: if isDismissed never flips, force-clear after 5s so the user is not permanently stuck', () => {
    const { result } = renderHook(() =>
      useResultsCarousel(FAKE_PRODUCTS, {
        isLiked: predicateAlways(false),
        isDismissed: predicateAlways(false),
        isPurchased: predicateAlways(false),
        exitingIds: new Set(),
      }),
    );

    act(() => {
      result.current.dismiss('p1');
    });
    expect(result.current.slots.find((s) => s.item.id === 'p1')?.state).toBe('dismissing');

    // Advance past the 5s safety net.
    act(() => {
      jest.advanceTimersByTime(5500);
    });

    // The slot should now be back in 'idle' (or filtered, depending on
    // isDismissed) — but we asserted isDismissed=false above, so 'idle'.
    expect(result.current.slots.find((s) => s.item.id === 'p1')?.state).toBe('idle');
  });

  test('liked products are filtered out unless they are in exitingIds (caller-driven exit animation)', () => {
    // Smoke: confirm we did not regress the liked-exit path.
    const liked = new Set(['p1']);
    const { result } = renderHook(() =>
      useResultsCarousel(FAKE_PRODUCTS, {
        isLiked: (id) => liked.has(id),
        isDismissed: predicateAlways(false),
        isPurchased: predicateAlways(false),
        exitingIds: new Set(['p1']),
      }),
    );

    // p1 is liked AND in exitingIds → still rendered, in 'exiting' state.
    const slots = result.current.slots;
    expect(slots.find((s) => s.item.id === 'p1')?.state).toBe('exiting');
  });
});
