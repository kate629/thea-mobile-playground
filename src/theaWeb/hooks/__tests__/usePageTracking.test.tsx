import React from 'react';
import { render, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { usePageTracking } from '../usePageTracking';

const mockIsBot = jest.fn<boolean, []>();
jest.mock('../../lib/botDetect', () => ({
  isBot: () => mockIsBot(),
}));

// Fire idle callbacks synchronously so the page-view assertions can run sync.
jest.mock('../../lib/idleCallback', () => ({
  fireWhenIdle: (fn: () => void) => fn(),
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
  let gtag: jest.Mock;

  beforeEach(() => {
    fbq = jest.fn();
    gtag = jest.fn();
    (window as unknown as { fbq?: unknown }).fbq = fbq;
    (window as unknown as { gtag?: unknown }).gtag = gtag;
    mockIsBot.mockReset();
    mockIsBot.mockReturnValue(false);
  });

  afterEach(() => {
    delete (window as unknown as { fbq?: unknown }).fbq;
    delete (window as unknown as { gtag?: unknown }).gtag;
  });

  test('fires PageView on both Meta and GA on initial mount', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <PageTrackingMount />
      </MemoryRouter>,
    );
    expect(fbq).toHaveBeenCalledWith('track', 'PageView');
    expect(fbq).toHaveBeenCalledTimes(1);
    expect(gtag).toHaveBeenCalledWith('event', 'page_view', expect.any(Object));
    expect(gtag).toHaveBeenCalledTimes(1);
  });

  test('fires PageView on both pixels again on route change', () => {
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
    expect(gtag).toHaveBeenCalledTimes(1);

    act(() => {
      getByTestId('nav-/quiz').click();
    });

    expect(fbq).toHaveBeenCalledTimes(2);
    expect(fbq).toHaveBeenLastCalledWith('track', 'PageView');
    expect(gtag).toHaveBeenCalledTimes(2);
    expect(gtag).toHaveBeenLastCalledWith('event', 'page_view', expect.any(Object));
  });

  test('does not fire either pixel when bot detected', () => {
    mockIsBot.mockReturnValue(true);
    render(
      <MemoryRouter initialEntries={['/']}>
        <PageTrackingMount />
      </MemoryRouter>,
    );
    expect(fbq).not.toHaveBeenCalled();
    expect(gtag).not.toHaveBeenCalled();
  });

  test('does not throw when fbq and gtag are undefined', () => {
    delete (window as unknown as { fbq?: unknown }).fbq;
    delete (window as unknown as { gtag?: unknown }).gtag;
    expect(() =>
      render(
        <MemoryRouter initialEntries={['/']}>
          <PageTrackingMount />
        </MemoryRouter>,
      ),
    ).not.toThrow();
  });
});
