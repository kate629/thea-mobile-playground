import type {
  Recommendation,
  TheaWebGenderEnum,
  TheaWebOccasionEnum,
  TheaWebRelationshipEnum,
} from '../schemas';
import type { TheaWebUpdateRecipientRequest } from '../schemas/endpoints/theaWebUpdateRecipient';
import type { ProfileDraft } from '../../components/landing/results/types';

/**
 * Display string used by `RELATIONSHIPS` in the quiz constants list.
 * The drawer renders relationship as a value out of that list, so the
 * draft must speak that vocabulary — not the schema enum.
 */
const REL_TO_DISPLAY: Record<TheaWebRelationshipEnum, string> = {
  MOM: 'Mom',
  DAD: 'Dad',
  PARTNER: 'Partner',
  SISTER: 'Sister',
  BROTHER: 'Brother',
  FRIEND: 'Friend',
  DAUGHTER: 'Daughter',
  SON: 'Son',
  GRANDMA: 'Grandma',
  GRANDPA: 'Grandpa',
  GRANDDAUGHTER: 'Granddaughter',
  GRANDSON: 'Grandson',
  COWORKER: 'Friend', // No 'Coworker' in RELATIONSHIPS list — fall back to closest.
  OTHER: 'Other',
};

const DISPLAY_TO_REL: Record<string, TheaWebRelationshipEnum> = {
  Mom: 'MOM',
  Dad: 'DAD',
  Partner: 'PARTNER',
  Sister: 'SISTER',
  Brother: 'BROTHER',
  Friend: 'FRIEND',
  Daughter: 'DAUGHTER',
  Son: 'SON',
  Grandma: 'GRANDMA',
  Grandpa: 'GRANDPA',
  Granddaughter: 'GRANDDAUGHTER',
  Grandson: 'GRANDSON',
  Other: 'OTHER',
};

const GENDER_TO_DRAFT: Record<TheaWebGenderEnum, ProfileDraft['gender']> = {
  FEMALE: 'female',
  MALE: 'male',
  NON_BINARY: 'other',
  PREFER_NOT_TO_SAY: 'other',
};

const DRAFT_TO_GENDER: Record<NonNullable<ProfileDraft['gender']>, TheaWebGenderEnum> = {
  female: 'FEMALE',
  male: 'MALE',
  other: 'NON_BINARY',
};

/**
 * Wire occasion enum → display string used by `OCCASION_OPTIONS` in
 * `src/components/landing/results/constants.ts`. The drawer's <Select>
 * matches `draft.occasion` against the option `value` strings, so the
 * draft must speak the display vocabulary — not the schema enum.
 *
 * Mirrors `OCCASION_BY_DISPLAY` in `quizAnswersToRequest.ts` (display →
 * enum); both maps should stay in sync. Worth deduping in a follow-up.
 *
 * Bug context: until 2026-04-28 the FE wire adapter hardcoded
 * 'JUST_BECAUSE' for every quiz, which masked this display-mismatch bug
 * — the dropdown couldn't match 'JUST_BECAUSE' against any option value
 * either, but the broken state was uniform so no one noticed. After the
 * occasion-fix shipped, the bug surfaced because the dropdown still
 * couldn't find 'MOTHERS_DAY'/'BIRTHDAY'/etc. in its list of display
 * strings → fell back to first option ("Birthday").
 */
const WIRE_TO_OCCASION_DISPLAY: Partial<Record<TheaWebOccasionEnum, string>> = {
  BIRTHDAY: 'Birthday',
  ANNIVERSARY: 'Anniversary',
  MOTHERS_DAY: "Mother's Day",
  FATHERS_DAY: "Father's Day",
  GRADUATION: 'Graduation',
  HOUSEWARMING: 'Housewarming',
  NEW_BABY: 'New Baby',
  WEDDING: 'Wedding',
  THANK_YOU: 'Thank You',
  JUST_BECAUSE: 'Just Because',
  OTHER: 'Other',
  // CHRISTMAS / HANUKKAH / VALENTINES_DAY exist on the schema enum but
  // aren't in the quiz's BASE_OCCASION_OPTIONS or the drawer's
  // OCCASION_OPTIONS, so falling through to undefined is correct — the
  // user couldn't have selected them through the quiz UI.
};

const DEFAULT_PRICE_MIN = 25;
const DEFAULT_PRICE_MAX = 200;

/** Build the initial draft the drawer opens with from the recommendation doc. */
export function recommendationToProfileDraft(doc: Recommendation): ProfileDraft {
  const { recipientSnapshot: snap, input } = doc;
  // `input.occasion` is a wire enum like 'MOTHERS_DAY'. The drawer's
  // dropdown speaks display strings ('Mother's Day'). Translate so the
  // dropdown can match. `input.occasionLabel` is the free-text override
  // for OTHER picks (e.g. user types "Pet adoption") — surface that
  // verbatim when set.
  const occasionDisplay =
    input.occasionLabel ?? WIRE_TO_OCCASION_DISPLAY[input.occasion] ?? input.occasion;
  return {
    emoji: snap.emoji ?? '✨',
    name: snap.name,
    gender: snap.gender ? GENDER_TO_DRAFT[snap.gender] : undefined,
    relationship: REL_TO_DISPLAY[snap.relationship],
    age: snap.age,
    occasion: occasionDisplay,
    priceMin: DEFAULT_PRICE_MIN,
    priceMax: DEFAULT_PRICE_MAX,
    interests: [...input.interests],
    vibes: [],
    moreAbout: input.freeform,
  };
}

/**
 * Translate the drawer's commit payload into the recipient-level fields the
 * `theaWebUpdateRecipient` callable persists. Recommendation-level fields
 * (occasion, interests, vibes, freeform, priceMin/Max) are intentionally
 * dropped here — those need a regenerate path (bug #24), not an update.
 */
export function profileDraftToUpdateRecipient(
  draft: ProfileDraft,
  recipientId: string,
): TheaWebUpdateRecipientRequest {
  const req: TheaWebUpdateRecipientRequest = { recipientId };
  if (draft.name) req.name = draft.name;
  if (draft.emoji) req.emoji = draft.emoji;
  if (draft.relationship && DISPLAY_TO_REL[draft.relationship]) {
    req.relationship = DISPLAY_TO_REL[draft.relationship];
  }
  if (draft.gender) req.gender = DRAFT_TO_GENDER[draft.gender];
  if (typeof draft.age === 'number') req.age = draft.age;
  return req;
}
