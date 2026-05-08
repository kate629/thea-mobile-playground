import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ADULT_AGE_CHIPS,
  AgeChip,
  Gender,
  KID_AGE_CHIPS,
  LifeStage,
  NEEDS_LIFESTAGE_RELATIONSHIPS,
  getGenderFromRelationship,
} from './constants';
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

export type QuizStep =
  | 'relationship'
  | 'lifeStage'
  | 'gender'
  | 'age'
  | 'occasion'
  | 'interests'
  | 'loading';

export const NEEDS_GENDER_RELATIONSHIPS = ['Partner', 'Friend', 'Me!', 'Other'];

export interface QuizOccasionOption {
  value: string;
  label: string;
  emoji: string;
}

// "Other" intentionally removed (2026-05-08). The product narrative is
// "build a board for someone you love and return for any occasion" —
// occasions are signals to the algo, not gates. A free-form "Other"
// fallback wasn't pulling its weight; the freeform "tell us more" field
// covers any nuance the structured occasions don't capture.
const BASE_OCCASION_OPTIONS: QuizOccasionOption[] = [
  { value: 'Birthday', label: 'Birthday', emoji: '🎂' },
  { value: 'Just Because', label: 'Just Because', emoji: '🥰' },
  { value: 'Thank You', label: 'Thank You', emoji: '🙏' },
  { value: 'Housewarming', label: 'Housewarming', emoji: '🏡' },
  { value: 'New Baby', label: 'New Baby', emoji: '🍼' },
  { value: 'Wedding', label: 'Wedding', emoji: '💍' },
  { value: 'Graduation', label: 'Graduation', emoji: '🎓' },
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
  /** Adult-or-child gate — null until the user passes through the
   *  lifeStage step (which only shows for relationships in
   *  NEEDS_LIFESTAGE_RELATIONSHIPS). For everyone else, defaults to
   *  'adult' for downstream chip selection. */
  lifeStage: LifeStage | null;
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
  lifeStageTitle: string;
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
  setLifeStage: (s: LifeStage) => void;
  goFromLifeStage: () => void;
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

/** Continuous progress along the bar. lifeStage shares 1.25 — a small bump
 *  between relationship (1) and gender (1.5) so the bar still moves but
 *  doesn't feel like a full step. */
const STEP_PROGRESS: Record<QuizStep, number> = {
  relationship: 1,
  lifeStage: 1.25,
  gender: 1.5,
  age: 2,
  occasion: 3,
  interests: 4,
  loading: 4,
};

export function useQuizFlow(opts: UseQuizFlowOptions = {}): QuizFlowState {
  const [step, setStep] = useState<QuizStep>('relationship');
  const [relationship, setRelationshipState] = useState('');
  const [lifeStage, setLifeStageState] = useState<LifeStage | null>(null);
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
  const lifeStageRef = useRef(lifeStage);
  const genderRef = useRef(gender);
  const ageRef = useRef(age);
  const occasionRef = useRef(occasion);

  const derivedGender: Gender = gender ?? getGenderFromRelationship(relationship);

  const setRelationship = useCallback((rel: string) => {
    relationshipRef.current = rel;
    lifeStageRef.current = null;
    genderRef.current = null;
    ageRef.current = 0;
    occasionRef.current = '';
    setRelationshipState(rel);
    // Reset downstream picks so re-selecting the relationship starts fresh.
    setLifeStageState(null);
    setGenderState(null);
    setAgeState(0);
    setOccasionState('');
  }, []);

  const goFromRelationship = useCallback(() => {
    const rel = relationshipRef.current;
    if (!rel) return;
    if (NEEDS_LIFESTAGE_RELATIONSHIPS.includes(rel)) {
      setStep('lifeStage');
      return;
    }
    // Default everyone else to adult so the age chips downstream pick the
    // right set without an explicit lifeStage answer.
    lifeStageRef.current = 'adult';
    setLifeStageState('adult');
    setStep(NEEDS_GENDER_RELATIONSHIPS.includes(rel) ? 'gender' : 'age');
  }, []);

  const setLifeStage = useCallback((s: LifeStage) => {
    lifeStageRef.current = s;
    setLifeStageState(s);
  }, []);

  const goFromLifeStage = useCallback(() => {
    if (!lifeStageRef.current) return;
    const rel = relationshipRef.current;
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
    // Kids skip the occasion step — pre-select 'Just Because' and jump
    // straight to interests. The occasion step's filtered list (Birthday
    // / Just Because / Graduation) is preserved as a backstop in case a
    // future flow re-enables it for kids.
    if (lifeStageRef.current === 'child') {
      occasionRef.current = 'Just Because';
      setOccasionState('Just Because');
      setStep('interests');
      return;
    }
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
    const needsLifeStage = NEEDS_LIFESTAGE_RELATIONSHIPS.includes(relationship);
    const needsGender = NEEDS_GENDER_RELATIONSHIPS.includes(relationship);
    const isKid = lifeStage === 'child';
    setStep((current) => {
      if (current === 'lifeStage') return 'relationship';
      if (current === 'gender') return needsLifeStage ? 'lifeStage' : 'relationship';
      if (current === 'age') {
        if (needsGender) return 'gender';
        if (needsLifeStage) return 'lifeStage';
        return 'relationship';
      }
      if (current === 'occasion') return 'age';
      // Kid flow skipped occasion on the way forward, so back from
      // interests should likewise return to age.
      if (current === 'interests') return isKid ? 'age' : 'occasion';
      return current;
    });
  }, [relationship, lifeStage]);

  const occasionOptions = useMemo(() => {
    // Child branch shows a slimmed list. Mother's/Father's Day,
    // Anniversary, Wedding, Housewarming, etc. don't apply to a kid
    // recipient. Birthday + Just Because + Graduation cover the
    // realistic gifting moments (preschool/elementary/middle/high).
    if (lifeStage === 'child') {
      return BASE_OCCASION_OPTIONS.filter((o) =>
        ['Birthday', 'Just Because', 'Graduation'].includes(o.value),
      );
    }
    const gendered = GENDERED_OCCASIONS[derivedGender] ?? [];
    const partnerOnly =
      relationship === 'Partner'
        ? [{ value: 'Anniversary', label: 'Anniversary', emoji: '💕' } as QuizOccasionOption]
        : [];
    return [...gendered, ...BASE_OCCASION_OPTIONS, ...partnerOnly];
  }, [derivedGender, relationship, lifeStage]);

  const interestPills = useMemo(() => {
    const base = getInterestPills(age, derivedGender);
    // Sovrn guarantees "Accessories" in the list (handleInterestToggle path).
    const pillsWithAccessories = base.includes('Accessories') ? base : [...base, 'Accessories'];
    const isKid = lifeStage === 'child';
    return pillsWithAccessories.map((label) => ({
      label,
      emoji: getInterestEmoji(label, derivedGender, isKid),
    }));
  }, [age, derivedGender, lifeStage]);

  const textareaPlaceholder = useMemo(() => {
    // Kids: age-bucketed copy ("Her dad loves basketball...") is
    // tailored per kid age group and doesn't depend on relationship.
    if (lifeStage === 'child') {
      return getPlaceholderText(derivedGender, age);
    }
    // Adults: relationship-specific copy when we have one, else age fallback.
    return relationship
      ? getQuizPlaceholder(derivedGender, relationship)
      : getPlaceholderText(derivedGender, age);
  }, [derivedGender, relationship, age, lifeStage]);

  const progressPercent = (STEP_PROGRESS[step] / 4) * 100;

  // Age chips swap based on lifeStage. Default to adult chips when
  // lifeStage hasn't been answered yet (i.e., for relationships that
  // skip the lifeStage step, we set lifeStage='adult' inside
  // goFromRelationship — the fallback here covers the initial render
  // before any answer has been given).
  const ageChips: AgeChip[] = lifeStage === 'child' ? KID_AGE_CHIPS : ADULT_AGE_CHIPS;

  return {
    step,
    relationship,
    lifeStage,
    gender,
    derivedGender,
    age,
    occasion,
    interests,
    moreAbout,
    ageChips,
    occasionOptions,
    interestPills,
    textareaPlaceholder,
    ageTitle: buildAgeTitle(relationship, derivedGender),
    // Same headline on the lifeStage step as the age step — they're
    // conceptually the same question, narrowed in two passes.
    lifeStageTitle: buildAgeTitle(relationship, derivedGender),
    occasionTitle: "What's the occasion?",
    interestsTitle: buildInterestsTitle(derivedGender, age),
    genderTitle: buildGenderTitle(relationship),
    relationshipTitle: "Who's this board for?",
    progressPercent,
    canSubmitInterests: interests.length >= 2,
    setRelationship,
    goFromRelationship,
    setLifeStage,
    goFromLifeStage,
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
