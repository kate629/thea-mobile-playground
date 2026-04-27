import React from 'react';
import { act, render } from '@testing-library/react';
import { useExitAnimationQueue } from '../useExitAnimationQueue';

const DURATION = 100;

interface HarnessProps {
  liked: Set<string>;
  hydrated: boolean;
  onState?: (exiting: Set<string>) => void;
}

const Harness: React.FC<HarnessProps> = ({ liked, hydrated, onState }) => {
  const exiting = useExitAnimationQueue(liked, hydrated, DURATION);
  React.useEffect(() => {
    onState?.(exiting);
  });
  return null;
};

describe('useExitAnimationQueue', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  test('first mount with hydrated liked Set does NOT animate (Kate report 2026-04-26)', () => {
    // Headline regression: page mounts, listener fires with already-saved
    // products. None of these should slide out — they were saved long ago,
    // not "just liked." Pre-refactor bug: white gaps because every persisted
    // like got the 1.1s exit animation.
    let latest: Set<string> | null = null;
    render(
      <Harness
        liked={new Set(['p1', 'p2', 'p3'])}
        hydrated={true}
        onState={(s) => (latest = s)}
      />,
    );
    expect(latest!.size).toBe(0);
  });

  test('real-world hydration sequence (auth resolves BEFORE snapshot) does NOT animate', () => {
    // Real Firebase mount order:
    //   1) render with (liked={}, hydrated=false) — useGiftActivities hasn't
    //      received a snapshot yet, but auth may already be resolved
    //   2) render with (liked={migrated saves}, hydrated=true) — first
    //      snapshot arrived
    // The hook MUST treat (1)→(2) as a seeding event (no animation), even
    // though `liked` grew. Earlier versions seeded on uid change, which
    // fired BEFORE the snapshot — so the snapshot's contents were detected
    // as a wave of "newly liked" ids and every persisted save animated out.
    let latest: Set<string> | null = null;
    const { rerender } = render(
      <Harness liked={new Set()} hydrated={false} onState={(s) => (latest = s)} />,
    );
    expect(latest!.size).toBe(0);

    rerender(
      <Harness
        liked={new Set(['saved-1', 'saved-2', 'saved-3'])}
        hydrated={true}
        onState={(s) => (latest = s)}
      />,
    );
    expect(latest!.size).toBe(0);
  });

  test('no-change re-render does NOT animate', () => {
    // Tab change re-renders the page but `liked` is unchanged. No animation
    // should be queued.
    let latest: Set<string> | null = null;
    const liked = new Set(['p1']);
    const { rerender } = render(
      <Harness liked={liked} hydrated={true} onState={(s) => (latest = s)} />,
    );
    expect(latest!.size).toBe(0);

    rerender(
      <Harness liked={liked} hydrated={true} onState={(s) => (latest = s)} />,
    );
    expect(latest!.size).toBe(0);
  });

  test('newly-added id gets queued for the animation duration', () => {
    let latest: Set<string> | null = null;
    const { rerender } = render(
      <Harness
        liked={new Set(['p1'])}
        hydrated={true}
        onState={(s) => (latest = s)}
      />,
    );
    expect(latest!.size).toBe(0);

    rerender(
      <Harness
        liked={new Set(['p1', 'p2'])}
        hydrated={true}
        onState={(s) => (latest = s)}
      />,
    );
    expect(Array.from(latest!)).toEqual(['p2']);

    act(() => {
      jest.advanceTimersByTime(DURATION + 10);
    });
    expect(latest!.size).toBe(0);
  });

  test('uid-swap sequence (hydrated true → false → true) does NOT animate', () => {
    // mergeGiftFlow path: useGiftActivities resets to (liked={}, hydrated=false)
    // on uid change, then re-hydrates to (liked={merged}, hydrated=true) on
    // the next snapshot. No animation in either transition — every id in the
    // re-hydrated Set is "already-saved," not freshly clicked.
    let latest: Set<string> | null = null;
    const { rerender } = render(
      <Harness
        liked={new Set(['anon-1'])}
        hydrated={true}
        onState={(s) => (latest = s)}
      />,
    );
    rerender(
      <Harness liked={new Set()} hydrated={false} onState={(s) => (latest = s)} />,
    );
    rerender(
      <Harness
        liked={new Set(['anon-1', 'permanent-2', 'permanent-3'])}
        hydrated={true}
        onState={(s) => (latest = s)}
      />,
    );
    expect(latest!.size).toBe(0);
  });

  test('post-uid-swap, brand-new likes still animate', () => {
    let latest: Set<string> | null = null;
    const { rerender } = render(
      <Harness
        liked={new Set(['anon-1'])}
        hydrated={true}
        onState={(s) => (latest = s)}
      />,
    );
    rerender(
      <Harness liked={new Set()} hydrated={false} onState={(s) => (latest = s)} />,
    );
    rerender(
      <Harness
        liked={new Set(['anon-1', 'permanent-2'])}
        hydrated={true}
        onState={(s) => (latest = s)}
      />,
    );
    expect(latest!.size).toBe(0);

    rerender(
      <Harness
        liked={new Set(['anon-1', 'permanent-2', 'just-clicked'])}
        hydrated={true}
        onState={(s) => (latest = s)}
      />,
    );
    expect(Array.from(latest!)).toEqual(['just-clicked']);
  });

  test('tab-change scenario (re-render with new but content-equal Set) does NOT animate', () => {
    // The Firestore listener may push a fresh Set with the same contents on
    // a no-op snapshot. Even though Set IDENTITY changes, no id is "newly
    // liked." Without this guarantee the carousel re-animates persisted
    // saves on every snapshot.
    let latest: Set<string> | null = null;
    const { rerender } = render(
      <Harness
        liked={new Set(['p1', 'p2'])}
        hydrated={true}
        onState={(s) => (latest = s)}
      />,
    );
    expect(latest!.size).toBe(0);

    // Same content, fresh Set instance — what a no-op snapshot pushes.
    rerender(
      <Harness
        liked={new Set(['p1', 'p2'])}
        hydrated={true}
        onState={(s) => (latest = s)}
      />,
    );
    expect(latest!.size).toBe(0);
  });
});
