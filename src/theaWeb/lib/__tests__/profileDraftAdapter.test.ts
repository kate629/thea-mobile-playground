import {
  recommendationToProfileDraft,
  profileDraftToUpdateRecipient,
  profileDraftToRegenerateRequest,
  isAlgoDirty,
  isProfileDraftComplete,
  isRecipientOnlyDirty,
  ALGO_TRIGGER_FIELDS,
  RECIPIENT_ONLY_FIELDS,
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

// Bug #51 — dirty-detection drives the "Update picks" enabled state and the
// drawer-close auto-save path. The two field sets must be mutually exclusive
// and together exclude price + birthMonth/birthDay (deliberately ignored).
describe('algo-trigger vs recipient-only field sets (bug #51)', () => {
  const initial: ProfileDraft = {
    emoji: '🌷',
    name: 'Mom',
    gender: 'female',
    relationship: 'Mom',
    age: 55,
    occasion: 'Just because',
    priceMin: 25,
    priceMax: 200,
    interests: ['Books'],
    vibes: [],
    moreAbout: 'She loves long walks',
  };

  it('exports the documented field sets', () => {
    expect([...ALGO_TRIGGER_FIELDS].sort()).toEqual(
      ['age', 'gender', 'interests', 'moreAbout', 'occasion', 'relationship', 'vibes'].sort(),
    );
    expect([...RECIPIENT_ONLY_FIELDS].sort()).toEqual(['emoji', 'name'].sort());
  });

  describe('isAlgoDirty', () => {
    it('returns false when nothing changed', () => {
      expect(isAlgoDirty(initial, { ...initial })).toBe(false);
    });

    it.each(['gender', 'age', 'occasion', 'relationship', 'moreAbout'] as const)(
      'returns true when %s changes',
      (field) => {
        const draft: ProfileDraft = {
          ...initial,
          [field]: field === 'age' ? 99 : 'CHANGED',
        };
        expect(isAlgoDirty(initial, draft)).toBe(true);
      },
    );

    it('returns true when an interest is added', () => {
      const draft: ProfileDraft = { ...initial, interests: ['Books', 'Cooking'] };
      expect(isAlgoDirty(initial, draft)).toBe(true);
    });

    it('returns true when an interest is removed', () => {
      const draft: ProfileDraft = { ...initial, interests: [] };
      expect(isAlgoDirty(initial, draft)).toBe(true);
    });

    it('returns true when a vibe is added (vibes are an algo trigger — bug #51)', () => {
      const draft: ProfileDraft = { ...initial, vibes: ['Cozy'] };
      expect(isAlgoDirty(initial, draft)).toBe(true);
    });

    it.each(['name', 'emoji'] as const)('returns false when %s changes alone', (field) => {
      const draft: ProfileDraft = { ...initial, [field]: 'CHANGED' };
      expect(isAlgoDirty(initial, draft)).toBe(false);
    });

    it.each(['priceMin', 'priceMax', 'birthMonth', 'birthDay'] as const)(
      'returns false when %s changes (deliberately not an algo trigger)',
      (field) => {
        const draft: ProfileDraft = { ...initial, [field]: 999 };
        expect(isAlgoDirty(initial, draft)).toBe(false);
      },
    );
  });

  describe('isRecipientOnlyDirty', () => {
    it('returns true when name changes', () => {
      expect(isRecipientOnlyDirty(initial, { ...initial, name: 'Mama' })).toBe(true);
    });

    it('returns true when emoji changes', () => {
      expect(isRecipientOnlyDirty(initial, { ...initial, emoji: '🌹' })).toBe(true);
    });

    it('returns false when only an algo-trigger field changes', () => {
      expect(isRecipientOnlyDirty(initial, { ...initial, gender: 'male' })).toBe(false);
    });

    it('returns false when nothing changed', () => {
      expect(isRecipientOnlyDirty(initial, { ...initial })).toBe(false);
    });
  });
});

describe('profileDraftToRegenerateRequest (bug #51)', () => {
  const doc: Recommendation = {
    recommendationId: 'rec1',
    isActive: true,
    input: {
      occasion: 'BIRTHDAY',
      occasionLabel: 'Birthday',
      interests: ['Books'],
      freeform: 'Likes long walks',
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
  } as Recommendation;

  const draft: ProfileDraft = {
    emoji: '🌷',
    name: 'Mom',
    gender: 'female',
    relationship: 'Mom',
    age: 55,
    occasion: 'Birthday',
    priceMin: 25,
    priceMax: 200,
    interests: ['Books'],
    vibes: [],
    moreAbout: 'Likes long walks',
  };

  it('builds a request that mirrors the doc snapshot when nothing changed', () => {
    const req = profileDraftToRegenerateRequest(draft, 'rec_123', doc);
    expect(req.recipient).toEqual({
      recipientId: 'rec_123',
      name: 'Mom',
      emoji: '🌷',
      relationship: 'MOM',
      gender: 'FEMALE',
      age: 55,
      isMe: false,
    });
    expect(req.input.interests).toEqual(['Books']);
    expect(req.input.occasionLabel).toBe('Birthday');
    expect(req.input.freeform).toBe('Likes long walks');
    expect(req.mode).toBe('THOUGHTFUL');
  });

  it('overrides recipient fields with edited draft values', () => {
    const edited: ProfileDraft = { ...draft, gender: 'other', age: 60, name: 'Mama' };
    const req = profileDraftToRegenerateRequest(edited, 'rec_123', doc);
    expect(req.recipient.gender).toBe('NON_BINARY');
    expect(req.recipient.age).toBe(60);
    expect(req.recipient.name).toBe('Mama');
  });

  it('replaces the interests list when edited', () => {
    const edited: ProfileDraft = { ...draft, interests: ['Cooking', 'Travel'] };
    const req = profileDraftToRegenerateRequest(edited, 'rec_123', doc);
    expect(req.input.interests).toEqual(['Cooking', 'Travel']);
  });

  it('folds vibes into the freeform field with an em-dash separator', () => {
    const edited: ProfileDraft = {
      ...draft,
      moreAbout: 'Likes long walks',
      vibes: ['Cozy', 'Practical'],
    };
    const req = profileDraftToRegenerateRequest(edited, 'rec_123', doc);
    expect(req.input.freeform).toBe('Likes long walks — Cozy, Practical');
  });

  it('emits only the vibes when freeform is empty', () => {
    const edited: ProfileDraft = { ...draft, moreAbout: '', vibes: ['Cozy'] };
    const req = profileDraftToRegenerateRequest(edited, 'rec_123', doc);
    expect(req.input.freeform).toBe('Cozy');
  });

  it('translates draft relationship + gender display strings back to schema enums', () => {
    const edited: ProfileDraft = { ...draft, relationship: 'Friend', gender: 'male' };
    const req = profileDraftToRegenerateRequest(edited, 'rec_123', doc);
    expect(req.recipient.relationship).toBe('FRIEND');
    expect(req.recipient.gender).toBe('MALE');
  });

  // bug #51 follow-up: re-running for a different person via the drawer should
  // update the header name to match the new relationship by default.
  describe('auto-rename when relationship changes', () => {
    it('renames the recipient to the new relationship label when user did not type a name', () => {
      const edited: ProfileDraft = { ...draft, relationship: 'Sister' };
      // draft.name is unchanged from snap.name ("Mom") — user only changed
      // the relationship dropdown.
      const req = profileDraftToRegenerateRequest(edited, 'rec_123', doc);
      expect(req.recipient.relationship).toBe('SISTER');
      expect(req.recipient.name).toBe('Sister');
    });

    it('respects an explicit name change in the same edit session', () => {
      const edited: ProfileDraft = { ...draft, relationship: 'Sister', name: 'Janet' };
      const req = profileDraftToRegenerateRequest(edited, 'rec_123', doc);
      expect(req.recipient.relationship).toBe('SISTER');
      expect(req.recipient.name).toBe('Janet');
    });

    it('does not rename when only the name changed (relationship unchanged)', () => {
      const edited: ProfileDraft = { ...draft, name: 'Mama' };
      const req = profileDraftToRegenerateRequest(edited, 'rec_123', doc);
      expect(req.recipient.name).toBe('Mama');
    });

    it('does not rename when nothing changed', () => {
      const req = profileDraftToRegenerateRequest(draft, 'rec_123', doc);
      expect(req.recipient.name).toBe('Mom');
    });

    it('handles "Me!" -> Sister transition by renaming away from "Me!"', () => {
      const meDoc = {
        ...doc,
        recipientSnapshot: { ...doc.recipientSnapshot, name: 'Me!', relationship: 'OTHER' as const, isMe: true },
      } as Recommendation;
      const meDraft: ProfileDraft = {
        ...draft,
        name: 'Me!',
        relationship: 'Sister',
      };
      const req = profileDraftToRegenerateRequest(meDraft, 'rec_123', meDoc);
      expect(req.recipient.name).toBe('Sister');
    });
  });
});

describe('isProfileDraftComplete (bug #51 quiz validation)', () => {
  const complete: ProfileDraft = {
    emoji: '🌷',
    name: 'Mom',
    gender: 'female',
    relationship: 'Mom',
    age: 55,
    occasion: 'Just because',
    priceMin: 25,
    priceMax: 200,
    interests: ['Books', 'Travel'],
    vibes: [],
    moreAbout: '',
  };

  it('true when all required fields are set + ≥2 interests', () => {
    expect(isProfileDraftComplete(complete)).toBe(true);
  });

  it.each([
    ['relationship', undefined],
    ['gender', undefined],
    ['age', undefined],
    ['occasion', ''],
  ] as const)('false when %s is empty/undefined', (field, value) => {
    const draft: ProfileDraft = { ...complete, [field]: value as never };
    expect(isProfileDraftComplete(draft)).toBe(false);
  });

  it('false with 0 interests', () => {
    expect(isProfileDraftComplete({ ...complete, interests: [] })).toBe(false);
  });

  it('false with exactly 1 interest', () => {
    expect(isProfileDraftComplete({ ...complete, interests: ['Books'] })).toBe(false);
  });

  it('true with exactly 2 interests', () => {
    expect(isProfileDraftComplete({ ...complete, interests: ['Books', 'Travel'] })).toBe(true);
  });

  it('vibes are NOT required (parity with quiz submit gate)', () => {
    expect(isProfileDraftComplete({ ...complete, vibes: [] })).toBe(true);
  });

  it('moreAbout (freeform) is NOT required', () => {
    expect(isProfileDraftComplete({ ...complete, moreAbout: '' })).toBe(true);
  });
});

describe('isAlgoDirty array set-equality (bug #51 net-zero)', () => {
  const initial = {
    emoji: '🌷', name: 'Mom', gender: 'female', relationship: 'Mom', age: 55,
    occasion: 'Just because', priceMin: 25, priceMax: 200,
    interests: ['Books', 'Travel'], vibes: [], moreAbout: '',
  } as ProfileDraft;

  it('returns false when array elements are reordered without change', () => {
    const reordered: ProfileDraft = { ...initial, interests: ['Travel', 'Books'] };
    expect(isAlgoDirty(initial, reordered)).toBe(false);
  });

  it('returns true when an item is added', () => {
    const added: ProfileDraft = { ...initial, interests: ['Books', 'Travel', 'Cooking'] };
    expect(isAlgoDirty(initial, added)).toBe(true);
  });

  it('returns true when an item is replaced', () => {
    const replaced: ProfileDraft = { ...initial, interests: ['Books', 'Cooking'] };
    expect(isAlgoDirty(initial, replaced)).toBe(true);
  });
});
