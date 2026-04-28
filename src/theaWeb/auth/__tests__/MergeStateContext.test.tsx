import React from 'react';
import { act, render, renderHook } from '@testing-library/react';
import {
  MergeStateProvider,
  useMergeStatus,
  useSetMergeStatus,
} from '../MergeStateContext';

const wrapper =
  (timeoutMs?: number) =>
  ({ children }: { children: React.ReactNode }) =>
    (
      <MergeStateProvider safetyTimeoutMs={timeoutMs}>
        {children}
      </MergeStateProvider>
    );

describe('MergeStateContext', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  test('default status is idle when no provider mounted', () => {
    const { result } = renderHook(() => useMergeStatus());
    expect(result.current).toBe('idle');
  });

  test('useSetMergeStatus is a no-op when no provider mounted', () => {
    const { result } = renderHook(() => useSetMergeStatus());
    expect(() => result.current('merging')).not.toThrow();
  });

  test('initial status under provider is idle', () => {
    const { result } = renderHook(() => useMergeStatus(), { wrapper: wrapper() });
    expect(result.current).toBe('idle');
  });

  test('full lifecycle: idle → merging → merged', () => {
    const Probe: React.FC<{ onRender: (s: string, set: (s: any) => void) => void }> = ({
      onRender,
    }) => {
      const status = useMergeStatus();
      const setStatus = useSetMergeStatus();
      onRender(status, setStatus);
      return null;
    };
    let lastStatus = '';
    let setter: (s: any) => void = () => undefined;
    render(
      <MergeStateProvider>
        <Probe
          onRender={(s, set) => {
            lastStatus = s;
            setter = set;
          }}
        />
      </MergeStateProvider>,
    );
    expect(lastStatus).toBe('idle');

    act(() => setter('merging'));
    expect(lastStatus).toBe('merging');

    act(() => setter('merged'));
    expect(lastStatus).toBe('merged');
  });

  test('safety timeout flips merging → failed when caller never reports completion', () => {
    const Probe: React.FC<{ onRender: (s: string, set: (s: any) => void) => void }> = ({
      onRender,
    }) => {
      const status = useMergeStatus();
      const setStatus = useSetMergeStatus();
      onRender(status, setStatus);
      return null;
    };
    let lastStatus = '';
    let setter: (s: any) => void = () => undefined;
    render(
      <MergeStateProvider safetyTimeoutMs={15000}>
        <Probe
          onRender={(s, set) => {
            lastStatus = s;
            setter = set;
          }}
        />
      </MergeStateProvider>,
    );

    act(() => setter('merging'));
    expect(lastStatus).toBe('merging');

    // Advance just under timeout — still merging.
    act(() => {
      jest.advanceTimersByTime(14999);
    });
    expect(lastStatus).toBe('merging');

    // Cross timeout boundary — auto-flip to failed.
    act(() => {
      jest.advanceTimersByTime(2);
    });
    expect(lastStatus).toBe('failed');
  });

  test('reporting merged before timeout cancels the timer', () => {
    const Probe: React.FC<{ onRender: (s: string, set: (s: any) => void) => void }> = ({
      onRender,
    }) => {
      const status = useMergeStatus();
      const setStatus = useSetMergeStatus();
      onRender(status, setStatus);
      return null;
    };
    let lastStatus = '';
    let setter: (s: any) => void = () => undefined;
    render(
      <MergeStateProvider safetyTimeoutMs={15000}>
        <Probe
          onRender={(s, set) => {
            lastStatus = s;
            setter = set;
          }}
        />
      </MergeStateProvider>,
    );

    act(() => setter('merging'));
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    act(() => setter('merged'));
    // Advance past the original timeout — should NOT flip back to failed.
    act(() => {
      jest.advanceTimersByTime(20000);
    });
    expect(lastStatus).toBe('merged');
  });

  test('idle reset cancels the safety timer', () => {
    const Probe: React.FC<{ onRender: (s: string, set: (s: any) => void) => void }> = ({
      onRender,
    }) => {
      const status = useMergeStatus();
      const setStatus = useSetMergeStatus();
      onRender(status, setStatus);
      return null;
    };
    let lastStatus = '';
    let setter: (s: any) => void = () => undefined;
    render(
      <MergeStateProvider safetyTimeoutMs={15000}>
        <Probe
          onRender={(s, set) => {
            lastStatus = s;
            setter = set;
          }}
        />
      </MergeStateProvider>,
    );

    act(() => setter('merging'));
    act(() => setter('idle'));
    act(() => {
      jest.advanceTimersByTime(20000);
    });
    expect(lastStatus).toBe('idle');
  });
});
