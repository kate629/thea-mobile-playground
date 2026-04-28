import type { QuizAnswers } from '../../components/landing/quiz/useQuizFlow';
import type {
  TheaWebGenderEnum,
  TheaWebOccasionEnum,
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

// Display strings used by the quiz UI (`BASE_OCCASION_OPTIONS` and
// `GENDERED_OCCASIONS` in `useQuizFlow.ts`) → wire enum values. Mirrors
// the chip values exactly. If the quiz adds a new occasion chip, it must
// be added here too.
const OCCASION_BY_DISPLAY: Record<string, TheaWebOccasionEnum> = {
  Birthday: 'BIRTHDAY',
  "Mother's Day": 'MOTHERS_DAY',
  "Father's Day": 'FATHERS_DAY',
  Anniversary: 'ANNIVERSARY',
  Graduation: 'GRADUATION',
  Wedding: 'WEDDING',
  'New Baby': 'NEW_BABY',
  Housewarming: 'HOUSEWARMING',
  'Thank You': 'THANK_YOU',
  'Just Because': 'JUST_BECAUSE',
  Other: 'OTHER',
};

export function quizAnswersToRequest(answers: QuizAnswers): TheaWebSubmitGiftFlowRequest {
  const relationship = RELATIONSHIP_BY_DISPLAY[answers.relationship];
  if (!relationship) {
    throw new Error(`Unknown relationship: ${answers.relationship}`);
  }

  const isMe = answers.relationship === 'Me!';

  // Map the user's quiz pick to the wire enum. Unknown / missing → fall
  // back to JUST_BECAUSE so BE validation passes (matches prior behavior
  // for any edge case the quiz might emit). The previous version of this
  // function hardcoded JUST_BECAUSE for ALL submissions because the quiz
  // didn't yet collect an occasion — that comment was stale; the quiz has
  // had an occasion step since the sovrn 5-step rewrite (see
  // `useQuizFlow.ts:25` `step` enum). Bug surfaced 2026-04-28: 79/79 prod
  // recommendations had occasion=JUST_BECAUSE regardless of user pick.
  const occasion = OCCASION_BY_DISPLAY[answers.occasion] ?? 'JUST_BECAUSE';

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
      occasion,
      interests: answers.interests,
      freeform: answers.moreAbout,
    },
    // THOUGHTFUL routes to the original /feed agent (carousel_agent.py).
    // FAST mode (fast_carousel_agent.py) is an abandoned experiment; do not
    // use until / unless that path is rehabilitated.
    mode: 'THOUGHTFUL',
  };
}
