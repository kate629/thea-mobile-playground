import { act, renderHook } from '@testing-library/react';
import { useSearchPillState } from '../useSearchPillState';

describe('useSearchPillState', () => {
  it('starts in empty state with no open segment', () => {
    const { result } = renderHook(() => useSearchPillState());
    expect(result.current.relationship).toBe('');
    expect(result.current.age).toBe(0);
    expect(result.current.occasion).toBe('');
    expect(result.current.interests).toEqual([]);
    expect(result.current.openSegment).toBeNull();
    expect(result.current.canSubmit).toBe(false);
  });

  it('returns BASE_OCCASION_OPTIONS when no relationship is set', () => {
    const { result } = renderHook(() => useSearchPillState());
    const values = result.current.occasionOptions.map((o) => o.value);
    expect(values).toEqual(
      expect.arrayContaining([
        'Birthday',
        'Just Because',
        'Thank You',
        'Housewarming',
        'New Baby',
        'Wedding',
        'Graduation',
        'Other',
      ]),
    );
    expect(values).not.toContain("Mother's Day");
    expect(values).not.toContain("Father's Day");
    expect(values).not.toContain('Anniversary');
  });

  it("inserts Mother's Day when relationship is Mom (gendered occasion logic)", () => {
    const { result } = renderHook(() => useSearchPillState());
    act(() => result.current.setRelationship('Mom'));
    const values = result.current.occasionOptions.map((o) => o.value);
    expect(values).toContain("Mother's Day");
    expect(values).not.toContain("Father's Day");
  });

  it("inserts Father's Day when relationship is Dad", () => {
    const { result } = renderHook(() => useSearchPillState());
    act(() => result.current.setRelationship('Dad'));
    const values = result.current.occasionOptions.map((o) => o.value);
    expect(values).toContain("Father's Day");
    expect(values).not.toContain("Mother's Day");
  });

  it('adds Anniversary only when relationship is Partner', () => {
    const { result } = renderHook(() => useSearchPillState());
    act(() => result.current.setRelationship('Partner'));
    const values = result.current.occasionOptions.map((o) => o.value);
    expect(values).toContain('Anniversary');
  });

  it('clears occasion if it is no longer valid after relationship swap', () => {
    const { result } = renderHook(() => useSearchPillState());
    act(() => result.current.setRelationship('Mom'));
    act(() => result.current.setOccasion("Mother's Day"));
    expect(result.current.occasion).toBe("Mother's Day");
    // Swap to Dad — Mother's Day disappears, occasion should reset.
    act(() => result.current.setRelationship('Dad'));
    expect(result.current.occasion).toBe('');
  });

  it('keeps occasion when swap still leaves it valid (e.g. Birthday)', () => {
    const { result } = renderHook(() => useSearchPillState());
    act(() => result.current.setRelationship('Mom'));
    act(() => result.current.setOccasion('Birthday'));
    act(() => result.current.setRelationship('Dad'));
    expect(result.current.occasion).toBe('Birthday');
  });

  it('age-bucketed interest pills come from getInterestPills', () => {
    const { result } = renderHook(() => useSearchPillState());
    act(() => result.current.setRelationship('Mom'));
    act(() => result.current.setAge(35));
    const labels = result.current.interestPills.map((p) => p.label);
    expect(labels).toContain('Cooking');
    expect(labels).toContain('Books');
    expect(labels).toContain('Plants');
    // Mom gets Beauty, not Grooming.
    expect(labels).toContain('Beauty');
    expect(labels).not.toContain('Grooming');
  });

  it('swaps Beauty for Grooming when gender is male', () => {
    const { result } = renderHook(() => useSearchPillState());
    act(() => result.current.setRelationship('Dad'));
    act(() => result.current.setAge(65));
    const labels = result.current.interestPills.map((p) => p.label);
    expect(labels).toContain('Grooming');
    expect(labels).not.toContain('Beauty');
  });

  it('toggles interests on/off', () => {
    const { result } = renderHook(() => useSearchPillState());
    act(() => result.current.toggleInterest('Books'));
    expect(result.current.interests).toEqual(['Books']);
    act(() => result.current.toggleInterest('Cooking'));
    expect(result.current.interests).toEqual(['Books', 'Cooking']);
    act(() => result.current.toggleInterest('Books'));
    expect(result.current.interests).toEqual(['Cooking']);
  });

  it('canSubmit requires relationship + age + 2+ interests', () => {
    const { result } = renderHook(() => useSearchPillState());
    expect(result.current.canSubmit).toBe(false);
    act(() => result.current.setRelationship('Mom'));
    expect(result.current.canSubmit).toBe(false);
    act(() => result.current.setAge(35));
    expect(result.current.canSubmit).toBe(false);
    act(() => result.current.toggleInterest('Books'));
    expect(result.current.canSubmit).toBe(false);
    act(() => result.current.toggleInterest('Cooking'));
    expect(result.current.canSubmit).toBe(true);
  });

  it('whoDisplay formats as "Relationship, Age" when both set', () => {
    const { result } = renderHook(() => useSearchPillState());
    act(() => result.current.setRelationship('Mom'));
    act(() => result.current.setAge(35));
    expect(result.current.whoDisplay).toBe('Mom, 30s');
  });

  it('likesDisplay shows "+N" overflow for >2 interests', () => {
    const { result } = renderHook(() => useSearchPillState());
    act(() => result.current.toggleInterest('Books'));
    act(() => result.current.toggleInterest('Cooking'));
    act(() => result.current.toggleInterest('Plants'));
    expect(result.current.likesDisplay).toBe('Books, Cooking +1');
  });

  it('toQuizAnswers returns shape compatible with useSubmitGiftFlow', () => {
    const { result } = renderHook(() => useSearchPillState());
    act(() => result.current.setRelationship('Mom'));
    act(() => result.current.setAge(35));
    act(() => result.current.setOccasion("Mother's Day"));
    act(() => result.current.toggleInterest('Books'));
    act(() => result.current.toggleInterest('Cooking'));
    act(() => result.current.setFreeform("She's into mahjong"));

    expect(result.current.toQuizAnswers()).toEqual({
      relationship: 'Mom',
      gender: 'female',
      age: 35,
      occasion: "Mother's Day",
      interests: ['Books', 'Cooking'],
      moreAbout: "She's into mahjong",
    });
  });

  it('toggleDropdown opens then closes the same segment', () => {
    const { result } = renderHook(() => useSearchPillState());
    act(() => result.current.toggleDropdown('who'));
    expect(result.current.openSegment).toBe('who');
    act(() => result.current.toggleDropdown('who'));
    expect(result.current.openSegment).toBeNull();
  });

  it('toggleDropdown switches between segments', () => {
    const { result } = renderHook(() => useSearchPillState());
    act(() => result.current.toggleDropdown('who'));
    act(() => result.current.toggleDropdown('what'));
    expect(result.current.openSegment).toBe('what');
  });

  describe('gender selector (sheet bug #54)', () => {
    it('seeds gender from the selected relationship (Mom → female)', () => {
      const { result } = renderHook(() => useSearchPillState());
      act(() => result.current.setRelationship('Mom'));
      expect(result.current.gender).toBe('female');
    });

    it('seeds gender from the selected relationship (Dad → male)', () => {
      const { result } = renderHook(() => useSearchPillState());
      act(() => result.current.setRelationship('Dad'));
      expect(result.current.gender).toBe('male');
    });

    it('seeds gender to null (no chip pre-selected) for non-presumed relationships', () => {
      const { result } = renderHook(() => useSearchPillState());
      act(() => result.current.setRelationship('Friend'));
      expect(result.current.gender).toBeNull();
    });

    it('canSubmit blocks until gender is picked for non-presumed relationships', () => {
      const { result } = renderHook(() => useSearchPillState());
      act(() => result.current.setRelationship('Friend'));
      act(() => result.current.setAge(35));
      act(() => result.current.setOccasion('Birthday'));
      act(() => result.current.toggleInterest('Cooking'));
      act(() => result.current.toggleInterest('Books'));
      // Everything else satisfied; gender still null → blocks.
      expect(result.current.canSubmit).toBe(false);
      act(() => result.current.setGender('female'));
      expect(result.current.canSubmit).toBe(true);
    });

    it('canSubmit auto-passes the gender check for presumed relationships', () => {
      const { result } = renderHook(() => useSearchPillState());
      act(() => result.current.setRelationship('Mom'));
      act(() => result.current.setAge(35));
      act(() => result.current.setOccasion('Birthday'));
      act(() => result.current.toggleInterest('Cooking'));
      act(() => result.current.toggleInterest('Books'));
      // Mom presumes 'female' — gender is auto-set, no extra step required.
      expect(result.current.canSubmit).toBe(true);
    });

    it("toQuizAnswers coerces null gender to 'other' as a defensive safety", () => {
      const { result } = renderHook(() => useSearchPillState());
      act(() => result.current.setRelationship('Friend'));
      // No setGender call — gender is null. Test the coercion path even
      // though canSubmit would normally block this from being called.
      expect(result.current.toQuizAnswers().gender).toBe('other');
    });

    it('hides the gender selector for presumed-gender relationships', () => {
      const { result } = renderHook(() => useSearchPillState());
      act(() => result.current.setRelationship('Mom'));
      expect(result.current.showGenderSelector).toBe(false);
      act(() => result.current.setRelationship('Sister'));
      expect(result.current.showGenderSelector).toBe(false);
      act(() => result.current.setRelationship('Grandson'));
      expect(result.current.showGenderSelector).toBe(false);
    });

    it('shows the gender selector for non-presumed relationships', () => {
      const { result } = renderHook(() => useSearchPillState());
      for (const rel of ['Partner', 'Friend', 'Me!', 'Other']) {
        act(() => result.current.setRelationship(rel));
        expect(result.current.showGenderSelector).toBe(true);
      }
    });

    it('hides the gender selector when no relationship is picked yet', () => {
      const { result } = renderHook(() => useSearchPillState());
      expect(result.current.showGenderSelector).toBe(false);
    });

    it('setGender overrides the seeded value (Friend + setGender(female))', () => {
      const { result } = renderHook(() => useSearchPillState());
      act(() => result.current.setRelationship('Friend'));
      act(() => result.current.setGender('female'));
      expect(result.current.gender).toBe('female');
    });

    it('user-picked gender flows through to occasionOptions (Friend + Female unlocks Mother\'s Day)', () => {
      const { result } = renderHook(() => useSearchPillState());
      act(() => result.current.setRelationship('Friend'));
      expect(result.current.occasionOptions.map((o) => o.value)).not.toContain("Mother's Day");
      act(() => result.current.setGender('female'));
      expect(result.current.occasionOptions.map((o) => o.value)).toContain("Mother's Day");
    });

    it('user-picked gender flows through to toQuizAnswers', () => {
      const { result } = renderHook(() => useSearchPillState());
      act(() => result.current.setRelationship('Friend'));
      act(() => result.current.setGender('male'));
      act(() => result.current.setAge(35));
      act(() => result.current.setOccasion('Birthday'));
      act(() => result.current.toggleInterest('Books'));
      act(() => result.current.toggleInterest('Cooking'));
      expect(result.current.toQuizAnswers().gender).toBe('male');
    });

    it('changing relationship to a presumed one resets a user-picked gender', () => {
      const { result } = renderHook(() => useSearchPillState());
      act(() => result.current.setRelationship('Friend'));
      act(() => result.current.setGender('male'));
      expect(result.current.gender).toBe('male');
      act(() => result.current.setRelationship('Mom'));
      expect(result.current.gender).toBe('female'); // re-seeded from Mom
    });

    it('changing relationship across non-presumed types re-seeds to null (no carry-over)', () => {
      const { result } = renderHook(() => useSearchPillState());
      act(() => result.current.setRelationship('Friend'));
      act(() => result.current.setGender('female'));
      act(() => result.current.setRelationship('Partner'));
      expect(result.current.gender).toBeNull(); // user must re-pick for Partner
    });

    it("clears 'Mother's Day' if user flips Friend gender from female back to other", () => {
      const { result } = renderHook(() => useSearchPillState());
      act(() => result.current.setRelationship('Friend'));
      act(() => result.current.setGender('female'));
      act(() => result.current.setOccasion("Mother's Day"));
      expect(result.current.occasion).toBe("Mother's Day");
      act(() => result.current.setGender('other'));
      expect(result.current.occasion).toBe('');
    });

    it('clearWho resets gender to null', () => {
      const { result } = renderHook(() => useSearchPillState());
      act(() => result.current.setRelationship('Mom'));
      expect(result.current.gender).toBe('female');
      act(() => result.current.clearWho());
      expect(result.current.gender).toBeNull();
    });
  });

  describe('auto-advance between segments', () => {
    it('advances WHO → WHAT when the LAST missing field completes (age last, presumed)', () => {
      const { result } = renderHook(() => useSearchPillState());
      act(() => result.current.openDropdown('who'));
      act(() => result.current.setRelationship('Mom'));
      // Mom + 0 age — WHO still incomplete.
      expect(result.current.openSegment).toBe('who');
      act(() => result.current.setAge(35));
      expect(result.current.openSegment).toBe('what');
    });

    it('advances WHO → WHAT when the LAST missing field completes (relationship last)', () => {
      const { result } = renderHook(() => useSearchPillState());
      act(() => result.current.openDropdown('who'));
      act(() => result.current.setAge(35));
      // Age picked first, no rel — WHO still incomplete.
      expect(result.current.openSegment).toBe('who');
      act(() => result.current.setRelationship('Mom'));
      expect(result.current.openSegment).toBe('what');
    });

    it('advances WHO → WHAT when gender pick completes a non-presumed relationship', () => {
      const { result } = renderHook(() => useSearchPillState());
      act(() => result.current.openDropdown('who'));
      act(() => result.current.setRelationship('Friend'));
      act(() => result.current.setAge(35));
      // Friend + 30s — gender still null, WHO incomplete, no advance yet.
      expect(result.current.openSegment).toBe('who');
      act(() => result.current.setGender('female'));
      expect(result.current.openSegment).toBe('what');
    });

    it('does NOT advance when re-editing a complete WHO (no false transition)', () => {
      const { result } = renderHook(() => useSearchPillState());
      act(() => result.current.openDropdown('who'));
      act(() => result.current.setRelationship('Mom'));
      act(() => result.current.setAge(35));
      // WHO advanced to WHAT. User comes back to WHO and re-picks Sister
      // (still presumed-female, still complete). No fresh advance — they
      // didn't transition incomplete → complete.
      act(() => result.current.openDropdown('who'));
      act(() => result.current.setRelationship('Sister'));
      expect(result.current.openSegment).toBe('who');
    });

    it('does NOT auto-advance when picking rel+age results in incomplete WHO (Friend stays gender-required)', () => {
      const { result } = renderHook(() => useSearchPillState());
      act(() => result.current.openDropdown('who'));
      act(() => result.current.setRelationship('Friend'));
      act(() => result.current.setAge(35));
      // Friend requires gender — WHO incomplete, dropdown stays on WHO.
      expect(result.current.openSegment).toBe('who');
    });

    it('advances WHAT → LIKES on first occasion pick', () => {
      const { result } = renderHook(() => useSearchPillState());
      act(() => result.current.setRelationship('Mom'));
      act(() => result.current.setAge(35));
      // openSegment is 'what' from WHO auto-advance.
      expect(result.current.openSegment).toBe('what');
      act(() => result.current.setOccasion('Birthday'));
      expect(result.current.openSegment).toBe('likes');
    });

    it('re-picking an occasion (no transition) closes WHAT instead of advancing', () => {
      const { result } = renderHook(() => useSearchPillState());
      act(() => result.current.setRelationship('Mom'));
      act(() => result.current.setAge(35));
      act(() => result.current.setOccasion('Birthday'));
      // Now LIKES is open. User goes back to WHAT and re-picks.
      act(() => result.current.openDropdown('what'));
      act(() => result.current.setOccasion("Mother's Day"));
      // Re-pick — WHAT was already complete, so this just closes (existing
      // single-select behavior; no fresh advance to LIKES).
      expect(result.current.openSegment).toBeNull();
    });
  });

  describe('freeform placeholder (mirrors quiz copy)', () => {
    it('uses the neutral fallback when no relationship is set', () => {
      const { result } = renderHook(() => useSearchPillState());
      expect(result.current.freeformPlaceholder).toBe(
        "E.g., They've been getting into pickleball",
      );
    });

    // Per-relationship copy lifted from the quiz's `getQuizPlaceholder`. If
    // the quiz copy is updated, both surfaces shift together — these tests
    // pin the SearchPill ↔ quiz alignment.
    it.each([
      ['Mom', "E.g., She's been getting into mahjong"],
      ['Dad', 'E.g., He just retired and needs new hobbies'],
      ['Sister', "E.g., She’s learning to make sourdough"],
      ['Brother', "E.g., He’s a huge SF Giants fan"],
      ['Grandma', "E.g., She's obsessed with her garden this year"],
      ['Grandpa', 'E.g., He does the crossword puzzle every morning'],
      ['Daughter', 'E.g., She just moved to NYC and loves matcha'],
      ['Granddaughter', 'E.g., She just moved to NYC and loves matcha'],
      ['Son', 'E.g., He just moved to NYC and loves coffee'],
      ['Grandson', 'E.g., He just moved to NYC and loves coffee'],
    ])('uses the quiz copy for presumed-gender relationship %s', (rel, expected) => {
      const { result } = renderHook(() => useSearchPillState());
      act(() => result.current.setRelationship(rel));
      expect(result.current.freeformPlaceholder).toBe(expected);
    });

    it('uses the quiz copy for Me! once a gender is picked', () => {
      const { result } = renderHook(() => useSearchPillState());
      act(() => result.current.setRelationship('Me!'));
      // Me! is non-presumed but its quiz copy is gender-independent.
      // We let it through once gender is non-null.
      act(() => result.current.setGender('female'));
      expect(result.current.freeformPlaceholder).toBe(
        "E.g., I've been trying to get more into mindfulness",
      );
    });

    it('uses the quiz copy for Other once a gender is picked', () => {
      const { result } = renderHook(() => useSearchPillState());
      act(() => result.current.setRelationship('Other'));
      act(() => result.current.setGender('female'));
      expect(result.current.freeformPlaceholder).toBe('E.g., My boss loves pickleball');
    });

    it('uses the quiz copy for Friend once gender is set (Friend + Female → sourdough)', () => {
      const { result } = renderHook(() => useSearchPillState());
      act(() => result.current.setRelationship('Friend'));
      act(() => result.current.setGender('female'));
      expect(result.current.freeformPlaceholder).toBe(
        "E.g., She’s learning to make sourdough",
      );
    });

    it('uses the quiz copy for Friend once gender is set (Friend + Male → Giants fan)', () => {
      const { result } = renderHook(() => useSearchPillState());
      act(() => result.current.setRelationship('Friend'));
      act(() => result.current.setGender('male'));
      expect(result.current.freeformPlaceholder).toBe("E.g., He’s a huge SF Giants fan");
    });

    it('uses the quiz copy for Partner once gender is set (Partner + Female → trip to Italy)', () => {
      const { result } = renderHook(() => useSearchPillState());
      act(() => result.current.setRelationship('Partner'));
      act(() => result.current.setGender('female'));
      expect(result.current.freeformPlaceholder).toBe(
        "E.g., We're planning a trip to Italy",
      );
    });

    it('uses the quiz copy for Partner once gender is set (Partner + Male → grilling)', () => {
      const { result } = renderHook(() => useSearchPillState());
      act(() => result.current.setRelationship('Partner'));
      act(() => result.current.setGender('male'));
      expect(result.current.freeformPlaceholder).toBe(
        "E.g., He's really into grilling lately",
      );
    });

    it('keeps the neutral fallback for Friend before gender is picked', () => {
      const { result } = renderHook(() => useSearchPillState());
      act(() => result.current.setRelationship('Friend'));
      expect(result.current.freeformPlaceholder).toBe(
        "E.g., They've been getting into pickleball",
      );
    });

    it('keeps the neutral fallback for Partner before gender is picked', () => {
      const { result } = renderHook(() => useSearchPillState());
      act(() => result.current.setRelationship('Partner'));
      expect(result.current.freeformPlaceholder).toBe(
        "E.g., They've been getting into pickleball",
      );
    });
  });
});
