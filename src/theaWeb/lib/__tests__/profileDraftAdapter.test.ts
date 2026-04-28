import {
  recommendationToProfileDraft,
  profileDraftToUpdateRecipient,
} from '../profileDraftAdapter';
import type { Recommendation } from '../../schemas';
import type { ProfileDraft } from '../../../components/landing/results/types';

const baseDoc = (overrides: Partial<Recommendation> = {}): Recommendation =>
  ({
    recommendationId: 'rec1',
    isActive: true,
    input: {
      occasion: 'JUST_BECAUSE',
      occasionLabel: 'Just because',
      interests: ['Books', 'Cooking'],
      freeform: 'She loves long walks',
    },
    recipientSnapshot: {
      name: 'Mom',
      emoji: '🌷',
      relationship: 'MOM',
      gender: 'FEMALE',
      age: 55,
      isMe: false,
    },
    status: 'COMPLETED',
    mode: 'THOUGHTFUL',
    carouselSessionId: 'uid_rec1',
    _schemaVersion: 1,
    createdAt: null as never,
    updatedAt: null as never,
    ...overrides,
  } as Recommendation);

describe('recommendationToProfileDraft', () => {
  it('maps a fully-populated recipient + input into a draft', () => {
    const draft = recommendationToProfileDraft(baseDoc());
    expect(draft).toMatchObject({
      emoji: '🌷',
      name: 'Mom',
      gender: 'female',
      relationship: 'Mom',
      age: 55,
      occasion: 'Just because',
      interests: ['Books', 'Cooking'],
      moreAbout: 'She loves long walks',
    });
  });

  it('translates wire occasion enum to display string when no label is set (drawer-dropdown match)', () => {
    // The drawer's <Select> uses display strings for option values
    // ('Mother's Day', 'Birthday', etc.). The recommendation doc stores
    // the wire enum ('MOTHERS_DAY', 'BIRTHDAY'). Adapter translates so
    // the dropdown finds a matching option instead of falling back to
    // its first option (Birthday) — which had been masking the bug
    // pre-PR #78 because every quiz silently sent JUST_BECAUSE.
    const draftBirthday = recommendationToProfileDraft(
      baseDoc({ input: { occasion: 'BIRTHDAY', interests: [], freeform: '' } }),
    );
    expect(draftBirthday.occasion).toBe('Birthday');

    const draftMothers = recommendationToProfileDraft(
      baseDoc({ input: { occasion: 'MOTHERS_DAY', interests: [], freeform: '' } }),
    );
    expect(draftMothers.occasion).toBe("Mother's Day");

    const draftFathers = recommendationToProfileDraft(
      baseDoc({ input: { occasion: 'FATHERS_DAY', interests: [], freeform: '' } }),
    );
    expect(draftFathers.occasion).toBe("Father's Day");

    const draftJustBecause = recommendationToProfileDraft(
      baseDoc({ input: { occasion: 'JUST_BECAUSE', interests: [], freeform: '' } }),
    );
    expect(draftJustBecause.occasion).toBe('Just Because');
  });

  it('passes occasionLabel through verbatim when set (free-text OTHER override)', () => {
    const draft = recommendationToProfileDraft(
      baseDoc({ input: { occasion: 'OTHER', occasionLabel: 'Pet adoption', interests: [], freeform: '' } }),
    );
    expect(draft.occasion).toBe('Pet adoption');
  });

  it('uses ✨ as the emoji fallback when the snapshot has none', () => {
    const draft = recommendationToProfileDraft(
      baseDoc({
        recipientSnapshot: { name: 'Pat', relationship: 'FRIEND', isMe: false },
      }),
    );
    expect(draft.emoji).toBe('✨');
  });

  it('maps NON_BINARY and PREFER_NOT_TO_SAY to "other"', () => {
    const nb = recommendationToProfileDraft(
      baseDoc({
        recipientSnapshot: {
          name: 'Sam', relationship: 'FRIEND', gender: 'NON_BINARY', isMe: false,
        },
      }),
    );
    const pn = recommendationToProfileDraft(
      baseDoc({
        recipientSnapshot: {
          name: 'Sam', relationship: 'FRIEND', gender: 'PREFER_NOT_TO_SAY', isMe: false,
        },
      }),
    );
    expect(nb.gender).toBe('other');
    expect(pn.gender).toBe('other');
  });

  it('falls back to "Friend" for COWORKER (not in the drawer relationship list)', () => {
    const draft = recommendationToProfileDraft(
      baseDoc({
        recipientSnapshot: { name: 'Alex', relationship: 'COWORKER', isMe: false },
      }),
    );
    expect(draft.relationship).toBe('Friend');
  });
});

describe('profileDraftToUpdateRecipient', () => {
  const fullDraft: ProfileDraft = {
    emoji: '⭐',
    name: 'Sammy',
    gender: 'male',
    relationship: 'Brother',
    age: 28,
    occasion: 'BIRTHDAY',
    priceMin: 25,
    priceMax: 200,
    interests: ['Books'],
    vibes: [],
    moreAbout: '',
  };

  it('persists name, emoji, relationship, gender, age', () => {
    const req = profileDraftToUpdateRecipient(fullDraft, 'rec_123');
    expect(req).toEqual({
      recipientId: 'rec_123',
      name: 'Sammy',
      emoji: '⭐',
      relationship: 'BROTHER',
      gender: 'MALE',
      age: 28,
    });
  });

  it('drops recommendation-only fields (occasion, interests, vibes, freeform, price range)', () => {
    const req = profileDraftToUpdateRecipient(fullDraft, 'rec_123') as Record<string, unknown>;
    expect(req).not.toHaveProperty('occasion');
    expect(req).not.toHaveProperty('interests');
    expect(req).not.toHaveProperty('vibes');
    expect(req).not.toHaveProperty('moreAbout');
    expect(req).not.toHaveProperty('priceMin');
    expect(req).not.toHaveProperty('priceMax');
  });

  it('omits fields that are missing on the draft', () => {
    const partial: ProfileDraft = {
      ...fullDraft,
      gender: undefined,
      age: undefined,
    };
    const req = profileDraftToUpdateRecipient(partial, 'rec_123');
    expect(req).not.toHaveProperty('gender');
    expect(req).not.toHaveProperty('age');
    expect(req.name).toBe('Sammy');
  });

  it('rounds-trips draft-shape relationship strings back to schema enums', () => {
    const enums = ['Mom', 'Dad', 'Partner', 'Friend', 'Grandma', 'Other'].map((rel) =>
      profileDraftToUpdateRecipient({ ...fullDraft, relationship: rel }, 'r').relationship,
    );
    expect(enums).toEqual(['MOM', 'DAD', 'PARTNER', 'FRIEND', 'GRANDMA', 'OTHER']);
  });
});
