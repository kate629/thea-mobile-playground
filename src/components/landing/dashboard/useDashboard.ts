import { useCallback, useState } from 'react';
import { QuestPillSegmentKey } from './types';

export interface DashboardSlice {
  openSegment: QuestPillSegmentKey | null;
  toggleSegment: (key: QuestPillSegmentKey) => void;
  closeSegments: () => void;
  /** Increments on every `triggerSparkle` call so the search button can re-key for animation. */
  sparklePulseKey: number;
  triggerSparkle: () => void;
}

export interface UseDashboardOptions {
  initialOpenSegment?: QuestPillSegmentKey | null;
  /** Forwarded to the search button. Container fires `triggerSparkle` after invoking this. */
  onSparkle?: () => void;
}

export function useDashboard(opts: UseDashboardOptions = {}): DashboardSlice {
  const { initialOpenSegment = null, onSparkle } = opts;
  const [openSegment, setOpenSegment] = useState<QuestPillSegmentKey | null>(initialOpenSegment);
  const [sparklePulseKey, setSparklePulseKey] = useState(0);

  const toggleSegment = useCallback((key: QuestPillSegmentKey) => {
    setOpenSegment((prev) => (prev === key ? null : key));
  }, []);

  const closeSegments = useCallback(() => setOpenSegment(null), []);

  const triggerSparkle = useCallback(() => {
    onSparkle?.();
    setSparklePulseKey((k) => k + 1);
  }, [onSparkle]);

  return { openSegment, toggleSegment, closeSegments, sparklePulseKey, triggerSparkle };
}
