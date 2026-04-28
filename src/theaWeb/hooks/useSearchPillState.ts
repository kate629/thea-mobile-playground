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
} from '../../components/landing/quiz/ageBasedContent';
import { getQuizPlaceholder, type QuizAnswers } from '../../components/landing/quiz/useQuizFlow';

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
 *  - `freeformPlaceholder` is gendered ("She's been getting into mahjong" /
 *    "He's a huge SF Giants fan") with a generic fallback when relationship
 *    or gender isn't picked yet ("They've been getting into pickleball").
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
  /**
   * Resolved gender. For presumed-gender relationships (Mom, Dad, Sister...)
   * this is auto-seeded from `getGenderFromRelationship(relationship)` on
   * every `setRelationship`. For non-presumed relationships (Partner, Friend,
   * Me!, Other) this stays `null` until the user explicitly picks via
   * `setGender` — no chip is pre-selected, so a generic "Other" doesn't read
   * as the implied default. `canSubmit` blocks until non-null.
   */
  gender: Gender | null;
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
  /**
   * True when the selected relationship doesn't presume a gender (Partner,
   * Friend, Me!, Other). The WHO popover renders a Gender section in this
   * case so the user can pick Female/Male/Other and unlock gendered
   * occasions, interest pills, and placeholder copy. False for presumed-
   * gender relationships (Mom, Dad, Sister, etc.) where gender is fixed.
   */
  showGenderSelector: boolean;

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
  setGender: (gender: Gender) => void;
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

/**
 * WHO is "complete" when relationship + age are picked AND, for relationships
 * that don't presume a gender, the user has picked one. Used to drive the
 * auto-advance from WHO → WHAT once the user finishes filling it out.
 */
const isWhoComplete = (rel: string, ageVal: number, g: Gender | null): boolean => {
  if (!rel || ageVal <= 0) return false;
  if (getGenderFromRelationship(rel) === 'other' && g === null) return false;
  return true;
};

const findAgeLabel = (ageValue: number): string => {
  const match = ADULT_AGE_CHIPS.find((a) => a.value === ageValue);
  return match?.label ?? '';
};

