import React, { useCallback } from 'react';
import { QuizCard } from './QuizCard';
import { QuizStepRelationship } from './QuizStepRelationship';
import { QuizStepGender } from './QuizStepGender';
import { QuizStepAge } from './QuizStepAge';
import { QuizStepOccasion } from './QuizStepOccasion';
import { QuizStepInterests } from './QuizStepInterests';
import { QuizLoadingAnimated } from './QuizLoadingAnimated';
import { ProductImage } from './AmbientProductScroll';
import { Gender } from './constants';
import { QuizAnswers, useQuizFlow } from './useQuizFlow';

export interface QuizCardAnimatedProps {
  /** Fired when the user submits the interests step. */
  onSubmit?: (answers: QuizAnswers) => void;
  /** Live-arriving product images for the ambient ring during loading. */
  loadingImages?: ProductImage[];
  /** Auto-advance delay between single-select steps (matches sovrn's 180ms). */
  autoAdvanceMs?: number;
}

const DEFAULT_ADVANCE_MS = 180;

export const QuizCardAnimated: React.FC<QuizCardAnimatedProps> = ({
  onSubmit,
  loadingImages = [],
  autoAdvanceMs = DEFAULT_ADVANCE_MS,
}) => {
  const flow = useQuizFlow({ onSubmit });

  // Auto-advance on single-select steps to mirror sovrn's UX. Each transition
  // is debounced by `autoAdvanceMs` so the chip-select animation can play.
  const advance = useCallback(
    (transition: () => void) => {
      const t = setTimeout(transition, autoAdvanceMs);
      return () => clearTimeout(t);
    },
    [autoAdvanceMs],
  );

  const handlePickRelationship = (rel: string) => {
    flow.setRelationship(rel);
    advance(flow.goFromRelationship);
  };
  const handlePickGender = (g: Gender) => {
    flow.setGender(g);
    advance(flow.goFromGender);
  };
  const handlePickAge = (age: number) => {
    flow.setAge(age);
    advance(flow.goFromAge);
  };
  const handlePickOccasion = (occasion: string) => {
    flow.setOccasion(occasion);
    advance(flow.goFromOccasion);
  };

  if (flow.step === 'loading') {
    return (
      <QuizLoadingAnimated
        interests={flow.interests}
        relationship={flow.relationship}
        images={loadingImages}
      />
    );
  }

  return (
    <QuizCard
      stepKey={flow.step}
      onBack={flow.step !== 'relationship' ? flow.goBack : undefined}
      progressPercent={flow.progressPercent}
    >
      {flow.step === 'relationship' && (
        <QuizStepRelationship
          title={flow.relationshipTitle}
          selected={flow.relationship}
          onSelect={handlePickRelationship}
        />
      )}
      {flow.step === 'gender' && (
        <QuizStepGender title={flow.genderTitle} selected={flow.gender} onSelect={handlePickGender} />
      )}
      {flow.step === 'age' && (
        <QuizStepAge
          title={flow.ageTitle}
          chips={flow.ageChips}
          selectedAge={flow.age}
          onSelectAge={handlePickAge}
        />
      )}
      {flow.step === 'occasion' && (
        <QuizStepOccasion
          title={flow.occasionTitle}
          options={flow.occasionOptions}
          selected={flow.occasion}
          onSelect={handlePickOccasion}
        />
      )}
      {flow.step === 'interests' && (
        <QuizStepInterests
          title={flow.interestsTitle}
          pills={flow.interestPills}
          selectedInterests={flow.interests}
          onToggleInterest={flow.toggleInterest}
          textareaValue={flow.moreAbout}
          textareaPlaceholder={flow.textareaPlaceholder}
          onTextareaChange={flow.setMoreAbout}
          onSubmit={flow.submitInterests}
          canSubmit={flow.canSubmitInterests}
          submitLabel={
            flow.gender === 'female'
              ? 'Build her board ✨'
              : flow.gender === 'male'
                ? 'Build his board ✨'
                : 'Build their board ✨'
          }
        />
      )}
    </QuizCard>
  );
};
