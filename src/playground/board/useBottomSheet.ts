import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Three-snap-point bottom-sheet drag controller.
 *
 * Snap points (as fraction of viewport height — small = sheet covers more):
 *   - expanded:  0.10 (sheet covers ~90%, top sits just below the Mom header)
 *   - default:   0.72 (sheet covers ~28%, header + thumb row visible)
 *   - collapsed: 0.90 (sheet covers ~10%, just the handle + label peek)
 *
 * The sheet never fully disappears — the collapsed snap leaves the drag
 * handle and a sliver of the saved label in view so the user can always
 * grab it back.
 *
 * Drag is wired via Pointer Events on the handle. While dragging the
 * sheet's `top` follows the pointer 1:1; on release it animates to the
 * nearest snap point.
 */

export type SheetSnap = 'expanded' | 'default' | 'collapsed';

const SNAP_FRACTIONS: Record<SheetSnap, number> = {
  expanded: 0.10,
  default: 0.72,
  collapsed: 0.90,
};

interface UseBottomSheetResult {
  /** Current `top` value in pixels — controls sheet position. Undefined
   *  until the first viewport measurement on mount. */
  topPx: number | undefined;
  /** Closest current snap, derived from topPx. Useful for switching the
   *  sheet body's layout (e.g. row → grid when expanded). */
  currentSnap: SheetSnap;
  /** True while the user is actively dragging — disables CSS transition. */
  isDragging: boolean;
  /** Pointer-event handlers for the drag handle. */
  handlePointerDown: (e: React.PointerEvent<HTMLElement>) => void;
  handlePointerMove: (e: React.PointerEvent<HTMLElement>) => void;
  handlePointerUp: (e: React.PointerEvent<HTMLElement>) => void;
  /** Programmatic snap — used by tap-to-expand on the sheet body. */
  snapTo: (snap: SheetSnap) => void;
}

export function useBottomSheet(initial: SheetSnap = 'default'): UseBottomSheetResult {
  const [topPx, setTopPx] = useState<number | undefined>(undefined);
  const [isDragging, setIsDragging] = useState(false);
  const snapPointsRef = useRef<Record<SheetSnap, number>>({
    expanded: 0,
    default: 0,
    collapsed: 0,
  });
  const startTopRef = useRef(0);
  const startYRef = useRef(0);
  // True if the pointer moved beyond the tap threshold during a press —
  // used on pointerUp to distinguish a drag (snap to closest) from a tap
  // (cycle to next snap). Without tap-to-cycle, users who don't think to
  // drag the handle have no way to reopen the sheet once it's collapsed.
  const movedRef = useRef(false);
  const TAP_THRESHOLD_PX = 5;

  // Measure viewport on mount + whenever it changes (orientation, resize).
  useEffect(() => {
    function recompute() {
      const vh = window.innerHeight;
      const points: Record<SheetSnap, number> = {
        expanded: Math.round(vh * SNAP_FRACTIONS.expanded),
        default: Math.round(vh * SNAP_FRACTIONS.default),
        collapsed: Math.round(vh * SNAP_FRACTIONS.collapsed),
      };
      snapPointsRef.current = points;
      setTopPx((prev) => prev ?? points[initial]);
    }
    recompute();
    window.addEventListener('resize', recompute);
    window.addEventListener('orientationchange', recompute);
    return () => {
      window.removeEventListener('resize', recompute);
      window.removeEventListener('orientationchange', recompute);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (topPx === undefined) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      setIsDragging(true);
      startTopRef.current = topPx;
      startYRef.current = e.clientY;
      movedRef.current = false;
    },
    [topPx],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!isDragging) return;
      const points = snapPointsRef.current;
      const delta = e.clientY - startYRef.current;
      if (Math.abs(delta) > TAP_THRESHOLD_PX) movedRef.current = true;
      const next = Math.max(
        points.expanded,
        Math.min(points.collapsed, startTopRef.current + delta),
      );
      setTopPx(next);
    },
    [isDragging],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      if (!isDragging || topPx === undefined) {
        setIsDragging(false);
        return;
      }
      setIsDragging(false);
      const points = snapPointsRef.current;

      // No drag → tap on handle. Cycle: from "default" → expanded; from
      // expanded or collapsed → default. Gives users who don't realize the
      // handle is draggable a single-tap way to open/close the sheet.
      if (!movedRef.current) {
        const candidates: SheetSnap[] = ['expanded', 'default', 'collapsed'];
        const closest = candidates.reduce((prev, curr) =>
          Math.abs(points[curr] - topPx) < Math.abs(points[prev] - topPx) ? curr : prev,
        );
        const nextSnap: SheetSnap = closest === 'default' ? 'expanded' : 'default';
        // Snap back to its exact pixel value to clear any float drift.
        setTopPx(points[nextSnap]);
        return;
      }

      // Drag → snap to closest of the three points.
      const candidates: Array<[SheetSnap, number]> = [
        ['expanded', points.expanded],
        ['default', points.default],
        ['collapsed', points.collapsed],
      ];
      const [, closestPx] = candidates.reduce((prev, curr) =>
        Math.abs(curr[1] - topPx) < Math.abs(prev[1] - topPx) ? curr : prev,
      );
      setTopPx(closestPx);
    },
    [isDragging, topPx],
  );

  const snapTo = useCallback((snap: SheetSnap) => {
    setTopPx(snapPointsRef.current[snap]);
  }, []);

  // Derive closest snap label from the live topPx so consumers can
  // restyle (e.g. row → grid layout) without re-doing the math.
  const currentSnap: SheetSnap = (() => {
    const points = snapPointsRef.current;
    if (topPx === undefined) return initial;
    const candidates: Array<[SheetSnap, number]> = [
      ['expanded', points.expanded],
      ['default', points.default],
      ['collapsed', points.collapsed],
    ];
    const [name] = candidates.reduce((prev, curr) =>
      Math.abs(curr[1] - topPx) < Math.abs(prev[1] - topPx) ? curr : prev,
    );
    return name;
  })();

  return {
    topPx,
    currentSnap,
    isDragging,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    snapTo,
  };
}