export function useSearchPillState(): SearchPillState {
  const [relationship, setRelationshipState] = useState('');
  const [age, setAgeState] = useState(0);
  const [gender, setGenderState] = useState<Gender | null>(null);
  const [occasion, setOccasionState] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [freeform, setFreeformState] = useState('');
  const [openSegment, setOpenSegment] = useState<SearchPillSegment | null>(null);

  // Sheet bug #54: when the relationship doesn't presume a gender (Partner,
  // Friend, Me!, Other) the WHO popover exposes a Gender section so the user
  // can pick — otherwise the pill silently used 'other' and the user lost
  // gendered occasion/interest/placeholder personalization.
  const showGenderSelector =
    Boolean(relationship) && getGenderFromRelationship(relationship) === 'other';

  // Effective gender for derived option lists: until the user has picked
  // (gender === null), fall back to 'other' so the lists still render
  // sensibly. The null state is purely a `canSubmit` gate; it doesn't
  // interrupt the WHAT/LIKES dropdowns from being browsable.
  const effectiveGender: Gender = gender ?? 'other';

  const occasionOptions = useMemo<SearchPillOccasionOption[]>(() => {
    if (!relationship) return BASE_OCCASION_OPTIONS;
    const gendered = GENDERED_OCCASIONS[effectiveGender] ?? [];
    const partnerOnly =
      relationship === 'Partner'
        ? [{ value: 'Anniversary', label: 'Anniversary', emoji: '💕' }]
        : [];
    return [...gendered, ...BASE_OCCASION_OPTIONS, ...partnerOnly];
  }, [effectiveGender, relationship]);

  const interestPills = useMemo<SearchPillInterestPill[]>(() => {
    const base = getInterestPills(age, effectiveGender);
    const withAccessories = base.includes('Accessories') ? base : [...base, 'Accessories'];
    return withAccessories.map((label) => ({
      label,
      // getInterestEmoji returns "<emoji> " (trailing space); trim for chip use.
      emoji: getInterestEmoji(label, effectiveGender).trim(),
    }));
  }, [age, effectiveGender]);

  // Defer to the quiz's per-relationship placeholder copy so the two
  // surfaces stay in lockstep (Mom → mahjong, Sister → sourdough, etc).
  // Two cases use a neutral fallback instead: (1) no relationship picked
  // yet, and (2) Partner / Friend without a confirmed gender — the quiz
  // function would presume female there because the quiz never reaches
  // its freeform step without a set gender, but the SearchPill renders
  // the placeholder before the user picks.
  const freeformPlaceholder = useMemo(() => {
    if (!relationship) return "E.g., They've been getting into pickleball";
    if ((relationship === 'Partner' || relationship === 'Friend') && gender === null) {
      return "E.g., They've been getting into pickleball";
    }
    return getQuizPlaceholder(gender ?? undefined, relationship);
  }, [gender, relationship]);

  const openDropdown = useCallback((s: SearchPillSegment) => setOpenSegment(s), []);
  const closeDropdown = useCallback(() => setOpenSegment(null), []);
  const toggleDropdown = useCallback(
    (s: SearchPillSegment) => setOpenSegment((curr) => (curr === s ? null : s)),
    [],
  );

  const setRelationship = useCallback(
    (rel: string) => {
      const inferred = getGenderFromRelationship(rel);
      const newGender: Gender | null = inferred === 'other' ? null : inferred;
      // Snapshot transition for auto-advance: only fire WHO → WHAT when this
      // action moves WHO from incomplete to complete.
      const wasComplete = isWhoComplete(relationship, age, gender);
      const willBeComplete = isWhoComplete(rel, age, newGender);

      setRelationshipState(rel);
      // Re-seed gender from the new relationship: presumed-gender relationships
      // auto-set ('Mom' → 'female'); non-presumed ones reset to null so the
      // user must pick explicitly (no carry-over of a prior pick).
      setGenderState(newGender);
      // Reset occasion if it's no longer in the new option list (gendered swap).
      // For null gender, fall back to 'other' for the option-list calc.
      const effective: Gender = newGender ?? 'other';
      setOccasionState((prevOccasion) => {
        if (!prevOccasion) return prevOccasion;
        const allowed = new Set([
          ...(GENDERED_OCCASIONS[effective] ?? []).map((o) => o.value),
          ...BASE_OCCASION_OPTIONS.map((o) => o.value),
          ...(rel === 'Partner' ? ['Anniversary'] : []),
        ]);
        return allowed.has(prevOccasion) ? prevOccasion : '';
      });

      if (!wasComplete && willBeComplete) setOpenSegment('what');
    },
    [relationship, age, gender],
  );

  const setGender = useCallback(
    (g: Gender) => {
      const wasComplete = isWhoComplete(relationship, age, gender);
      const willBeComplete = isWhoComplete(relationship, age, g);

      setGenderState(g);
      // Reset occasion if a gender swap removed it from the option list
      // (e.g. Friend + Female + "Mother's Day" → user picks Other → Mother's
      // Day disappears). Mirrors the same cleanup in setRelationship.
      if (occasion) {
        const allowed = new Set([
          ...(GENDERED_OCCASIONS[g] ?? []).map((o) => o.value),
          ...BASE_OCCASION_OPTIONS.map((o) => o.value),
          ...(relationship === 'Partner' ? ['Anniversary'] : []),
        ]);
        if (!allowed.has(occasion)) setOccasionState('');
      }

      if (!wasComplete && willBeComplete) setOpenSegment('what');
    },
    [occasion, relationship, age, gender],
  );

  const setAge = useCallback(
    (value: number) => {
      const wasComplete = isWhoComplete(relationship, age, gender);
      const willBeComplete = isWhoComplete(relationship, value, gender);
      setAgeState(value);
      if (!wasComplete && willBeComplete) setOpenSegment('what');
    },
    [relationship, age, gender],
  );

  const setOccasion = useCallback(
    (value: string) => {
      const wasComplete = Boolean(occasion);
      setOccasionState(value);
      // Auto-advance to LIKES when WHAT transitions to complete (first pick);
      // on a re-pick, fall back to the prior single-select close behavior.
      if (!wasComplete && value) {
        setOpenSegment('likes');
      } else {
        setOpenSegment(null);
      }
    },
    [occasion],
  );

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
    setGenderState(null);
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

  // Sparkles enables only when WHO (rel + age + gender), WHAT (occasion),
  // LIKES (>=2) all set. Gender is auto-set for presumed relationships (Mom
  // → 'female') and required-explicit for non-presumed (Friend stays null
  // until the user picks).
  const canSubmit =
    Boolean(relationship) && age > 0 && gender !== null && interests.length >= 2;

  // Auto-close WHO when both rel + age picked.
  // Tracked via the setters below in the component, but we expose a helper effect-free
  // version via `setRelationship` / `setAge` requiring the consumer to close. To keep
  // behavior deterministic and testable we close inside the consumer (SearchPill).

  const toQuizAnswers = useCallback(
    (): QuizAnswers => ({
      relationship,
      // Defensive: callers gate on `canSubmit` (which requires gender !== null)
      // so we shouldn't reach here with null. Coerce to 'other' as a safety
      // net rather than throw — the wire shape stays consistent.
      gender: gender ?? 'other',
      age,
      occasion,
      interests,
      moreAbout: freeform,
    }),
    [relationship, gender, age, occasion, interests, freeform],
  );

  return {
    relationship,
    age,
    gender,
    occasion,
    interests,
    freeform,
    openSegment,
    relationshipOptions: RELATIONSHIPS,
    ageChips: ADULT_AGE_CHIPS,
    occasionOptions,
    interestPills,
    freeformPlaceholder,
    showGenderSelector,
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
    setGender,
    setOccasion,
    toggleInterest,
    setFreeform,
    clearWho,
    clearWhat,
    clearLikes,
    toQuizAnswers,
  };
}
