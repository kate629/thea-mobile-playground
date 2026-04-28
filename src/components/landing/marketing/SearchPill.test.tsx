import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'styled-components';
import { theme } from '../../../theme';
import { SearchPill } from './SearchPill';

const renderPill = (props: Partial<React.ComponentProps<typeof SearchPill>> = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <SearchPill disableOutsideClick {...props} />
    </ThemeProvider>,
  );

describe('SearchPill', () => {
  it('renders all three segment placeholders by default', () => {
    renderPill();
    expect(screen.getByText('Relationship, age')).toBeInTheDocument();
    expect(screen.getByText('Occasion')).toBeInTheDocument();
    expect(screen.getByText('Interests')).toBeInTheDocument();
  });

  it('disables sparkles button when no selections are made', () => {
    renderPill();
    const sparkles = screen.getByRole('button', { name: /find a gift/i });
    expect(sparkles).toBeDisabled();
  });

  it('opens WHO dropdown on click and shows relationship + age headings', async () => {
    renderPill();
    await userEvent.click(screen.getByRole('button', { name: /who/i }));
    expect(screen.getByRole('dialog', { name: /who are you shopping for/i })).toBeInTheDocument();
    expect(screen.getByText(/who are you shopping for\?/i)).toBeInTheDocument();
    expect(screen.getByText(/^age$/i)).toBeInTheDocument();
  });

  it('selecting Mom + 30s closes WHO and updates segment text', async () => {
    renderPill();
    await userEvent.click(screen.getByRole('button', { name: /who/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Mom' }));
    await userEvent.click(screen.getByRole('button', { name: /30s/i }));
    // Dropdown should have auto-closed.
    expect(screen.queryByRole('dialog', { name: /who are you shopping for/i })).not.toBeInTheDocument();
    expect(screen.getByText(/Mom, 30s/i)).toBeInTheDocument();
  });

  it('clears WHO via the X button', async () => {
    renderPill();
    await userEvent.click(screen.getByRole('button', { name: /who/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Mom' }));
    await userEvent.click(screen.getByRole('button', { name: /30s/i }));
    await userEvent.click(screen.getByRole('button', { name: /clear who/i }));
    expect(screen.getByText('Relationship, age')).toBeInTheDocument();
  });

  it('shows base occasions when WHO is empty', async () => {
    renderPill();
    await userEvent.click(screen.getByRole('button', { name: /what/i }));
    const dropdown = screen.getByRole('dialog', { name: /what's the occasion/i });
    expect(within(dropdown).getByRole('button', { name: /Birthday/i })).toBeInTheDocument();
    expect(within(dropdown).queryByRole('button', { name: /Mother's Day/i })).not.toBeInTheDocument();
    expect(within(dropdown).queryByRole('button', { name: /Father's Day/i })).not.toBeInTheDocument();
  });

  it("dynamically shows Mother's Day when Mom is picked (mirrors useQuizFlow)", async () => {
    renderPill();
    // Pick Mom in WHO
    await userEvent.click(screen.getByRole('button', { name: /who/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Mom' }));
    // (WHO stays open until age is also picked, but we can pick age then move on)
    await userEvent.click(screen.getByRole('button', { name: /30s/i }));

    // Open WHAT
    await userEvent.click(screen.getByRole('button', { name: /what/i }));
    const dropdown = screen.getByRole('dialog', { name: /what's the occasion/i });
    expect(within(dropdown).getByRole('button', { name: /Mother's Day/i })).toBeInTheDocument();
    expect(within(dropdown).queryByRole('button', { name: /Father's Day/i })).not.toBeInTheDocument();
  });

  it("dynamically shows Father's Day when Dad is picked", async () => {
    renderPill();
    await userEvent.click(screen.getByRole('button', { name: /who/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Dad' }));
    await userEvent.click(screen.getByRole('button', { name: /30s/i }));
    await userEvent.click(screen.getByRole('button', { name: /what/i }));
    const dropdown = screen.getByRole('dialog', { name: /what's the occasion/i });
    expect(within(dropdown).getByRole('button', { name: /Father's Day/i })).toBeInTheDocument();
    expect(within(dropdown).queryByRole('button', { name: /Mother's Day/i })).not.toBeInTheDocument();
  });

  it('shows Anniversary when Partner is picked', async () => {
    renderPill();
    await userEvent.click(screen.getByRole('button', { name: /who/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Partner' }));
    await userEvent.click(screen.getByRole('button', { name: /30s/i }));
    await userEvent.click(screen.getByRole('button', { name: /what/i }));
    const dropdown = screen.getByRole('dialog', { name: /what's the occasion/i });
    expect(within(dropdown).getByRole('button', { name: /Anniversary/i })).toBeInTheDocument();
  });

  it('selecting an occasion auto-closes WHAT dropdown', async () => {
    renderPill();
    await userEvent.click(screen.getByRole('button', { name: /what/i }));
    await userEvent.click(screen.getByRole('button', { name: /Birthday/i }));
    expect(screen.queryByRole('dialog', { name: /what's the occasion/i })).not.toBeInTheDocument();
    expect(screen.getByText('Birthday')).toBeInTheDocument();
  });

  it('LIKES dropdown stays open while toggling multiple interests', async () => {
    renderPill();
    await userEvent.click(screen.getByRole('button', { name: /who/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Mom' }));
    await userEvent.click(screen.getByRole('button', { name: /30s/i }));
    await userEvent.click(screen.getByRole('button', { name: /likes/i }));

    const dropdown = screen.getByRole('dialog', { name: /what do they like/i });
    await userEvent.click(within(dropdown).getByRole('button', { name: /Cooking/i }));
    expect(screen.getByRole('dialog', { name: /what do they like/i })).toBeInTheDocument();
    await userEvent.click(within(dropdown).getByRole('button', { name: /Books/i }));
    expect(screen.getByRole('dialog', { name: /what do they like/i })).toBeInTheDocument();
  });

  it('enables sparkles only when WHO + WHAT + 2+ interests are set; fires onSubmit', async () => {
    const onSubmit = jest.fn();
    renderPill({ onSubmit });

    // WHO
    await userEvent.click(screen.getByRole('button', { name: /who/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Mom' }));
    await userEvent.click(screen.getByRole('button', { name: /30s/i }));

    // WHAT
    await userEvent.click(screen.getByRole('button', { name: /what/i }));
    await userEvent.click(screen.getByRole('button', { name: /Mother's Day/i }));

    // Sparkles still disabled (no interests)
    expect(screen.getByRole('button', { name: /find a gift/i })).toBeDisabled();

    // LIKES — pick 2
    await userEvent.click(screen.getByRole('button', { name: /likes/i }));
    const likesDropdown = screen.getByRole('dialog', { name: /what do they like/i });
    await userEvent.click(within(likesDropdown).getByRole('button', { name: /Cooking/i }));
    await userEvent.click(within(likesDropdown).getByRole('button', { name: /Books/i }));

    const sparkles = screen.getByRole('button', { name: /find a gift/i });
    expect(sparkles).not.toBeDisabled();

    await userEvent.click(sparkles);
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        relationship: 'Mom',
        gender: 'female',
        age: 35,
        occasion: "Mother's Day",
        interests: expect.arrayContaining(['Cooking', 'Books']),
        moreAbout: '',
      }),
    );
  });
});
