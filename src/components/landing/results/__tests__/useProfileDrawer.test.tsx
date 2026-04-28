import { renderHook, act } from '@testing-library/react';
import { useProfileDrawer } from '../useProfileDrawer';
import type { ProfileDraft } from '../types';

const initial: ProfileDraft = {
  emoji: '🌷',
  name: 'Mom',
  gender: 'female',
  relationship: 'Mom',
  age: 55,
  occasion: 'Just because',
  priceMin: 25,
  priceMax: 200,
  interests: ['Books'],
  vibes: [],
  moreAbout: 'She loves long walks',
};

describe('useProfileDrawer', () => {
  it('starts closed with the initial draft', () => {
    const { result } = renderHook(() => useProfileDrawer({ initial }));
    expect(result.current.open).toBe(false);
    expect(result.current.draft).toEqual(initial);
    expect(result.current.isDirty).toBe(false);
  });

  it('openDrawer + closeDrawer toggles the open flag', () => {
    const { result } = renderHook(() => useProfileDrawer({ initial }));
    act(() => result.current.openDrawer());
    expect(result.current.open).toBe(true);
    act(() => result.current.closeDrawer());
    expect(result.current.open).toBe(false);
  });

  it('setField updates the draft and surfaces a saved-hint flash for hint-eligible fields', () => {
    const { result } = renderHook(() => useProfileDrawer({ initial }));
    act(() => result.current.setField('name', 'Mama'));
    expect(result.current.draft.name).toBe('Mama');
    expect(result.current.savedHints.name).toBe(true);
  });

  describe('saved-hint field filter (bug #51)', () => {
    it.each(['name', 'emoji', 'birthMonth', 'birthDay'] as const)(
      'flashes a saved hint for %s',
      (field) => {
        const { result } = renderHook(() => useProfileDrawer({ initial }));
        const value = field === 'birthMonth' || field === 'birthDay' ? 5 : 'X';
        act(() => result.current.setField(field, value as never));
        expect(result.current.savedHints[field]).toBe(true);
      },
    );

    it.each(['gender', 'age', 'relationship', 'occasion', 'moreAbout', 'priceMax'] as const)(
      'does NOT flash a saved hint for %s (algo-trigger or filter — change is not actually saved until Update picks)',
      (field) => {
        const { result } = renderHook(() => useProfileDrawer({ initial }));
        const value =
          field === 'age' || field === 'priceMax'
            ? 99
            : field === 'gender'
              ? 'male'
              : 'X';
        act(() => result.current.setField(field, value as never));
        expect(result.current.savedHints[field]).toBeFalsy();
      },
    );
  });

  describe('isDirty (bug #51)', () => {
    it('becomes true when an algo-trigger field changes', () => {
      const { result } = renderHook(() => useProfileDrawer({ initial }));
      act(() => result.current.setField('gender', 'male'));
      expect(result.current.isDirty).toBe(true);
    });

    it('stays false when only name changes (recipient-only field)', () => {
      const { result } = renderHook(() => useProfileDrawer({ initial }));
      act(() => result.current.setField('name', 'Mama'));
      expect(result.current.isDirty).toBe(false);
    });

    it('stays false when only price changes (deliberately ignored)', () => {
      const { result } = renderHook(() => useProfileDrawer({ initial }));
      act(() => result.current.setField('priceMax', 500));
      expect(result.current.isDirty).toBe(false);
    });

    it('becomes true when interests change', () => {
      const { result } = renderHook(() => useProfileDrawer({ initial }));
      act(() => result.current.setField('interests', ['Cooking']));
      expect(result.current.isDirty).toBe(true);
    });

    it('becomes true when vibes change (vibes are an algo trigger)', () => {
      const { result } = renderHook(() => useProfileDrawer({ initial }));
      act(() => result.current.setField('vibes', ['Cozy']));
      expect(result.current.isDirty).toBe(true);
    });

    it('resets to false when the initial reference changes (e.g. switching person)', () => {
      const { result, rerender } = renderHook(
        ({ init }) => useProfileDrawer({ initial: init }),
        { initialProps: { init: initial } },
      );
      act(() => result.current.setField('gender', 'male'));
      expect(result.current.isDirty).toBe(true);
      rerender({ init: { ...initial, name: 'Other person' } });
      expect(result.current.isDirty).toBe(false);
    });

    it('returns false on net-zero array changes (toggle on then off — bug #51)', () => {
      const { result } = renderHook(() => useProfileDrawer({ initial }));
      // Initial interests = ['Books']. Add 'Cooking' then remove it: net zero.
      act(() => result.current.setField('interests', ['Books', 'Cooking']));
      expect(result.current.isDirty).toBe(true);
      act(() => result.current.setField('interests', ['Books']));
      expect(result.current.isDirty).toBe(false);
    });

    it('returns false when an interest is reordered to the same set (set-equality)', () => {
      const setOf2: ProfileDraft = { ...initial, interests: ['Books', 'Travel'] };
      const { result } = renderHook(() => useProfileDrawer({ initial: setOf2 }));
      // Reorder to ['Travel', 'Books'] — same set, different order.
      act(() => result.current.setField('interests', ['Travel', 'Books']));
      expect(result.current.isDirty).toBe(false);
    });
  });

  describe('gender auto-derive on relationship change (bug #51 followup)', () => {
    const sister: ProfileDraft = { ...initial, relationship: 'Sister', gender: 'female' };

    it('auto-derives gender to male when relationship changes to Brother', () => {
      const { result } = renderHook(() => useProfileDrawer({ initial: sister }));
      act(() => result.current.setField('relationship', 'Brother'));
      expect(result.current.draft.relationship).toBe('Brother');
      expect(result.current.draft.gender).toBe('male');
    });

    it('auto-derives gender to female when relationship changes to Mom', () => {
      const brother: ProfileDraft = { ...initial, relationship: 'Brother', gender: 'male' };
      const { result } = renderHook(() => useProfileDrawer({ initial: brother }));
      act(() => result.current.setField('relationship', 'Mom'));
      expect(result.current.draft.gender).toBe('female');
    });

    it('overrides an explicit gender pick when relationship has a default', () => {
      // User had Friend (ambiguous), explicitly chose male, then switched to Mom.
      const friendMale: ProfileDraft = { ...initial, relationship: 'Friend', gender: 'male' };
      const { result } = renderHook(() => useProfileDrawer({ initial: friendMale }));
      act(() => result.current.setField('relationship', 'Mom'));
      expect(result.current.draft.gender).toBe('female');
    });

    it.each(['Partner', 'Friend', 'Me!', 'Other'] as const)(
      'leaves gender alone when changing to ambiguous relationship %s',
      (rel) => {
        const { result } = renderHook(() => useProfileDrawer({ initial: sister }));
        act(() => result.current.setField('relationship', rel));
        expect(result.current.draft.relationship).toBe(rel);
        expect(result.current.draft.gender).toBe('female'); // unchanged
      },
    );

    it('does not auto-derive when setting a non-relationship field', () => {
      const { result } = renderHook(() => useProfileDrawer({ initial: sister }));
      act(() => result.current.setField('age', 60));
      expect(result.current.draft.gender).toBe('female'); // unchanged
    });

    it('isDirty becomes true after relationship+gender auto-update from default', () => {
      const { result } = renderHook(() => useProfileDrawer({ initial: sister }));
      act(() => result.current.setField('relationship', 'Brother'));
      // Both relationship AND gender changed (relationship is an algo trigger).
      expect(result.current.isDirty).toBe(true);
    });
  });

  describe('canCommit (bug #51 quiz validation)', () => {
    const fullInitial: ProfileDraft = {
      ...initial,
      interests: ['Books', 'Travel'], // need ≥2
    };

    it('false when nothing changed (not dirty)', () => {
      const { result } = renderHook(() => useProfileDrawer({ initial: fullInitial }));
      expect(result.current.canCommit).toBe(false);
    });

    it('true when an algo-trigger changed and all required fields are still set', () => {
      const { result } = renderHook(() => useProfileDrawer({ initial: fullInitial }));
      act(() => result.current.setField('age', 60));
      expect(result.current.canCommit).toBe(true);
    });

    it('false when interests drop below 2 (validation gate)', () => {
      const { result } = renderHook(() => useProfileDrawer({ initial: fullInitial }));
      act(() => result.current.setField('interests', ['Books']));
      expect(result.current.canCommit).toBe(false);
    });

    it('false when relationship cleared', () => {
      const { result } = renderHook(() => useProfileDrawer({ initial: fullInitial }));
      act(() => result.current.setField('relationship', undefined as never));
      expect(result.current.canCommit).toBe(false);
    });

    it('false when gender cleared', () => {
      const { result } = renderHook(() => useProfileDrawer({ initial: fullInitial }));
      act(() => result.current.setField('gender', undefined as never));
      expect(result.current.canCommit).toBe(false);
    });

    it('false when age cleared', () => {
      const { result } = renderHook(() => useProfileDrawer({ initial: fullInitial }));
      act(() => result.current.setField('age', undefined as never));
      expect(result.current.canCommit).toBe(false);
    });

    it('false when occasion cleared', () => {
      const { result } = renderHook(() => useProfileDrawer({ initial: fullInitial }));
      act(() => result.current.setField('occasion', undefined as never));
      expect(result.current.canCommit).toBe(false);
    });
  });

  describe('commit', () => {
    it('fires onCommit with the latest draft and closes the drawer', () => {
      const onCommit = jest.fn();
      const { result } = renderHook(() => useProfileDrawer({ initial, onCommit }));
      act(() => result.current.openDrawer());
      act(() => result.current.setField('age', 60));
      act(() => result.current.commit());
      expect(onCommit).toHaveBeenCalledWith(expect.objectContaining({ age: 60 }));
      expect(result.current.open).toBe(false);
    });
  });

  describe('onAutoSaveOnClose (bug #51)', () => {
    it('fires when only recipient-only fields changed and drawer closes', () => {
      const onAutoSaveOnClose = jest.fn();
      const { result } = renderHook(() =>
        useProfileDrawer({ initial, onAutoSaveOnClose }),
      );
      act(() => result.current.openDrawer());
      act(() => result.current.setField('name', 'Mama'));
      act(() => result.current.closeDrawer());
      expect(onAutoSaveOnClose).toHaveBeenCalledWith(expect.objectContaining({ name: 'Mama' }));
    });

    it('does NOT fire when an algo-trigger field changed (commit handles it instead)', () => {
      const onAutoSaveOnClose = jest.fn();
      const { result } = renderHook(() =>
        useProfileDrawer({ initial, onAutoSaveOnClose }),
      );
      act(() => result.current.openDrawer());
      act(() => result.current.setField('gender', 'male'));
      act(() => result.current.closeDrawer());
      expect(onAutoSaveOnClose).not.toHaveBeenCalled();
    });

    it('does NOT fire when nothing changed', () => {
      const onAutoSaveOnClose = jest.fn();
      const { result } = renderHook(() =>
        useProfileDrawer({ initial, onAutoSaveOnClose }),
      );
      act(() => result.current.openDrawer());
      act(() => result.current.closeDrawer());
      expect(onAutoSaveOnClose).not.toHaveBeenCalled();
    });

    it('does NOT fire when only price changed (deliberately ignored)', () => {
      const onAutoSaveOnClose = jest.fn();
      const { result } = renderHook(() =>
        useProfileDrawer({ initial, onAutoSaveOnClose }),
      );
      act(() => result.current.openDrawer());
      act(() => result.current.setField('priceMax', 500));
      act(() => result.current.closeDrawer());
      expect(onAutoSaveOnClose).not.toHaveBeenCalled();
    });
  });
});
