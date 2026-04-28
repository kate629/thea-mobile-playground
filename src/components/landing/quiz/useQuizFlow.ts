import { useCallback, useMemo, useRef, useState } from 'react';
import { ADULT_AGE_CHIPS, AgeChip, Gender, getGenderFromRelationship } from './constants';
import { getInterestEmoji, getInterestPills, getPlaceholderText } from './ageBasedContent';

/**
 * Quiz flow mirrors sovrn's `src/pages/Quiz.tsx` (5 steps).
 *
 *   relationship → (gender if NEEDS_GENDER) → age → occasion → interests → loading
 *
 * Notes vs the previous version:
 *  - The kid/adult split is gone. Age uses adult-only chips for every
 *    relationship; the interest pill list is still age-bucketed via
 *    `getInterestPills`.
 *  - A new `gender` step appears only for relationships where the
 *    relationship name doesn't imply a gender (Partner / Friend / Me! /
 *    Other). Mom/Dad/Brother/Sister/etc. skip straight to age.
 *  - A new `occasion` step lives between age and interests. The option
 *    list is gender + relationship aware (Mother's Day, Father's Day,
 *    Anniversary for Partner).
 *  - Submit requires at least 2 interests (matches sovrn's
 *    `canGetRecommendations`). The freeform "tell us more" field is
 *    optional.
 */

export type QuizStep = 'relationship' | 'gender' | 'age' | 'occasion' | 'interests' | 'loading';

export const NEEDS_GENDER_RELATIONSHIPS = ['Partner', 'Friend', 'Me!', 'Other'];

export interface QuizOccasionOption {
  value: string;
  label: string;
  emoji: string;
}

const BASE_OCCASION_OPTIONS: QuizOccasionOption[] = [
  { value: 'Birthday', label: 'Birthday', emoji: '🎂' },
  { value: 'Just Because', label: 'Just Because', emoji: '🥰' },
  { value: 'Thank You', label: 'Thank You', emoji: '🙏' },
  { value: 'Housewarming', label: 'Housewarming', emoji: '🏡' },
  { value: 'New Baby', label: 'New Baby', emoji: '🍼' },
  { value: 'Wedding', label: 'Wedding', emoji: '💍' },
  { value: 'Graduation', label: 'Graduation', emoji: '🎓' },
  { value: 'Other', label: 'Other', emoji: '✨' },
];

const GENDERED_OCCASIONS: Record<Gender, QuizOccasionOption[]> = {
  female: [{ value: "Mother's Day", label: "Mother's Day", emoji: '🌷' }],
  male: [{ value: "Father's Day", label: "Father's Day", emoji: '👔' }],
  other: [],
};

/** Relationship-specific freeform placeholder. Concrete examples are prefixed
 *  with "E.g., " so the user reads them as suggestions ("E.g., She's been
 *  getting into mahjong") rather than statements. Generic fallback at the
 *  end stays unprefixed since it isn't an example. Closes QA #10. */
/**
 * Gender + relationship-aware placeholder for the freeform "tell us more"
 * step. Exported for reuse by the homepage SearchPill so the two surfaces
 * stay in lockstep — single source of truth for the per-relationship copy.
 */
export function getQuizPlaceholder(gender: Gender | undefined, relationship: string): string {
  const rel = relationship.toLowerCase();
  if (rel === 'mom') return "E.g., She's been getting into mahjong";
  if (rel === 'dad') return 'E.g., He just retired and needs new hobbies';
  if (rel === 'partner' || rel === 'spouse') {
    return gender === 'male'
      ? "E.g., He's really into grilling lately"
      : "E.g., We're planning a trip to Italy";
  }
  if (rel === 'sister') return 'E.g., She’s learning to make sourdough';
  if (rel === 'brother') return 'E.g., He’s a huge SF Giants fan';
  if (rel === 'friend') {
    return gender === 'male'
      ? 'E.g., He’s a huge SF Giants fan'
      : 'E.g., She’s learning to make sourdough';
  }
  if (rel === 'grandma') return "E.g., She's obsessed with her garden this year";
  if (rel === 'grandpa') return 'E.g., He does the crossword puzzle every morning';
  if (rel === 'daughter' || rel === 'granddaughter') {
    return 'E.g., She just moved to NYC and loves matcha';
  }
  if (rel === 'son' || rel === 'grandson') return 'E.g., He just moved to NYC and loves coffee';
  if (rel === 'me!' || rel === 'me') return "E.g., I've been trying to get more into mindfulness";
  if (rel === 'other') return 'E.g., My boss loves pickleball';
  if (gender === 'female') return 'E.g., She’s learning to make sourdough';
  if (gender === 'male') return 'E.g., He’s a huge SF Giants fan';
  return 'Tell us more about them...';
}

