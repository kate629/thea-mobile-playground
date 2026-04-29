import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MothersDayQuizBanner } from './MothersDayQuizBanner';

describe('MothersDayQuizBanner', () => {
  it('renders the heading, subhead, and CTA copy', () => {
    render(<MothersDayQuizBanner />);
    expect(screen.getByText(/one of a kind/i)).toBeInTheDocument();
    expect(screen.getByText(/find a gift just for her/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /take the gift quiz/i })).toBeInTheDocument();
  });

  it('fires onCtaClick when the CTA is clicked', () => {
    const onCtaClick = jest.fn();
    render(<MothersDayQuizBanner onCtaClick={onCtaClick} />);
    fireEvent.click(screen.getByRole('button', { name: /take the gift quiz/i }));
    expect(onCtaClick).toHaveBeenCalledTimes(1);
  });

  it('does not throw when CTA is clicked with no onCtaClick prop', () => {
    render(<MothersDayQuizBanner />);
    expect(() =>
      fireEvent.click(screen.getByRole('button', { name: /take the gift quiz/i })),
    ).not.toThrow();
  });
});
