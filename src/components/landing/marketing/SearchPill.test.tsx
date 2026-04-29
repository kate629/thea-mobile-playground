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
    // Pick Mom + 30s in WHO. Auto-advance opens WHAT once both are set, so
    // there's no separate click on the WHAT segment.
    await userEvent.click(screen.getByRole('button', { name: /who/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Mom' }));
    await userEvent.click(screen.getByRole('button', { name: /30s/i }));

    const dropdown = screen.getByRole('dialog', { name: /what's the occasion/i });
    expect(within(dropdown).getByRole('button', { name: /Mother's Day/i })).toBeInTheDocument();
    expect(within(dropdown).queryByRole('button', { name: /Father's Day/i })).not.toBeInTheDocument();
  });

  it("dynamically shows Father's Day when Dad is picked", async () => {
    renderPill();
    await userEvent.click(screen.getByRole('button', { name: /who/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Dad' }));
    await userEvent.click(screen.getByRole('button', { name: /30s/i }));
    // WHO → WHAT auto-advance.
    const dropdown = screen.getByRole('dialog', { name: /what's the occasion/i });
    expect(within(dropdown).getByRole('button', { name: /Father's Day/i })).toBeInTheDocument();
    expect(within(dropdown).queryByRole('button', { name: /Mother's Day/i })).not.toBeInTheDocument();
  });

  it('shows Anniversary when Partner is picked', async () => {
    renderPill();
    // Partner is non-presumed — picking rel + age leaves gender required, so
    // auto-advance does NOT fire. User must pick gender first; WHO advances
    // to WHAT once gender lands.
    await userEvent.click(screen.getByRole('button', { name: /who/i }));
    const whoDropdown = screen.getByRole('dialog', { name: /who are you shopping for/i });
    await userEvent.click(within(whoDropdown).getByRole('button', { name: 'Partner' }));
    await userEvent.click(within(whoDropdown).getByRole('button', { name: /30s/i }));
    const genderGroup = within(whoDropdown).getByRole('group', { name: 'Gender' });
    await userEvent.click(within(genderGroup).getByRole('button', { name: 'Female' }));
    // WHO → WHAT auto-advance.
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

    // WHO — auto-advance opens WHAT once Mom + 30s are set.
    await userEvent.click(screen.getByRole('button', { name: /who/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Mom' }));
    await userEvent.click(screen.getByRole('button', { name: /30s/i }));

    // WHAT — auto-advance opens LIKES once an occasion is picked.
    await userEvent.click(screen.getByRole('button', { name: /Mother's Day/i }));

    // Sparkles still disabled (no interests)
    expect(screen.getByRole('button', { name: /find a gift/i })).toBeDisabled();

    // LIKES — auto-opened. Pick 2 interests.
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

  describe('gender selector (sheet bug #54)', () => {
    it('does NOT render the Gender section for presumed-gender relationships (Mom)', async () => {
      renderPill();
      await userEvent.click(screen.getByRole('button', { name: /who/i }));
      const whoDropdown = screen.getByRole('dialog', { name: /who are you shopping for/i });
      await userEvent.click(within(whoDropdown).getByRole('button', { name: /Mom/i }));
      expect(within(whoDropdown).queryByText('Gender')).not.toBeInTheDocument();
    });

    it('renders the Gender section with Female / Male / Other for non-presumed (Friend)', async () => {
      renderPill();
      await userEvent.click(screen.getByRole('button', { name: /who/i }));
      const whoDropdown = screen.getByRole('dialog', { name: /who are you shopping for/i });
      await userEvent.click(within(whoDropdown).getByRole('button', { name: /^Friend$/ }));
      // Scope to the Gender group — the relationship list also contains an
      // "Other" chip, so a global query would match both.
      const genderGroup = within(whoDropdown).getByRole('group', { name: 'Gender' });
      expect(within(genderGroup).getByRole('button', { name: 'Female' })).toBeInTheDocument();
      expect(within(genderGroup).getByRole('button', { name: 'Male' })).toBeInTheDocument();
      expect(within(genderGroup).getByRole('button', { name: 'Other' })).toBeInTheDocument();
    });

    it('user-picked gender flows through to onSubmit (Friend + Female + Birthday)', async () => {
      const onSubmit = jest.fn();
      renderPill({ onSubmit });

      await userEvent.click(screen.getByRole('button', { name: /who/i }));
      const whoDropdown = screen.getByRole('dialog', { name: /who are you shopping for/i });
      await userEvent.click(within(whoDropdown).getByRole('button', { name: /^Friend$/ }));
      const genderGroup = within(whoDropdown).getByRole('group', { name: 'Gender' });
      await userEvent.click(within(genderGroup).getByRole('button', { name: 'Female' }));
      await userEvent.click(within(whoDropdown).getByRole('button', { name: /30s/i }));
      // WHO → WHAT auto-advance fires once rel + age + gender are all set.

      const whatDropdown = screen.getByRole('dialog', { name: /what.*occasion/i });
      await userEvent.click(within(whatDropdown).getByRole('button', { name: /^Birthday$/i }));
      // WHAT → LIKES auto-advance.

      const likesDropdown = screen.getByRole('dialog', { name: /what do they like/i });
      await userEvent.click(within(likesDropdown).getByRole('button', { name: /Cooking/i }));
      await userEvent.click(within(likesDropdown).getByRole('button', { name: /Books/i }));

      await userEvent.click(screen.getByRole('button', { name: /find a gift/i }));
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          relationship: 'Friend',
          gender: 'female',
          age: 35,
        }),
      );
    });
  });

  describe('compact prop (sheet bug #66)', () => {
    it('marks the wrap with data-search-pill-compact when compact is true', () => {
      renderPill({ compact: true });
      // CSS that hides segment-value text on mobile keys off this attribute
      // via parent-selector. JSX sets it; CSS does the rest.
      const wrap = document.querySelector('[data-search-pill-compact="true"]');
      expect(wrap).toBeInTheDocument();
    });

    it('does NOT mark the wrap when compact is false (default)', () => {
      renderPill();
      const wrap = document.querySelector('[data-search-pill-compact="true"]');
      expect(wrap).not.toBeInTheDocument();
    });

    it('still renders the WHO / WHAT / LIKES segment buttons in compact mode', () => {
      renderPill({ compact: true });
      // Labels (and the buttons themselves) stay mounted; only the VALUE
      // text is hidden via CSS on mobile. JSX-side both render.
      expect(screen.getByRole('button', { name: /who/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /what/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /likes/i })).toBeInTheDocument();
    });
  });
});
