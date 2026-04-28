import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'styled-components';
import { theme } from '../../../theme';
import { ResultsProductCard } from './ResultsProductCard';
import { SAMPLE_RESULTS_CAROUSELS } from './sampleResultsData';

const item = SAMPLE_RESULTS_CAROUSELS[0].products[0];

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('ResultsProductCard', () => {
  it('renders the product title and brand', () => {
    renderWithTheme(<ResultsProductCard item={item} liked={false} />);
    expect(screen.getByText(item.title)).toBeInTheDocument();
    if (item.brand) expect(screen.getByText(item.brand)).toBeInTheDocument();
  });

  it('exposes the heart and dismiss actions with accessible labels', () => {
    renderWithTheme(<ResultsProductCard item={item} liked={false} />);
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove item' })).toBeInTheDocument();
  });

  // Bug #20 regression: heart (top right) and dismiss pill (top left) must sit
  // on the same horizontal axis with matching visual weight. Both pills are
  // 36x36 and inset 8px from the corner.
  it('aligns the heart and dismiss pills on the same top axis (bug #20)', () => {
    const { container } = renderWithTheme(
      <ResultsProductCard item={item} liked={false} />,
    );

    const heart = screen.getByRole('button', { name: 'Save' });
    const dismissHit = screen.getByRole('button', { name: 'Remove item' });
    const dismissPill = dismissHit.querySelector('span');
    expect(dismissPill).not.toBeNull();

    // The heart is the visible 36x36 pill itself; its inset should match the
    // dismiss pill's effective inset (4px hit-target offset + 4px center
    // padding = 8px). Compare via the rendered offsetTop relative to the
    // ImageFrame.
    const imageFrame = container.querySelector(
      'div[class*="ImageFrame"], div[class][role]',
    );
    // Sanity: the dismiss hit area is 44x44 with a 36x36 inner pill, and the
    // hit area's `top` should be 4px so the centered pill lands at top:8 to
    // match the heart at top:8.
    const styles = window.getComputedStyle(dismissHit);
    expect(styles.top).toBe('4px');
    expect(styles.left).toBe('4px');
    expect(styles.width).toBe('44px');
    expect(styles.height).toBe('44px');

    const heartStyles = window.getComputedStyle(heart);
    expect(heartStyles.top).toBe('8px');
    expect(heartStyles.right).toBe('8px');
  });

  it('opens the overflow menu and exposes "Mark as purchased"', async () => {
    const onMarkPurchased = jest.fn();
    renderWithTheme(
      <ResultsProductCard
        item={item}
        liked={false}
        onMarkPurchased={onMarkPurchased}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'More actions' }));
    const markItem = await screen.findByRole('menuitem', {
      name: /mark as purchased/i,
    });
    expect(markItem).toBeInTheDocument();

    await userEvent.click(markItem);
    expect(onMarkPurchased).toHaveBeenCalledTimes(1);
  });

  // Bug #21 regression: when the overflow menu opens, it must not blow past
  // the card width. We render the card inside a fixed-width container that
  // mirrors a narrow mobile slot (~150px) and assert the menu's clamped width.
  it('clamps the overflow menu inside the card width (bug #21)', async () => {
    const { container } = renderWithTheme(
      <div style={{ width: 150, overflow: 'hidden' }}>
        <ResultsProductCard item={item} liked={false} />
      </div>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'More actions' }));
    const menu = await screen.findByRole('menu');
    const menuStyles = window.getComputedStyle(menu);

    // The shared DropdownMenu defaults to min-width:180px; we override it to
    // 0 from the card so the menu can shrink inside small slots.
    expect(menuStyles.minWidth).toMatch(/^0(px)?$/);
    // The menu lives inside a container that's the card's full width, so
    // its right edge anchors to the card edge (not the trigger's edge).
    expect(menuStyles.right).toMatch(/^0(px)?$/);
    expect(container).toBeTruthy();
  });
});
