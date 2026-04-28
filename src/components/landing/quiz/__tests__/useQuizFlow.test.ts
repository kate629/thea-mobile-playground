import { renderHook, act } from '@testing-library/react';
import { useQuizFlow } from '../useQuizFlow';

/**
 * Regression test for the auto-advance stale-closure bug.
 *
 * Before the ref-based fix: clicking a relationship and immediately invoking
 * the captured `goFromRelationship` callback would see `relationship === ''`
 * (the previous render's value) and bail. The container's setTimeout-driven
 * auto-advance always passes the captured callback, so the first click on
 * "Who's on your list?" failed to advance the form.
 */

describe('useQuizFlow', () => {
  it('advances from relationship to age immediately after setRelationship (gendered relationship)', () => {
    const { result } = renderHook(() => useQuizFlow());
    expect(result.current.step).toBe('relationship');

    act(() => {
      result.current.setRelationship('Mom');
      // Same render — the auto-advance container calls goFromRelationship
      // with the closure captured at click time. With the ref-based guard,
      // the just-set value is visible.
      result.current.goFromRelationship();
    });

    expect(result.current.step).toBe('age');
    expect(result.current.relationship).toBe('Mom');
  });

  it('advances from relationship to gender for NEEDS_GENDER relationships (Partner)', () => {
    const { result } = renderHook(() => useQuizFlow());

    act(() => {
      result.current.setRelationship('Partner');
      result.current.goFromRelationship();
    });

    expect(result.current.step).toBe('gender');
  });

  it('advances from gender → age in the same tick (no stale closure)', () => {
    const { result } = renderHook(() => useQuizFlow());

    act(() => {
      result.current.setRelationship('Friend');
      result.current.goFromRelationship();
    });
    expect(result.current.step).toBe('gender');

    act(() => {
      result.current.setGender('male');
      result.current.goFromGender();
    });
    expect(result.current.step).toBe('age');
  });

  it('advances from age → occasion in the same tick', () => {
    const { result } = renderHook(() => useQuizFlow());

    act(() => {
      result.current.setRelationship('Mom');
      result.current.goFromRelationship();
    });

    act(() => {
      result.current.setAge(35);
      result.current.goFromAge();
    });
    expect(result.current.step).toBe('occasion');
  });

  it('advances from occasion → interests in the same tick', () => {
    const { result } = renderHook(() => useQuizFlow());

    act(() => {
      result.current.setRelationship('Mom');
      result.current.goFromRelationship();
    });
    act(() => {
      result.current.setAge(35);
      result.current.goFromAge();
    });

    act(() => {
      result.current.setOccasion('Birthday');
      result.current.goFromOccasion();
    });
    expect(result.current.step).toBe('interests');
  });

  it('goFromX guards still bail when the corresponding value is empty', () => {
    const { result } = renderHook(() => useQuizFlow());

    act(() => result.current.goFromRelationship());
    expect(result.current.step).toBe('relationship');

    act(() => result.current.goFromGender());
    expect(result.current.step).toBe('relationship');

    act(() => result.current.goFromAge());
    expect(result.current.step).toBe('relationship');

    act(() => result.current.goFromOccasion());
    expect(result.current.step).toBe('relationship');
  });

  it('matches the auto-advance setTimeout pattern used by QuizCardAnimated', () => {
    jest.useFakeTimers();
    try {
      const { result } = renderHook(() => useQuizFlow());

      // Mirror QuizCardAnimated.handlePickRelationship exactly:
      // setRelationship synchronously, then schedule the captured
      // goFromRelationship for 180ms later.
      const captured = result.current.goFromRelationship;
      act(() => {
        result.current.setRelationship('Mom');
      });
      act(() => {
        setTimeout(captured, 180);
        jest.advanceTimersByTime(180);
      });

      expect(result.current.step).toBe('age');
    } finally {
      jest.useRealTimers();
    }
  });

  it('changing relationship resets downstream picks (gender / age / occasion)', () => {
    const { result } = renderHook(() => useQuizFlow());

    act(() => {
      result.current.setRelationship('Partner');
      result.current.goFromRelationship();
    });
    act(() => {
      result.current.setGender('female');
      result.current.goFromGender();
    });
    act(() => {
      result.current.setAge(35);
      result.current.goFromAge();
    });
    act(() => {
      result.current.setOccasion('Birthday');
    });

    // User goes back and re-picks a different relationship.
    act(() => {
      result.current.setRelationship('Mom');
    });

    expect(result.current.gender).toBeNull();
    expect(result.current.age).toBe(0);
    expect(result.current.occasion).toBe('');
  });

  describe('textareaPlaceholder (QA #10)', () => {
    /**
     * Concrete-example placeholders are prefixed with "E.g., " so users read
     * them as suggestions, not statements. The bare "Tell us more about
     * them..." fallback stays unprefixed since it isn't an example.
     */
    it('prefixes Mom placeholder with "E.g.,"', () => {
      const { result } = renderHook(() => useQuizFlow());
      act(() => {
        result.current.setRelationship('Mom');
        result.current.goFromRelationship();
      });
      expect(result.current.textareaPlaceholder).toBe(
        "E.g., She's been getting into mahjong",
      );
    });

    it('prefixes Dad placeholder with "E.g.,"', () => {
      const { result } = renderHook(() => useQuizFlow());
      act(() => {
        result.current.setRelationship('Dad');
        result.current.goFromRelationship();
      });
      expect(result.current.textareaPlaceholder).toBe(
        'E.g., He just retired and needs new hobbies',
      );
    });

    it('prefixes gender-specific Partner copy with "E.g.,"', () => {
      const { result } = renderHook(() => useQuizFlow());
      act(() => {
        result.current.setRelationship('Partner');
        result.current.goFromRelationship();
      });
      // Partner needs the user to pick a gender; until they do, the hook
      // still derives one and the placeholder must still be E.g.-prefixed.
      act(() => {
        result.current.setGender('male');
        result.current.goFromGender();
      });
      expect(result.current.textareaPlaceholder).toMatch(/^E\.g\., /);
    });

    it('every relationship-specific placeholder is "E.g.,"-prefixed', () => {
      const RELATIONSHIPS = [
        'Mom', 'Dad', 'Sister', 'Brother', 'Friend', 'Grandma', 'Grandpa',
        'Daughter', 'Granddaughter', 'Son', 'Grandson', 'Me!', 'Other',
      ];
      for (const rel of RELATIONSHIPS) {
        const { result } = renderHook(() => useQuizFlow());
        act(() => {
          result.current.setRelationship(rel);
          result.current.goFromRelationship();
        });
        // Some rels jump to gender first; nudge through it so the placeholder
        // resolves on the (gender-aware) interests step.
        if (result.current.step === 'gender') {
          act(() => {
            result.current.setGender('female');
            result.current.goFromGender();
          });
        }
        expect(result.current.textareaPlaceholder).toMatch(/^E\.g\., /);
      }
    });
  });

  it('submitInterests requires at least 2 interests and emits answers', () => {
    const onSubmit = jest.fn();
    const { result } = renderHook(() => useQuizFlow({ onSubmit }));

    act(() => {
      result.current.setRelationship('Mom');
      result.current.goFromRelationship();
    });
    act(() => {
      result.current.setAge(35);
      result.current.goFromAge();
    });
    act(() => {
      result.current.setOccasion('Birthday');
      result.current.goFromOccasion();
    });

    // 1 interest — should NOT fire.
    act(() => result.current.toggleInterest('Cooking'));
    act(() => result.current.submitInterests());
    expect(onSubmit).not.toHaveBeenCalled();
    expect(result.current.step).toBe('interests');

    // 2 interests — fires and transitions to loading.
    act(() => result.current.toggleInterest('Books'));
    act(() => result.current.submitInterests());
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      relationship: 'Mom',
      gender: 'female',
      age: 35,
      occasion: 'Birthday',
      interests: ['Cooking', 'Books'],
    });
    expect(result.current.step).toBe('loading');
  });
});
