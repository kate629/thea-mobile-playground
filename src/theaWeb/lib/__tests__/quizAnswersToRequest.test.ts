import { quizAnswersToRequest } from '../quizAnswersToRequest';
import type { QuizAnswers } from '../../../components/landing/quiz/useQuizFlow';

const baseAnswers: QuizAnswers = {
  relationship: 'Friend',
  age: 30,
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

  test('defaults occasion to JUST_BECAUSE and mode to THOUGHTFUL', () => {
    const req = quizAnswersToRequest(baseAnswers);
    expect(req.input.occasion).toBe('JUST_BECAUSE');
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
