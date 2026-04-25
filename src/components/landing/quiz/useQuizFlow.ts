import { useCallback, useRef, useState } from 'react';
import {
  ALWAYS_ADULT_RELATIONSHIPS,
  KID_AGE_CHIPS,
  ADULT_AGE_CHIPS,
  Gender,
  getGenderFromRelationship,
} from './constants';
import {
  getInterestPills,
  getInterestEmoji,
  getPlaceholderText,
} from './ageBasedContent';

export type QuizStep = 'relationship' | 'kidOrAdult' | 'age' | 'interests' | 'loading';

export interface QuizAnswers {
  relationship: string;
  age: number;
  interests: string[];
  moreAbout: string;
  gender: Gender;
}

export interface UseQuizFlowOptions {
  /** Called when the user submits the interests step with valid answers. */
  onSubmit?: (answers: QuizAnswers) => void;
}

const buildAgeTitle = (relationship: string, gender: Gender): string => {
  if (relationship === 'Me!') return 'How old are you?';
  if (gender === 'female') return 'How old is she?';
  if (gender === 'male') return 'How old is he?';
  return 'How old are they?';
};

const buildInterestsTitle = (relationship: string, age: number, gender: Gender): string => {
  if (age < 1) return 'What kind of gift are you looking for?';
  if (gender === 'female') return 'What does she like?';
  if (gender === 'male') return 'What does he like?';
  return 'What do they like?';
};

const buildDots = (
  step: QuizStep,
  alwaysAdult: boolean,
): { key: 'kidOrAdult' | 'age' | 'interests'; state: 'completed' | 'current' | 'upcoming' }[] => {
  const keys: ('kidOrAdult' | 'age' | 'interests')[] = alwaysAdult
    ? ['age', 'interests']
    : ['kidOrAdult', 'age', 'interests'];
  const currentIdx = keys.indexOf(step as 'kidOrAdult' | 'age' | 'interests');
  return keys.map((k, i) => ({
    key: k,
    state: i === currentIdx ? 'current' : i < currentIdx ? 'completed' : 'upcoming',
  }));
};

export interface QuizFlowState {
  step: QuizStep;
  relationship: string;
  age: number;
  interests: string[];
  moreAbout: string;
  /** Resolved gender hint for placeholders + titles. */
  gender: Gender;
  /** Title for the active step (where applicable). */
  ageTitle: string;
  interestsTitle: string;
  /** The age-bucketed chip list to render. */
  ageChips: typeof KID_AGE_CHIPS;
  /** Pre-resolved interest pills with their emoji prefix. */
  interestPills: { label: string; emoji: string }[];
  textareaPlaceholder: string;
  /** Step dots for the chrome — empty array when no dots should render. */
  dots: { key: 'kidOrAdult' | 'age' | 'interests'; state: 'completed' | 'current' | 'upcoming' }[];
  canSubmitInterests: boolean;
  // Actions
  setRelationship: (rel: string) => void;
  goFromRelationship: () => void;
  pickKidOrAdult: (category: 'kid' | 'adult') => void;
  setAge: (age: number) => void;
  goFromAge: () => void;
  toggleInterest: (i: string) => void;
  setMoreAbout: (v: string) => void;
  submitInterests: () => void;
  goBack: () => void;
}

export function useQuizFlow(opts: UseQuizFlowOptions = {}): QuizFlowState {
  const [step, setStep] = useState<QuizStep>('relationship');
  const [relationship, setRelationshipState] = useState('');
  const [ageCategory, setAgeCategory] = useState<'kid' | 'adult' | null>(null);
  const [age, setAgeState] = useState(0);
  const [interests, setInterests] = useState<string[]>([]);
  const [moreAbout, setMoreAbout] = useState('');

  const onSubmitRef = useRef(opts.onSubmit);
  onSubmitRef.current = opts.onSubmit;

  const gender = getGenderFromRelationship(relationship);
  const alwaysAdult = ALWAYS_ADULT_RELATIONSHIPS.includes(relationship);

  const setRelationship = useCallback((rel: string) => {
    setRelationshipState(rel);
  }, []);

  const goFromRelationship = useCallback(() => {
    if (!relationship) return;
    setAgeState(0);
    if (ALWAYS_ADULT_RELATIONSHIPS.includes(relationship)) {
      setAgeCategory('adult');
      setStep('age');
    } else {
      setAgeCategory(null);
      setStep('kidOrAdult');
    }
  }, [relationship]);

  const pickKidOrAdult = useCallback((category: 'kid' | 'adult') => {
    setAgeCategory(category);
    setAgeState(0);
    setStep('age');
  }, []);

  const setAge = useCallback((value: number) => setAgeState(value), []);

  const goFromAge = useCallback(() => {
    if (!age) return;
    setStep('interests');
  }, [age]);

  const toggleInterest = useCallback((interest: string) => {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest],
    );
  }, []);

  const submitInterests = useCallback(() => {
    if (interests.length === 0 && moreAbout.trim().length === 0) return;
    setStep('loading');
    onSubmitRef.current?.({ relationship, age, interests, moreAbout, gender });
  }, [interests, moreAbout, relationship, age, gender]);

  const goBack = useCallback(() => {
    setStep((current) => {
      if (current === 'kidOrAdult') return 'relationship';
      if (current === 'age') {
        return ALWAYS_ADULT_RELATIONSHIPS.includes(relationship) ? 'relationship' : 'kidOrAdult';
      }
      if (current === 'interests') return 'age';
      return current;
    });
  }, [relationship]);

  const ageChips = ageCategory === 'kid' ? KID_AGE_CHIPS : ADULT_AGE_CHIPS;
  const ageTitle = buildAgeTitle(relationship, gender);
  const interestsTitle = buildInterestsTitle(relationship, age, gender);
  const interestPills = getInterestPills(age, gender).map((label) => ({
    label,
    emoji: getInterestEmoji(label, gender),
  }));
  const textareaPlaceholder = getPlaceholderText(gender, age);
  const dots = step === 'kidOrAdult' || step === 'age' || step === 'interests'
    ? buildDots(step, alwaysAdult)
    : [];

  return {
    step,
    relationship,
    age,
    interests,
    moreAbout,
    gender,
    ageTitle,
    interestsTitle,
    ageChips,
    interestPills,
    textareaPlaceholder,
    dots,
    canSubmitInterests: interests.length > 0 || moreAbout.trim().length > 0,
    setRelationship,
    goFromRelationship,
    pickKidOrAdult,
    setAge,
    goFromAge,
    toggleInterest,
    setMoreAbout,
    submitInterests,
    goBack,
  };
}
