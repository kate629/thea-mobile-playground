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
});
