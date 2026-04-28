import React from 'react';
import { act, render } from '@testing-library/react';
import { useImagesPreloaded } from '../useImagesPreloaded';

interface HarnessProps {
  urls: string[];
  firstN?: number;
  timeoutMs?: number;
  onReady?: (ready: boolean) => void;
}

const Harness: React.FC<HarnessProps> = ({ urls, firstN, timeoutMs, onReady }) => {
  const ready = useImagesPreloaded(urls, { firstN, timeoutMs });
  React.useEffect(() => {
    onReady?.(ready);
  }, [ready, onReady]);
  return <span data-testid="ready">{String(ready)}</span>;
};

// Track Image instances created by the hook so tests can fire onload/onerror.
const created: Array<{ src: string; onload: () => void; onerror: () => void }> = [];

class FakeImage {
  _src = '';
  onload: () => void = () => {};
  onerror: () => void = () => {};
  set src(v: string) {
    this._src = v;
    created.push({ src: v, onload: () => this.onload(), onerror: () => this.onerror() });
  }
  get src(): string {
    return this._src;
  }
}

describe('useImagesPreloaded', () => {
  let originalImage: typeof Image;

  beforeEach(() => {
    jest.useFakeTimers();
    created.length = 0;
    originalImage = window.Image;
    // @ts-expect-error — overriding the constructor for the duration of the test
    window.Image = FakeImage;
  });
  afterEach(() => {
    window.Image = originalImage;
    jest.useRealTimers();
  });

  test('returns false when urls is empty', () => {
    const { getByTestId } = render(<Harness urls={[]} />);
    expect(getByTestId('ready').textContent).toBe('false');
  });

  test('flips to true once first N images fire onload (bug #50)', () => {
    const { getByTestId } = render(<Harness urls={['a', 'b', 'c', 'd']} firstN={3} />);
    expect(getByTestId('ready').textContent).toBe('false');
    expect(created.map((c) => c.src)).toEqual(['a', 'b', 'c']);

    // Two of three loaded — not ready yet.
    act(() => {
      created[0].onload();
      created[1].onload();
    });
    expect(getByTestId('ready').textContent).toBe('false');

    // Third loads — flip.
    act(() => {
      created[2].onload();
    });
    expect(getByTestId('ready').textContent).toBe('true');
  });

  test('counts onerror as completed so a broken image does not strand ready', () => {
    const { getByTestId } = render(<Harness urls={['a', 'b', 'c']} firstN={3} />);
    act(() => {
      created[0].onload();
      created[1].onerror(); // simulate 404 on the CDN
      created[2].onload();
    });
    expect(getByTestId('ready').textContent).toBe('true');
  });

  test('safety-net timeout flips ready=true after timeoutMs even if no images load (bug #50)', () => {
    const { getByTestId } = render(<Harness urls={['a', 'b', 'c']} firstN={3} timeoutMs={30000} />);
    expect(getByTestId('ready').textContent).toBe('false');

    act(() => {
      jest.advanceTimersByTime(29999);
    });
    expect(getByTestId('ready').textContent).toBe('false');

    act(() => {
      jest.advanceTimersByTime(2);
    });
    expect(getByTestId('ready').textContent).toBe('true');
  });

  test('ignores trailing urls beyond firstN', () => {
    render(<Harness urls={['a', 'b', 'c', 'd', 'e']} firstN={3} />);
    expect(created.map((c) => c.src)).toEqual(['a', 'b', 'c']);
  });

  test('filters falsy urls before counting', () => {
    render(<Harness urls={['', 'a', '', 'b', 'c']} firstN={3} />);
    expect(created.map((c) => c.src)).toEqual(['a', 'b', 'c']);
  });

  test('is sticky once ready — does not flip back when urls change', () => {
    const { getByTestId, rerender } = render(<Harness urls={['a', 'b', 'c']} firstN={3} />);
    act(() => {
      created[0].onload();
      created[1].onload();
      created[2].onload();
    });
    expect(getByTestId('ready').textContent).toBe('true');

    // Change urls — ready stays true.
    rerender(<Harness urls={['x', 'y', 'z']} firstN={3} />);
    expect(getByTestId('ready').textContent).toBe('true');
  });
});
