import { renderHook, act } from '@testing-library/react';
import { useDashboard } from '../useDashboard';

describe('useDashboard', () => {
  it('toggles a segment open and closes it on second click', () => {
    const { result } = renderHook(() => useDashboard());
    expect(result.current.openSegment).toBeNull();

    act(() => result.current.toggleSegment('who'));
    expect(result.current.openSegment).toBe('who');

    act(() => result.current.toggleSegment('who'));
    expect(result.current.openSegment).toBeNull();
  });

  it('switches the open segment when a different key is toggled', () => {
    const { result } = renderHook(() => useDashboard());
    act(() => result.current.toggleSegment('who'));
    act(() => result.current.toggleSegment('what'));
    expect(result.current.openSegment).toBe('what');
  });

  it('closeSegments clears the open segment', () => {
    const { result } = renderHook(() => useDashboard({ initialOpenSegment: 'likes' }));
    expect(result.current.openSegment).toBe('likes');
    act(() => result.current.closeSegments());
    expect(result.current.openSegment).toBeNull();
  });

  it('triggerSparkle increments the pulse key and invokes the callback', () => {
    const onSparkle = jest.fn();
    const { result } = renderHook(() => useDashboard({ onSparkle }));
    expect(result.current.sparklePulseKey).toBe(0);

    act(() => result.current.triggerSparkle());
    expect(result.current.sparklePulseKey).toBe(1);

    act(() => result.current.triggerSparkle());
    expect(result.current.sparklePulseKey).toBe(2);

    expect(onSparkle).toHaveBeenCalledTimes(2);
  });
});
