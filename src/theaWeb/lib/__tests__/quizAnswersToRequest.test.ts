import { quizAnswersToRequest } from '../quizAnswersToRequest';
import type { QuizAnswers } from '../../../components/landing/quiz/useQuizFlow';

const baseAnswers: QuizAnswers = {
  relationship: 'Friend',
  age: 30,
  occasion: 'Birthday',
  interests: ['coffee', 'books'],
  moreAbout: 'loves italian cooking',
  gender: 'other',
};

describe('quizAnswersToRequest', () => {
  test('maps standard relationship to wire enum', () => {
    const req = quizAnswersToRequest({ ...baseAnswers, relationship: 'Mom', gender: 'female' });
    expect(req.recipient.relationship).toBe('MOM');
    expect(req.recipient.gender).toBe('FEMALE');
    expect(req.recipient.isMe).toBe(false);
    expect(req.recipient.name).toBe('Mom');
  });

  test('Me! flips isMe and renames recipient', () => {
    const req = quizAnswersToRequest({ ...baseAnswers, relationship: 'Me!' });
    expect(req.recipient.isMe).toBe(true);
    expect(req.recipient.name).toBe('Me');
    expect(req.recipient.relationship).toBe('OTHER');
  });

  test('passes through interests + freeform + age', () => {
    const req = quizAnswersToRequest({ ...baseAnswers, age: 8, interests: ['lego'], moreAbout: 'star wars fan' });
    expect(req.recipient.age).toBe(8);
    expect(req.input.interests).toEqual(['lego']);
    expect(req.input.freeform).toBe('star wars fan');
  });

  test('maps each quiz occasion display string to its wire enum (regression: 79/79 prod docs were JUST_BECAUSE before this fix)', () => {
    // Source of truth: BASE_OCCASION_OPTIONS + GENDERED_OCCASIONS in
    // src/components/landing/quiz/useQuizFlow.ts
    const cases: Array<[string, string]> = [
      ['Birthday', 'BIRTHDAY'],
      ["Mother's Day", 'MOTHERS_DAY'],
      ["Father's Day", 'FATHERS_DAY'],
      ['Anniversary', 'ANNIVERSARY'],
      ['Graduation', 'GRADUATION'],
      ['Wedding', 'WEDDING'],
      ['New Baby', 'NEW_BABY'],
      ['Housewarming', 'HOUSEWARMING'],
      ['Thank You', 'THANK_YOU'],
      ['Just Because', 'JUST_BECAUSE'],
      ['Other', 'OTHER'],
    ];
    for (const [display, wire] of cases) {
      const req = quizAnswersToRequest({ ...baseAnswers, occasion: display });
      expect(req.input.occasion).toBe(wire);
    }
  });

  test('falls back to JUST_BECAUSE for an unknown occasion display string', () => {
    // Defensive: if the quiz UI ever emits a chip we don't have a mapping
    // for (e.g. seasonal one-off), don't throw — degrade to JUST_BECAUSE
    // so the BE call still succeeds.
    const req = quizAnswersToRequest({ ...baseAnswers, occasion: 'Halloween' });
    expect(req.input.occasion).toBe('JUST_BECAUSE');
  });

  test('falls back to JUST_BECAUSE for empty occasion', () => {
    const req = quizAnswersToRequest({ ...baseAnswers, occasion: '' });
    expect(req.input.occasion).toBe('JUST_BECAUSE');
  });

  test('mode defaults to THOUGHTFUL', () => {
    const req = quizAnswersToRequest(baseAnswers);
    expect(req.mode).toBe('THOUGHTFUL');
  });

  test('non-binary gender maps to NON_BINARY', () => {
    const req = quizAnswersToRequest({ ...baseAnswers, gender: 'other' });
    expect(req.recipient.gender).toBe('NON_BINARY');
  });

  test('throws on unknown relationship', () => {
    expect(() => quizAnswersToRequest({ ...baseAnswers, relationship: 'WeirdRel' })).toThrow(
      /Unknown relationship/,
    );
  });

  test('every quiz constants relationship maps to a wire enum', () => {
    const all = ['Mom','Dad','Partner','Sister','Brother','Daughter','Son','Grandma','Grandpa','Granddaughter','Grandson','Friend','Me!','Other'];
    for (const rel of all) {
      const req = quizAnswersToRequest({ ...baseAnswers, relationship: rel });
      expect(req.recipient.relationship).toBeDefined();
    }
  });
});
