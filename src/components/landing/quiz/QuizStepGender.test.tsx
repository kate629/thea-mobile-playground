import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuizStepGender, QUIZ_GENDER_OPTIONS } from './QuizStepGender';

describe('QuizStepGender', () => {
  it('renders the title and all gender options as buttons', () => {
    render(<QuizStepGender title="What's their gender?" selected={null} onSelect={() => {}} />);

    expect(screen.getByText("What's their gender?")).toBeInTheDocument();
    QUIZ_GENDER_OPTIONS.forEach((g) => {
      expect(screen.getByRole('button', { name: g.label })).toBeInTheDocument();
    });
  });

  it('marks the selected option with aria-pressed=true and others false', () => {
    render(<QuizStepGender title="What's their gender?" selected="male" onSelect={() => {}} />);

    expect(screen.getByRole('button', { name: 'Male' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Female' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Other' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls onSelect with the gender value when a card is clicked', async () => {
    const onSelect = jest.fn();
    render(<QuizStepGender title="What's their gender?" selected={null} onSelect={onSelect} />);

    await userEvent.click(screen.getByRole('button', { name: 'Female' }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('female');
  });

  // Regression for bug #6 (4/27 sheet): the male/female symbols were horizontally
  // off from their labels because the step rendered HCard's left-emoji + right-label
  // layout. The fix stacks the symbol vertically above the label inside one button
  // so they're centered on the same horizontal axis.
  it('renders each option as a single button containing both the symbol and label (stacked)', () => {
    render(<QuizStepGender title="What's their gender?" selected={null} onSelect={() => {}} />);

    QUIZ_GENDER_OPTIONS.forEach((g) => {
      const btn = screen.getByRole('button', { name: g.label });
      // Symbol lives inside the same button as its label, so they share an
      // alignment context (flex column, align-items: center).
      expect(btn.textContent).toContain(g.emoji);
      expect(btn.textContent).toContain(g.label);
    });
  });
});
