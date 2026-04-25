import React from 'react';
import { QuizCard } from './QuizCard';
import { QuizStepRelationship } from './QuizStepRelationship';
import { QuizStepKidOrAdult } from './QuizStepKidOrAdult';
import { QuizStepAge } from './QuizStepAge';
import { QuizStepInterests } from './QuizStepInterests';
import { QuizLoadingAnimated } from './QuizLoadingAnimated';
import { ProductImage } from './AmbientProductScroll';
import { QuizAnswers, useQuizFlow } from './useQuizFlow';

export interface QuizCardAnimatedProps {
  /** Fired when the user submits the interests step. */
  onSubmit?: (answers: QuizAnswers) => void;
  /** Live-arriving product images for the ambient ring during loading. */
  loadingImages?: ProductImage[];
}

export const QuizCardAnimated: React.FC<QuizCardAnimatedProps> = ({ onSubmit, loadingImages = [] }) => {
  const flow = useQuizFlow({ onSubmit });

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
      dots={flow.dots}
    >
      {flow.step === 'relationship' && (
        <QuizStepRelationship
          selected={flow.relationship}
          onSelect={flow.setRelationship}
          onNext={flow.goFromRelationship}
        />
      )}
      {flow.step === 'kidOrAdult' && (
        <QuizStepKidOrAdult onPick={flow.pickKidOrAdult} />
      )}
      {flow.step === 'age' && (
        <QuizStepAge
          title={flow.ageTitle}
          chips={flow.ageChips}
          selectedAge={flow.age}
          onSelectAge={flow.setAge}
          onNext={flow.goFromAge}
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
        />
      )}
    </QuizCard>
  );
};
