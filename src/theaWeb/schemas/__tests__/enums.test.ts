import {
  TheaWebActivitySourceEnumValues,
  TheaWebGenderEnumValues,
  TheaWebGiftActivityStateEnumValues,
  TheaWebGiftFlowStepEnumValues,
  TheaWebMergeStatusEnumValues,
  TheaWebOccasionEnumValues,
  TheaWebRecommendationModeEnumValues,
  TheaWebRecommendationStatusEnumValues,
  TheaWebRelationshipEnumValues,
  type TheaWebGiftActivityStateEnum,
  type TheaWebMergeStatusEnum,
  type TheaWebOccasionEnum,
  type TheaWebRecommendationStatusEnum,
  type TheaWebRelationshipEnum,
} from '../enums';

// Each test asserts the const array contains expected values, and that the
// derived union type accepts those values at compile time. Catches drift between
// the Firestore stored strings and the TS surface.

describe('TheaWeb enums', () => {
  test('relationship enum contains key family members and OTHER', () => {
    expect(TheaWebRelationshipEnumValues).toContain('MOM');
    expect(TheaWebRelationshipEnumValues).toContain('DAD');
    expect(TheaWebRelationshipEnumValues).toContain('FRIEND');
    expect(TheaWebRelationshipEnumValues).toContain('OTHER');

    const mom: TheaWebRelationshipEnum = 'MOM';
    expect(mom).toBe('MOM');
  });

  test('relationship has 14 values', () => {
    expect(TheaWebRelationshipEnumValues).toHaveLength(14);
  });

  test('gender enum has 4 values including PREFER_NOT_TO_SAY', () => {
    expect(TheaWebGenderEnumValues).toEqual([
      'FEMALE',
      'MALE',
      'NON_BINARY',
      'PREFER_NOT_TO_SAY',
    ]);
  });

  test('gift flow step enum has 5 values', () => {
    expect(TheaWebGiftFlowStepEnumValues).toEqual([
      'RECIPIENT',
      'OCCASION',
      'INTERESTS',
      'FREEFORM',
      'SUBMITTED',
    ]);
  });

  test('recommendation status enum tracks PROCESSING/COMPLETED/FAILED lifecycle', () => {
    expect(TheaWebRecommendationStatusEnumValues).toEqual([
      'PROCESSING',
      'COMPLETED',
      'FAILED',
    ]);
    const processing: TheaWebRecommendationStatusEnum = 'PROCESSING';
    expect(processing).toBe('PROCESSING');
  });

  test('recommendation mode enum is exactly THOUGHTFUL and FAST', () => {
    expect(TheaWebRecommendationModeEnumValues).toEqual(['THOUGHTFUL', 'FAST']);
  });

  test('gift activity state enum is SAVED/DISMISSED/PURCHASED', () => {
    expect(TheaWebGiftActivityStateEnumValues).toEqual([
      'SAVED',
      'DISMISSED',
      'PURCHASED',
    ]);
    const saved: TheaWebGiftActivityStateEnum = 'SAVED';
    expect(saved).toBe('SAVED');
  });

  test('activity source enum covers all UI surfaces', () => {
    expect(TheaWebActivitySourceEnumValues).toContain('RESULTS_PAGE');
    expect(TheaWebActivitySourceEnumValues).toContain('BOARD_VIEW');
    expect(TheaWebActivitySourceEnumValues).toContain('OCCASION_BOARD');
    expect(TheaWebActivitySourceEnumValues).toContain('MULTI_RECIPIENT_MODAL');
  });

  test('merge status enum covers all merge outcomes', () => {
    expect(TheaWebMergeStatusEnumValues).toEqual(['OK', 'NOOP', 'PARTIAL', 'FAILED']);
    const noop: TheaWebMergeStatusEnum = 'NOOP';
    expect(noop).toBe('NOOP');
  });

  test('occasion enum contains common occasions and OTHER fallback', () => {
    expect(TheaWebOccasionEnumValues).toContain('BIRTHDAY');
    expect(TheaWebOccasionEnumValues).toContain('CHRISTMAS');
    expect(TheaWebOccasionEnumValues).toContain('VALENTINES_DAY');
    expect(TheaWebOccasionEnumValues).toContain('OTHER');
    const birthday: TheaWebOccasionEnum = 'BIRTHDAY';
    expect(birthday).toBe('BIRTHDAY');
  });

  test('all enum values are SCREAMING_SNAKE_CASE strings', () => {
    const allArrays = [
      TheaWebRelationshipEnumValues,
      TheaWebGenderEnumValues,
      TheaWebGiftFlowStepEnumValues,
      TheaWebRecommendationStatusEnumValues,
      TheaWebRecommendationModeEnumValues,
      TheaWebGiftActivityStateEnumValues,
      TheaWebActivitySourceEnumValues,
      TheaWebMergeStatusEnumValues,
      TheaWebOccasionEnumValues,
    ];
    for (const arr of allArrays) {
      for (const v of arr) {
        expect(v).toMatch(/^[A-Z][A-Z0-9_]*$/);
      }
    }
  });

  test('no enum has duplicate values', () => {
    const allArrays = [
      TheaWebRelationshipEnumValues,
      TheaWebGenderEnumValues,
      TheaWebGiftFlowStepEnumValues,
      TheaWebRecommendationStatusEnumValues,
      TheaWebRecommendationModeEnumValues,
      TheaWebGiftActivityStateEnumValues,
      TheaWebActivitySourceEnumValues,
      TheaWebMergeStatusEnumValues,
      TheaWebOccasionEnumValues,
    ];
    for (const arr of allArrays) {
      expect(new Set(arr).size).toBe(arr.length);
    }
  });
});
