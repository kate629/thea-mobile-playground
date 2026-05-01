/**
 * Regression tests for the purchased-grid card click bug.
 *
 * Same root cause as ResultsSavedGrid: the parent did not pass
 * `onItemClick`, so card-body taps silently no-op'd. These tests guard the
 * fix at `RecommendationResultsPage.tsx:820`.
 */
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '../../../../theme';
import { ResultsPurchasedGrid } from '../ResultsPurchasedGrid';
import { SAMPLE_PURCHASED_ITEMS } from '../sampleResultsData';

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('ResultsPurchasedGrid card click', () => {
  it('invokes onItemClick when a purchased card body is clicked', () => {
    const onItemClick = jest.fn();
    const items = SAMPLE_PURCHASED_ITEMS.slice(0, 2);
    renderWithTheme(
      <ResultsPurchasedGrid items={items} onItemClick={onItemClick} />
    );

    const img = screen.getByAltText(items[0].title);
    const card = img.closest('div[class]')?.parentElement;
    expect(card).not.toBeNull();
    fireEvent.click(card!);

    expect(onItemClick).toHaveBeenCalledTimes(1);
    expect(onItemClick).toHaveBeenCalledWith(items[0]);
  });

  it('does NOT invoke onItemClick when the undo (move-back-to-saved) button is clicked', () => {
    const onItemClick = jest.fn();
    const onUndo = jest.fn();
    const items = SAMPLE_PURCHASED_ITEMS.slice(0, 1);
    renderWithTheme(
      <ResultsPurchasedGrid
        items={items}
        onItemClick={onItemClick}
        onUndo={onUndo}
      />
    );

    // UndoButton has e.stopPropagation() — its click should NOT bubble to the card.
    const undoButton = screen.getByRole('button', { name: /move back to saved/i });
    fireEvent.click(undoButton);

    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(onItemClick).not.toHaveBeenCalled();
  });

  it('renders empty state with personalized copy when items list is empty', () => {
    const onItemClick = jest.fn();
    renderWithTheme(
      <ResultsPurchasedGrid items={[]} personName="Mom" onItemClick={onItemClick} />
    );
    expect(screen.getByText(/Bought a gift for Mom/i)).toBeInTheDocument();
    expect(onItemClick).not.toHaveBeenCalled();
  });
});
