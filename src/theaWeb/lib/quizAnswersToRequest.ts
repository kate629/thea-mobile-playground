import type { QuizAnswers } from '../../components/landing/quiz/useQuizFlow';
import type {
  TheaWebGenderEnum,
  TheaWebRelationshipEnum,
  TheaWebSubmitGiftFlowRequest,
} from '../schemas';

// Display strings used by the quiz UI (`RELATIONSHIPS` in
// `quiz/constants.ts`) → wire enum values.
const RELATIONSHIP_BY_DISPLAY: Record<string, TheaWebRelationshipEnum> = {
  Mom: 'MOM',
  Dad: 'DAD',
  Partner: 'PARTNER',
  Sister: 'SISTER',
  Brother: 'BROTHER',
  Daughter: 'DAUGHTER',
  Son: 'SON',
  Grandma: 'GRANDMA',
  Grandpa: 'GRANDPA',
  Granddaughter: 'GRANDDAUGHTER',
  Grandson: 'GRANDSON',
  Friend: 'FRIEND',
  Other: 'OTHER',
  // 'Me!' has no first-class enum — `isMe` flag carries the meaning;
  // relationship is set to OTHER as a sentinel.
  'Me!': 'OTHER',
};

const GENDER_BY_QUIZ: Record<QuizAnswers['gender'], TheaWebGenderEnum> = {
  female: 'FEMALE',
  male: 'MALE',
  other: 'NON_BINARY',
};

export function quizAnswersToRequest(answers: QuizAnswers): TheaWebSubmitGiftFlowRequest {
  const relationship = RELATIONSHIP_BY_DISPLAY[answers.relationship];
  if (!relationship) {
    throw new Error(`Unknown relationship: ${answers.relationship}`);
  }

  const isMe = answers.relationship === 'Me!';

  return {
    recipient: {
      // Default name from relationship label until the wizard collects a name.
      name: isMe ? 'Me' : answers.relationship,
      relationship,
      gender: GENDER_BY_QUIZ[answers.gender],
      age: answers.age,
      isMe,
    },
    input: {
      // Wizard does not yet collect an occasion; default to JUST_BECAUSE so
      // BE validation passes without requiring an occasionLabel.
      occasion: 'JUST_BECAUSE',
      interests: answers.interests,
      freeform: answers.moreAbout,
    },
    mode: 'FAST',
  };
}
