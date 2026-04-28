import { useCallback, useMemo, useState } from 'react';
import {
  ADULT_AGE_CHIPS,
  AgeChip,
  Gender,
  RELATIONSHIPS,
  RelationshipOption,
  getGenderFromRelationship,
} from '../../components/landing/quiz/constants';
import {
  getInterestEmoji,
  getInterestPills,
  getPlaceholderText,
} from '../../components/landing/quiz/ageBasedContent';
import type { QuizAnswers } from '../../components/landing/quiz/useQuizFlow';

/**
 * State machine for the homepage search pill (the 3-segment WHO / WHAT / LIKES
 * picker that lives at the top of the signed-in homepage).
 *
 * Mirrors the dynamic option logic from `useQuizFlow.ts`:
 *  - `occasionOptions` is gender + relationship aware (Mom → Mother's Day,
 *    Dad → Father's Day, Partner adds Anniversary). Falls back to
 *    `BASE_OCCASION_OPTIONS` only when the relationship isn't picked yet.
 *  - `interestPills` come from `getInterestPills(age, gender)`. The list is
 *    age-bucketed; gender swaps Beauty → Grooming for male.
 *  - `freeformPlaceholder` mirrors quiz copy via `getPlaceholderText`.
 *
 * The pill submits via the same `useSubmitGiftFlow` hook the quiz uses, so the
 * resulting `QuizAnswers` object is shaped identically.
 */

export interface SearchPillOccasionOption {
  value: string;
  label: string;
  emoji: string;
}

const BASE_OCCASION_OPTIONS: SearchPillOccasionOption[] = [
  { value: 'Birthday', label: 'Birthday', emoji: '🎂' },
  { value: 'Just Because', label: 'Just Because', emoji: '🥰' },
  { value: 'Thank You', label: 'Thank You', emoji: '🙏' },
  { value: 'Housewarming', label: 'Housewarming', emoji: '🏡' },
  { value: 'New Baby', label: 'New Baby', emoji: '🍼' },
  { value: 'Wedding', label: 'Wedding', emoji: '💍' },
  { value: 'Graduation', label: 'Graduation', emoji: '🎓' },
  { value: 'Other', label: 'Other', emoji: '✨' },
];

const GENDERED_OCCASIONS: Record<Gender, SearchPillOccasionOption[]> = {
  female: [{ value: "Mother's Day", label: "Mother's Day", emoji: '🌷' }],
  male: [{ value: "Father's Day", label: "Father's Day", emoji: '👔' }],
  other: [],
};

export type SearchPillSegment = 'who' | 'what' | 'likes';

export interface SearchPillInterestPill {
  label: string;
  emoji: string;
}

export interface SearchPillState {
  // Selections
  relationship: string;
  age: number;
  /** Resolved gender (inferred from relationship, falls back to 'other'). */
  derivedGender: Gender;
  occasion: string;
  interests: string[];
  freeform: string;

  // Open dropdown ('' = none)
  openSegment: SearchPillSegment | null;

  // Derived option lists
  relationshipOptions: RelationshipOption[];
  ageChips: AgeChip[];
  occasionOptions: SearchPillOccasionOption[];
  interestPills: SearchPillInterestPill[];
  freeformPlaceholder: string;

  // Display + validation
  whoDisplay: string;
  whoEmoji: string;
  whatDisplay: string;
  likesDisplay: string;
  canSubmit: boolean;

  // Actions
  openDropdown: (s: SearchPillSegment) => void;
  closeDropdown: () => void;
  toggleDropdown: (s: SearchPillSegment) => void;
  setRelationship: (rel: string) => void;
  setAge: (age: number) => void;
  setOccasion: (occasion: string) => void;
  toggleInterest: (interest: string) => void;
  setFreeform: (text: string) => void;
  clearWho: () => void;
  clearWhat: () => void;
  clearLikes: () => void;
  /** Snapshot of current selections in `QuizAnswers` shape for `useSubmitGiftFlow.submit`. */
  toQuizAnswers: () => QuizAnswers;
}

const findRelationshipEmoji = (rel: string): string => {
  const match = RELATIONSHIPS.find((r) => r.value === rel);
  return match?.emoji ?? '';
};

const findAgeLabel = (ageValue: number): string => {
  const match = ADULT_AGE_CHIPS.find((a) => a.value === ageValue);
  return match?.label ?? '';
};

