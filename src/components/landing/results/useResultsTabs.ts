import { useCallback, useState } from 'react';
import { ResultsTabKey } from './types';

export interface UseResultsTabsOptions {
  initial?: ResultsTabKey;
  /** Optional smooth-scroll-to-top side-effect on tab change. No-op in stories. */
  scrollToTop?: () => void;
}

export interface ResultsTabsSlice {
  activeTab: ResultsTabKey;
  setActiveTab: (tab: ResultsTabKey) => void;
}

export function useResultsTabs(opts: UseResultsTabsOptions = {}): ResultsTabsSlice {
  const [activeTab, setActiveTabState] = useState<ResultsTabKey>(opts.initial ?? 'recommended');
  const setActiveTab = useCallback(
    (tab: ResultsTabKey) => {
      setActiveTabState(tab);
      opts.scrollToTop?.();
    },
    [opts],
  );
  return { activeTab, setActiveTab };
}
