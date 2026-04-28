import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useLeaveWarning } from '../useLeaveWarning';

// Mock useNavigate so we can assert it was called with the right path
// without coupling the test to a real router state machine.
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

describe('useLeaveWarning', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('starts closed', () => {
    const { result } = renderHook(() => useLeaveWarning(), { wrapper });
    expect(result.current.open).toBe(false);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('requestLeave opens the dialog without navigating', () => {
    const { result } = renderHook(() => useLeaveWarning(), { wrapper });
    act(() => result.current.requestLeave());
    expect(result.current.open).toBe(true);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('cancelLeave closes the dialog without navigating', () => {
    const { result } = renderHook(() => useLeaveWarning(), { wrapper });
    act(() => result.current.requestLeave());
    expect(result.current.open).toBe(true);

    act(() => result.current.cancelLeave());
    expect(result.current.open).toBe(false);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('confirmLeave closes the dialog AND navigates to "/" by default', () => {
    const { result } = renderHook(() => useLeaveWarning(), { wrapper });
    act(() => result.current.requestLeave());
    act(() => result.current.confirmLeave());
    expect(result.current.open).toBe(false);
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('confirmLeave honors a custom destination', () => {
    const { result } = renderHook(() => useLeaveWarning('/somewhere-else'), {
      wrapper,
    });
    act(() => result.current.requestLeave());
    act(() => result.current.confirmLeave());
    expect(mockNavigate).toHaveBeenCalledWith('/somewhere-else');
  });

  it('action callbacks are stable across renders (memoized)', () => {
    const { result, rerender } = renderHook(() => useLeaveWarning(), {
      wrapper,
    });
    const first = {
      request: result.current.requestLeave,
      confirm: result.current.confirmLeave,
      cancel: result.current.cancelLeave,
    };
    rerender();
    expect(result.current.requestLeave).toBe(first.request);
    expect(result.current.confirmLeave).toBe(first.confirm);
    expect(result.current.cancelLeave).toBe(first.cancel);
  });
});