export interface QuizAnswers {
  relationship: string;
  /** Final resolved gender (may be inferred from relationship). */
  gender: Gender;
  age: number;
  occasion: string;
  interests: string[];
  moreAbout: string;
}

export interface UseQuizFlowOptions {
  /** Called when the user submits the interests step with valid answers. */
  onSubmit?: (answers: QuizAnswers) => void;
}

export interface QuizFlowState {
  step: QuizStep;
  relationship: string;
  /** User-explicit gender pick. Empty until they answer the gender step. */
  gender: Gender | null;
  /** Final gender used to drive copy + interest pills. Falls back to inferred. */
  derivedGender: Gender;
  age: number;
  occasion: string;
  interests: string[];
  moreAbout: string;
  ageChips: AgeChip[];
  occasionOptions: QuizOccasionOption[];
  interestPills: { label: string; emoji: string }[];
  textareaPlaceholder: string;
  ageTitle: string;
  occasionTitle: string;
  interestsTitle: string;
  genderTitle: string;
  relationshipTitle: string;
  /** Continuous progress percent for the bottom bar (0–100). */
  progressPercent: number;
  canSubmitInterests: boolean;
  // Actions
  setRelationship: (rel: string) => void;
  goFromRelationship: () => void;
  setGender: (g: Gender) => void;
  goFromGender: () => void;
  setAge: (age: number) => void;
  goFromAge: () => void;
  setOccasion: (o: string) => void;
  goFromOccasion: () => void;
  toggleInterest: (i: string) => void;
  setMoreAbout: (v: string) => void;
  submitInterests: () => void;
  goBack: () => void;
}

const buildAgeTitle = (relationship: string, gender: Gender): string => {
  if (relationship === 'Me!') return 'How old are you?';
  if (gender === 'female') return 'How old is she?';
  if (gender === 'male') return 'How old is he?';
  return 'How old are they?';
};

const buildInterestsTitle = (gender: Gender, age: number): string => {
  if (age < 1) return 'What kind of gift are you looking for?';
  if (gender === 'female') return 'What does she like?';
  if (gender === 'male') return 'What does he like?';
  return 'What do they like?';
};

const buildGenderTitle = (relationship: string): string =>
  relationship === 'Me!' ? "What's your gender?" : "What's their gender?";

/** Continuous progress mirrors sovrn (relationship=1, gender=1.5, age=2, occasion=3, interests=4). */
const STEP_PROGRESS: Record<QuizStep, number> = {
  relationship: 1,
  gender: 1.5,
  age: 2,
  occasion: 3,
  interests: 4,
  loading: 4,
};

