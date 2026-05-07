import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Two-snap-point bottom-sheet controller.
 *
 * Snap points (as fraction of viewport height — small = sheet covers more):
 *   - expanded: 0.17 (sheet covers ~83%, top sits just below the search pill,
 *                     so the chip-tab strip is COVERED by the sheet — by
 *                     design, since the sheet is the focus when expanded)
 *   - default:  0.72 (sheet covers ~28%, header label + thumb row visible)
 *
 * Drag was removed in favor of an explicit expand/retract icon at the
 * top-right of the sheet. The hook just exposes the current snap, the
 * topPx for positioning, and a toggle.
 */

export type SheetSnap = 'expanded' | 'default';

const SNAP_FRACTIONS: Record<SheetSnap, number> = {
  expanded: 0.17,
  default: 0.72,
};

interface UseBottomSheetResult {
  topPx: number | undefined;
  currentSnap: SheetSnap;
  setSnap: (snap: SheetSnap) => void;
  toggle: () => void;
}

export function useBottomSheet(initial: SheetSnap = 'default'): UseBottomSheetResult {
  const [currentSnap, setCurrentSnap] = useState<SheetSnap>(initial);
  const [topPx, setTopPx] = useState<number | undefined>(undefined);
  const snapPointsRef = useRef<Record<SheetSnap, number>>({ expanded: 0, default: 0 });

  useEffect(() => {
    function recompute() {
      const vh = window.innerHeight;
      const points: Record<SheetSnap, number> = {
        expanded: Math.round(vh * SNAP_FRACTIONS.expanded),
        default: Math.round(vh * SNAP_FRACTIONS.default),
      };
      snapPointsRef.current = points;
      setTopPx(points[currentSnap]);
    }
    recompute();
    window.addEventListener('resize', recompute);
    window.addEventListener('orientationchange', recompute);
    return () => {
      window.removeEventListener('resize', recompute);
      window.removeEventListener('orientationchange', recompute);
    };
  }, [currentSnap]);

  const setSnap = useCallback((snap: SheetSnap) => {
    setCurrentSnap(snap);
  }, []);

  const toggle = useCallback(() => {
    setCurrentSnap((prev) => (prev === 'expanded' ? 'default' : 'expanded'));
  }, []);

  return { topPx, currentSnap, setSnap, toggle };
}