export function useSearchPillState(): SearchPillState {
  const [relationship, setRelationshipState] = useState('');
  const [age, setAgeState] = useState(0);
  const [occasion, setOccasionState] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [freeform, setFreeformState] = useState('');
  const [openSegment, setOpenSegment] = useState<SearchPillSegment | null>(null);

  const derivedGender: Gender = getGenderFromRelationship(relationship);

  const occasionOptions = useMemo<SearchPillOccasionOption[]>(() => {
    if (!relationship) return BASE_OCCASION_OPTIONS;
    const gendered = GENDERED_OCCASIONS[derivedGender] ?? [];
    const partnerOnly =
      relationship === 'Partner'
        ? [{ value: 'Anniversary', label: 'Anniversary', emoji: '💕' }]
        : [];
    return [...gendered, ...BASE_OCCASION_OPTIONS, ...partnerOnly];
  }, [derivedGender, relationship]);

  const interestPills = useMemo<SearchPillInterestPill[]>(() => {
    const base = getInterestPills(age, derivedGender);
    const withAccessories = base.includes('Accessories') ? base : [...base, 'Accessories'];
    return withAccessories.map((label) => ({
      label,
      // getInterestEmoji returns "<emoji> " (trailing space); trim for chip use.
      emoji: getInterestEmoji(label, derivedGender).trim(),
    }));
  }, [age, derivedGender]);

  const freeformPlaceholder = useMemo(() => {
    if (!relationship && !age) return 'She loves mahjong';
    return getPlaceholderText(derivedGender, age);
  }, [derivedGender, relationship, age]);

  const openDropdown = useCallback((s: SearchPillSegment) => setOpenSegment(s), []);
  const closeDropdown = useCallback(() => setOpenSegment(null), []);
  const toggleDropdown = useCallback(
    (s: SearchPillSegment) => setOpenSegment((curr) => (curr === s ? null : s)),
    [],
  );

  const setRelationship = useCallback((rel: string) => {
    setRelationshipState(rel);
    // Reset occasion if it's no longer in the new option list (gendered swap).
    setOccasionState((prevOccasion) => {
      if (!prevOccasion) return prevOccasion;
      const newGender = getGenderFromRelationship(rel);
      const allowed = new Set([
        ...(GENDERED_OCCASIONS[newGender] ?? []).map((o) => o.value),
        ...BASE_OCCASION_OPTIONS.map((o) => o.value),
        ...(rel === 'Partner' ? ['Anniversary'] : []),
      ]);
      return allowed.has(prevOccasion) ? prevOccasion : '';
    });
  }, []);

  const setAge = useCallback((value: number) => {
    setAgeState(value);
  }, []);

  const setOccasion = useCallback((value: string) => {
    setOccasionState(value);
    setOpenSegment(null); // single-select auto-closes
  }, []);

  const toggleInterest = useCallback((interest: string) => {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest],
    );
  }, []);

  const setFreeform = useCallback((text: string) => {
    setFreeformState(text);
  }, []);

  const clearWho = useCallback(() => {
    setRelationshipState('');
    setAgeState(0);
    // Don't reset occasion — let setRelationship-style cleanup happen next pick.
  }, []);

  const clearWhat = useCallback(() => {
    setOccasionState('');
  }, []);

  const clearLikes = useCallback(() => {
    setInterests([]);
    setFreeformState('');
  }, []);

  // Display strings
  const whoEmoji = relationship ? findRelationshipEmoji(relationship) : '';
  const whoDisplay = useMemo(() => {
    if (!relationship && !age) return '';
    const ageLabel = age ? findAgeLabel(age) : '';
    if (relationship && ageLabel) return `${relationship}, ${ageLabel}`;
    return relationship || ageLabel;
  }, [relationship, age]);

  const whatDisplay = occasion;

  const likesDisplay = useMemo(() => {
    if (interests.length === 0) return '';
    if (interests.length <= 2) return interests.join(', ');
    return `${interests.slice(0, 2).join(', ')} +${interests.length - 2}`;
  }, [interests]);

  // Sparkles enables only when WHO (rel + age), WHAT (occasion), LIKES (>=2) all set.
  const canSubmit = Boolean(relationship) && age > 0 && interests.length >= 2;

  // Auto-close WHO when both rel + age picked.
  // Tracked via the setters below in the component, but we expose a helper effect-free
  // version via `setRelationship` / `setAge` requiring the consumer to close. To keep
  // behavior deterministic and testable we close inside the consumer (SearchPill).

  const toQuizAnswers = useCallback(
    (): QuizAnswers => ({
      relationship,
      gender: derivedGender,
      age,
      occasion,
      interests,
      moreAbout: freeform,
    }),
    [relationship, derivedGender, age, occasion, interests, freeform],
  );

  return {
    relationship,
    age,
    derivedGender,
    occasion,
    interests,
    freeform,
    openSegment,
    relationshipOptions: RELATIONSHIPS,
    ageChips: ADULT_AGE_CHIPS,
    occasionOptions,
    interestPills,
    freeformPlaceholder,
    whoDisplay,
    whoEmoji,
    whatDisplay,
    likesDisplay,
    canSubmit,
    openDropdown,
    closeDropdown,
    toggleDropdown,
    setRelationship,
    setAge,
    setOccasion,
    toggleInterest,
    setFreeform,
    clearWho,
    clearWhat,
    clearLikes,
    toQuizAnswers,
  };
}
