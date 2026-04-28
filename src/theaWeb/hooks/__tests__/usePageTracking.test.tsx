import React from 'react';
import { render, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { usePageTracking } from '../usePageTracking';

const mockIsBot = jest.fn<boolean, []>();
jest.mock('../../lib/botDetect', () => ({
  isBot: () => mockIsBot(),
}));

function PageTrackingMount() {
  usePageTracking();
  return null;
}

function NavigateButton({ to }: { to: string }) {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate(to)} data-testid={`nav-${to}`}>
      go
    </button>
  );
}

describe('usePageTracking', () => {
  let fbq: jest.Mock;

  beforeEach(() => {
    fbq = jest.fn();
    (window as unknown as { fbq?: unknown }).fbq = fbq;
    mockIsBot.mockReset();
    mockIsBot.mockReturnValue(false);
  });

  afterEach(() => {
    delete (window as unknown as { fbq?: unknown }).fbq;
  });

  test('fires PageView on initial mount', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <PageTrackingMount />
      </MemoryRouter>,
    );
    expect(fbq).toHaveBeenCalledWith('track', 'PageView');
    expect(fbq).toHaveBeenCalledTimes(1);
  });

  test('fires PageView again on route change', () => {
    const { getByTestId } = render(
      <MemoryRouter initialEntries={['/']}>
        <PageTrackingMount />
        <Routes>
          <Route path="/" element={<NavigateButton to="/quiz" />} />
          <Route path="/quiz" element={<div>quiz</div>} />
        </Routes>
      </MemoryRouter>,
    );
    expect(fbq).toHaveBeenCalledTimes(1);

    act(() => {
      getByTestId('nav-/quiz').click();
    });

    expect(fbq).toHaveBeenCalledTimes(2);
    expect(fbq).toHaveBeenLastCalledWith('track', 'PageView');
  });

  test('does not fire when bot detected', () => {
    mockIsBot.mockReturnValue(true);
    render(
      <MemoryRouter initialEntries={['/']}>
        <PageTrackingMount />
      </MemoryRouter>,
    );
    expect(fbq).not.toHaveBeenCalled();
  });

  test('does not throw when fbq is undefined', () => {
    delete (window as unknown as { fbq?: unknown }).fbq;
    expect(() =>
      render(
        <MemoryRouter initialEntries={['/']}>
          <PageTrackingMount />
        </MemoryRouter>,
      ),
    ).not.toThrow();
  });
});