export function useQuizFlow(opts: UseQuizFlowOptions = {}): QuizFlowState {
  const [step, setStep] = useState<QuizStep>('relationship');
  const [relationship, setRelationshipState] = useState('');
  const [gender, setGenderState] = useState<Gender | null>(null);
  const [age, setAgeState] = useState(0);
  const [occasion, setOccasionState] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [moreAbout, setMoreAbout] = useState('');

  const onSubmitRef = useRef(opts.onSubmit);
  onSubmitRef.current = opts.onSubmit;

  // Refs mirror the latest values so the auto-advance setTimeout can read
  // the just-set value instead of the stale closure captured at click time.
  const relationshipRef = useRef(relationship);
  const genderRef = useRef(gender);
  const ageRef = useRef(age);
  const occasionRef = useRef(occasion);

  const derivedGender: Gender = gender ?? getGenderFromRelationship(relationship);

  const setRelationship = useCallback((rel: string) => {
    relationshipRef.current = rel;
    genderRef.current = null;
    ageRef.current = 0;
    occasionRef.current = '';
    setRelationshipState(rel);
    // Reset downstream picks so re-selecting the relationship starts fresh.
    setGenderState(null);
    setAgeState(0);
    setOccasionState('');
  }, []);

  const goFromRelationship = useCallback(() => {
    const rel = relationshipRef.current;
    if (!rel) return;
    setStep(NEEDS_GENDER_RELATIONSHIPS.includes(rel) ? 'gender' : 'age');
  }, []);

  const setGender = useCallback((g: Gender) => {
    genderRef.current = g;
    setGenderState(g);
  }, []);

  const goFromGender = useCallback(() => {
    if (!genderRef.current) return;
    setStep('age');
  }, []);

  const setAge = useCallback((value: number) => {
    ageRef.current = value;
    setAgeState(value);
  }, []);

  const goFromAge = useCallback(() => {
    if (!ageRef.current) return;
    setStep('occasion');
  }, []);

  const setOccasion = useCallback((o: string) => {
    occasionRef.current = o;
    setOccasionState((prev) => {
      // When the user picks a DIFFERENT occasion (typically after hitting
      // back to revise), clear interest selections so chips on the next
      // step start fresh. Without this, manual picks (and any future
      // occasion-driven defaults) leak across occasion changes — e.g. the
      // user picks Housewarming → toggles Cooking → goes back → picks
      // Birthday, and Cooking still appears selected on the interests
      // step. Re-confirming the same occasion is a no-op so we don't wipe
      // selections when the user simply re-clicks their existing choice.
      if (prev && prev !== o) {
        setInterests([]);
      }
      return o;
    });
  }, []);

  const goFromOccasion = useCallback(() => {
    if (!occasionRef.current) return;
    setStep('interests');
  }, []);

  const toggleInterest = useCallback((interest: string) => {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest],
    );
  }, []);

  const submitInterests = useCallback(() => {
    if (interests.length < 2) return;
    setStep('loading');
    onSubmitRef.current?.({
      relationship,
      gender: derivedGender,
      age,
      occasion,
      interests,
      moreAbout,
    });
  }, [interests, derivedGender, relationship, age, occasion, moreAbout]);

  const goBack = useCallback(() => {
    setStep((current) => {
      if (current === 'gender') return 'relationship';
      if (current === 'age') {
        return NEEDS_GENDER_RELATIONSHIPS.includes(relationship) ? 'gender' : 'relationship';
      }
      if (current === 'occasion') return 'age';
      if (current === 'interests') return 'occasion';
      return current;
    });
  }, [relationship]);

  const occasionOptions = useMemo(() => {
    const gendered = GENDERED_OCCASIONS[derivedGender] ?? [];
    const partnerOnly =
      relationship === 'Partner'
        ? [{ value: 'Anniversary', label: 'Anniversary', emoji: '💕' } as QuizOccasionOption]
        : [];
    return [...gendered, ...BASE_OCCASION_OPTIONS, ...partnerOnly];
  }, [derivedGender, relationship]);

  const interestPills = useMemo(() => {
    const base = getInterestPills(age, derivedGender);
    // Sovrn guarantees "Accessories" in the list (handleInterestToggle path).
    const pillsWithAccessories = base.includes('Accessories') ? base : [...base, 'Accessories'];
    return pillsWithAccessories.map((label) => ({
      label,
      emoji: getInterestEmoji(label, derivedGender),
    }));
  }, [age, derivedGender]);

  const textareaPlaceholder = useMemo(() => {
    // Sovrn favors relationship-specific copy; we fall back to age-based copy
    // when the relationship hasn't been picked yet (defensive — shouldn't
    // happen since the textarea only shows on the interests step).
    return relationship
      ? getQuizPlaceholder(derivedGender, relationship)
      : getPlaceholderText(derivedGender, age);
  }, [derivedGender, relationship, age]);

  const progressPercent = (STEP_PROGRESS[step] / 4) * 100;

  return {
    step,
    relationship,
    gender,
    derivedGender,
    age,
    occasion,
    interests,
    moreAbout,
    ageChips: ADULT_AGE_CHIPS,
    occasionOptions,
    interestPills,
    textareaPlaceholder,
    ageTitle: buildAgeTitle(relationship, derivedGender),
    occasionTitle: "What's the occasion?",
    interestsTitle: buildInterestsTitle(derivedGender, age),
    genderTitle: buildGenderTitle(relationship),
    relationshipTitle: "Who's on your list?",
    progressPercent,
    canSubmitInterests: interests.length >= 2,
    setRelationship,
    goFromRelationship,
    setGender,
    goFromGender,
    setAge,
    goFromAge,
    setOccasion,
    goFromOccasion,
    toggleInterest,
    setMoreAbout,
    submitInterests,
    goBack,
  };
}
