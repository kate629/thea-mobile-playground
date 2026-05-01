/**
 * Regression tests for the saved-grid card click bug.
 *
 * Background: the saved-grid card had `cursor: pointer` styling but the
 * parent (`RecommendationResultsPage`) was not passing `onItemClick`. So
 * tapping a saved card on the live site silently no-op'd — users could not
 * click through to merchants from their saved-items view, blocking
 * affiliate revenue. These tests prevent that wiring from regressing.
 */
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '../../../../theme';
import { ResultsSavedGrid } from '../ResultsSavedGrid';
import { SAMPLE_SAVED_ITEMS } from '../sampleResultsData';

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('ResultsSavedGrid card click', () => {
  it('invokes onItemClick when a card body is clicked', () => {
    const onItemClick = jest.fn();
    const items = SAMPLE_SAVED_ITEMS.slice(0, 2);
    renderWithTheme(
      <ResultsSavedGrid items={items} onItemClick={onItemClick} />
    );

    // The card is the closest clickable ancestor of the product image.
    const img = screen.getByAltText(items[0].title);
    const card = img.closest('div[class]')?.parentElement;
    expect(card).not.toBeNull();
    fireEvent.click(card!);

    expect(onItemClick).toHaveBeenCalledTimes(1);
    expect(onItemClick).toHaveBeenCalledWith(items[0]);
  });

  it('does NOT invoke onItemClick when the heart (unsave) button is clicked', () => {
    const onItemClick = jest.fn();
    const onUnsave = jest.fn();
    const items = SAMPLE_SAVED_ITEMS.slice(0, 1);
    renderWithTheme(
      <ResultsSavedGrid
        items={items}
        onItemClick={onItemClick}
        onUnsave={onUnsave}
      />
    );

    // HeartButton has e.stopPropagation() — its click should NOT bubble to the card.
    const heartButton = screen.getByRole('button', { name: /unsave|liked|remove/i });
    fireEvent.click(heartButton);

    expect(onUnsave).toHaveBeenCalledTimes(1);
    expect(onItemClick).not.toHaveBeenCalled();
  });

  it('renders empty state when items list is empty', () => {
    const onItemClick = jest.fn();
    renderWithTheme(
      <ResultsSavedGrid items={[]} onItemClick={onItemClick} />
    );
    expect(screen.getByText(/Tap the heart on any gift to save it here/i)).toBeInTheDocument();
    expect(onItemClick).not.toHaveBeenCalled();
  });
});
