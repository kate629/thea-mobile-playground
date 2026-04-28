import type {
  Recommendation,
  TheaWebGenderEnum,
  TheaWebOccasionEnum,
  TheaWebRelationshipEnum,
  TheaWebSubmitGiftFlowRequest,
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

// Default price range covers everything the slider's max ($200+) allows, so
// the user has to actively narrow the range to filter. Bug #51 — priceMin
// previously defaulted to $25, which silently filtered out cheap items.
const DEFAULT_PRICE_MIN = 0;
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
 * dropped here — those drive a regenerate path instead (bug #51).
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

/**
 * Drawer fields that, when changed, should trigger a fresh algo run via
 * regenerate (`theaWebSubmitGiftFlow`). The "Update picks" CTA stays
 * disabled until at least one of these changes (bug #51).
 *
 * `vibes` doesn't have its own BE field — the regenerate path folds it into
 * `freeform` (matching the OLD codebase's algo input shape) so the agent
 * still sees it. `priceMin`/`priceMax` are deliberately excluded: price is a
 * client-side filter, not an algo input. `birthMonth`/`birthDay` are
 * deliberately excluded: not used by the BE.
 */
export const ALGO_TRIGGER_FIELDS = [
  'gender',
  'age',
  'interests',
  'moreAbout',
  'relationship',
  'occasion',
  'vibes',
] as const satisfies readonly (keyof ProfileDraft)[];

/**
 * Drawer fields that persist via `theaWebUpdateRecipient` but do NOT trigger
 * a new algo run. Changing only these does not enable "Update picks"; instead
 * we fire a silent `updateRecipient` when the drawer closes (bug #51).
 */
export const RECIPIENT_ONLY_FIELDS = ['name', 'emoji'] as const satisfies readonly (keyof ProfileDraft)[];

/**
 * Combine a base freeform string and a list of vibe labels into a single
 * freeform value the BE algo can consume. Empty/undefined inputs are dropped.
 * Mirrors the OLD codebase's pattern of treating vibes as additional
 * free-text signal rather than its own structured field.
 */
function composeFreeform(base: string | undefined, vibes: string[] | undefined): string {
  const parts: string[] = [];
  if (base && base.trim()) parts.push(base.trim());
  if (vibes && vibes.length > 0) {
    const trimmed = vibes.map((v) => v.trim()).filter((v) => v.length > 0);
    if (trimmed.length > 0) parts.push(trimmed.join(', '));
  }
  return parts.join(' — ');
}

function fieldEqual<K extends keyof ProfileDraft>(a: ProfileDraft[K], b: ProfileDraft[K]): boolean {
  // Set-equality for arrays (interests, vibes) — toggling a value off then on
  // can leave the array reordered, so order-sensitive comparison would
  // mis-flag a net-zero change as dirty (bug #51 acceptance criterion).
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    const seen = new Set(a);
    return b.every((item) => seen.has(item));
  }
  return a === b;
}

/**
 * True when the draft has all the inputs the algo needs to run a fresh
 * recommendation. Mirrors the quiz's submit-disabled rules so the "Update
 * picks" CTA stays disabled if the user clears a required field — bug #51.
 *
 *   - At least 2 interests selected (the algo needs signal beyond just the
 *     recipient demographics)
 *   - relationship, gender, age, occasion all set
 *
 * Vibes are NOT required (parity with the quiz; vibes are an enhancement,
 * not a requirement). Freeform is also not required.
 */
export function isProfileDraftComplete(draft: ProfileDraft): boolean {
  if (!draft.relationship) return false;
  if (!draft.gender) return false;
  if (typeof draft.age !== 'number') return false;
  if (!draft.occasion) return false;
  if (!draft.interests || draft.interests.length < 2) return false;
  return true;
}

/** True when at least one algo-triggering field differs between draft and initial. */
export function isAlgoDirty(initial: ProfileDraft, draft: ProfileDraft): boolean {
  return ALGO_TRIGGER_FIELDS.some((f) => !fieldEqual(initial[f], draft[f]));
}

/** True when at least one recipient-only field differs between draft and initial. */
export function isRecipientOnlyDirty(initial: ProfileDraft, draft: ProfileDraft): boolean {
  return RECIPIENT_ONLY_FIELDS.some((f) => !fieldEqual(initial[f], draft[f]));
}

/**
 * Build a `theaWebSubmitGiftFlow` payload that re-runs the algo with the
 * draft's algo-trigger fields layered on top of the existing recommendation's
 * snapshot. Recipient fields the BE will upsert in-place (no separate
 * `updateRecipient` call needed); rec-input fields (occasion / interests /
 * freeform) seed the new recommendation.
 *
 * The result mirrors `useRegenerate.buildRegenerateRequest` but with
 * draft-driven overrides for the fields the user actually changed.
 */
export function profileDraftToRegenerateRequest(
  draft: ProfileDraft,
  recipientId: string,
  doc: Recommendation,
): TheaWebSubmitGiftFlowRequest {
  const snap = doc.recipientSnapshot;
  const input = doc.input;
  // Resolve the draft relationship to its schema enum or `undefined` (never
  // `""`) so the `??` fall-through only triggers when there's no draft value.
  const draftRel = draft.relationship ? DISPLAY_TO_REL[draft.relationship] : undefined;

  // Auto-rename the recipient when the user changes relationship without
  // explicitly typing a new name (bug #51 follow-up). Common path: user
  // re-runs the algo for a different relationship via the drawer; clobbering
  // the recipient name to the new label means the header reflects the new
  // context (e.g. "Mom" → "Sister") without an extra keystroke. We DO
  // respect a name the user explicitly typed in the same session — if
  // `draft.name !== snap.name` they made a deliberate rename, so we keep it.
  const relationshipChanged = !!(draftRel && draftRel !== snap.relationship);
  const userTypedName = !!(draft.name && draft.name !== snap.name);
  const finalName =
    relationshipChanged && !userTypedName && draft.relationship
      ? draft.relationship
      : draft.name || snap.name;

  return {
    recipient: {
      recipientId,
      name: finalName,
      emoji: draft.emoji || snap.emoji,
      relationship: draftRel ?? snap.relationship,
      gender: draft.gender ? DRAFT_TO_GENDER[draft.gender] : snap.gender,
      age: typeof draft.age === 'number' ? draft.age : snap.age,
      isMe: snap.isMe,
    },
    input: {
      // `occasionLabel` doubles as the user-chosen value when present —
      // the drawer edits the label, the enum stays in sync via the BE.
      occasion: input.occasion,
      occasionLabel: draft.occasion ?? input.occasionLabel,
      interests: draft.interests.length > 0 ? [...draft.interests] : [...input.interests],
      // The BE has no `vibes` field, so fold them into `freeform` — matches
      // the OLD codebase's algo input shape. Agent treats freeform as natural
      // language so additional descriptors (e.g. "Cozy", "Practical") layer
      // on as extra signal without a schema change.
      freeform: composeFreeform(draft.moreAbout ?? input.freeform, draft.vibes),
    },
    mode: doc.mode,
  };
}
