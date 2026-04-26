// All enums for the theaWeb namespace.
// Each enum is exported as both an `as const` array (iterable for UI) and a derived union type.

export const TheaWebRelationshipEnumValues = [
  'MOM',
  'DAD',
  'PARTNER',
  'SISTER',
  'BROTHER',
  'FRIEND',
  'DAUGHTER',
  'SON',
  'GRANDMA',
  'GRANDPA',
  'GRANDDAUGHTER',
  'GRANDSON',
  'COWORKER',
  'OTHER',
] as const;
export type TheaWebRelationshipEnum = (typeof TheaWebRelationshipEnumValues)[number];

export const TheaWebGenderEnumValues = [
  'FEMALE',
  'MALE',
  'NON_BINARY',
  'PREFER_NOT_TO_SAY',
] as const;
export type TheaWebGenderEnum = (typeof TheaWebGenderEnumValues)[number];

export const TheaWebGiftFlowStepEnumValues = [
  'RECIPIENT',
  'OCCASION',
  'INTERESTS',
  'FREEFORM',
  'SUBMITTED',
] as const;
export type TheaWebGiftFlowStepEnum = (typeof TheaWebGiftFlowStepEnumValues)[number];

export const TheaWebRecommendationStatusEnumValues = [
  'PROCESSING',
  'COMPLETED',
  'FAILED',
] as const;
export type TheaWebRecommendationStatusEnum = (typeof TheaWebRecommendationStatusEnumValues)[number];

export const TheaWebRecommendationModeEnumValues = ['THOUGHTFUL', 'FAST'] as const;
export type TheaWebRecommendationModeEnum = (typeof TheaWebRecommendationModeEnumValues)[number];

export const TheaWebGiftActivityStateEnumValues = ['SAVED', 'DISMISSED', 'PURCHASED'] as const;
export type TheaWebGiftActivityStateEnum = (typeof TheaWebGiftActivityStateEnumValues)[number];

export const TheaWebActivitySourceEnumValues = [
  'RESULTS_PAGE',
  'BOARD_VIEW',
  'OCCASION_BOARD',
  'MULTI_RECIPIENT_MODAL',
] as const;
export type TheaWebActivitySourceEnum = (typeof TheaWebActivitySourceEnumValues)[number];

export const TheaWebMergeStatusEnumValues = ['OK', 'NOOP', 'PARTIAL', 'FAILED'] as const;
export type TheaWebMergeStatusEnum = (typeof TheaWebMergeStatusEnumValues)[number];

export const TheaWebOccasionEnumValues = [
  'BIRTHDAY',
  'MOTHERS_DAY',
  'FATHERS_DAY',
  'ANNIVERSARY',
  'GRADUATION',
  'WEDDING',
  'NEW_BABY',
  'HOUSEWARMING',
  'THANK_YOU',
  'JUST_BECAUSE',
  'CHRISTMAS',
  'HANUKKAH',
  'VALENTINES_DAY',
  'OTHER',
] as const;
export type TheaWebOccasionEnum = (typeof TheaWebOccasionEnumValues)[number];
