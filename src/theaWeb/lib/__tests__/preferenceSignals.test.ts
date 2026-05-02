import {
  buildPreferenceSignals,
  PREFERENCE_TITLE_CAP,
  PREFERENCE_ID_CAP,
} from '../preferenceSignals';
import type { GiftActivityDetail } from '../../hooks/useGiftActivities';

const detail = (id: string, title: string, brand?: string): GiftActivityDetail =>
  brand ? { id, title, brand } : { id, title };

describe('buildPreferenceSignals', () => {
  it('returns empty arrays when all sources are empty', () => {
    const out = buildPreferenceSignals([], [], []);
    expect(out.likedProductTitles).toEqual([]);
    expect(out.dismissedProductTitles).toEqual([]);
    expect(out.excludedProductIds).toEqual([]);
  });

  it('combines saved + purchased into the positive title signal', () => {
    const out = buildPreferenceSignals(
      [detail('s1', 'Saved one'), detail('s2', 'Saved two')],
      [],
      [detail('p1', 'Bought one')],
    );
    // Order: liked first, then purchased — matches the contract that the BE
    // sees a single `liked_product_titles` list as positive signal.
    expect(out.likedProductTitles).toEqual(['Saved one', 'Saved two', 'Bought one']);
  });

  it('keeps dismissed titles isolated to dismissedProductTitles', () => {
    const out = buildPreferenceSignals(
      [detail('s1', 'Saved')],
      [detail('d1', 'Dismissed')],
      [detail('p1', 'Bought')],
    );
    expect(out.dismissedProductTitles).toEqual(['Dismissed']);
    // Saved + bought go to liked, NOT dismissed.
    expect(out.likedProductTitles).not.toContain('Dismissed');
  });

  it('hard-excludes saved AND dismissed AND purchased product ids', () => {
    // Once the user has acted on a product (heart, X, or buy), don't show
    // it again on the next regenerate — saved items live in the Saved tab,
    // dismissed are explicitly rejected, and purchased shouldn't be
    // re-recommended.
    const out = buildPreferenceSignals(
      [detail('s1', 'Saved')],
      [detail('d1', 'Dismissed')],
      [detail('p1', 'Bought')],
    );
    expect(out.excludedProductIds).toEqual(['s1', 'd1', 'p1']);
  });

  it('drops entries with empty titles from title lists', () => {
    const out = buildPreferenceSignals(
      [detail('s1', ''), detail('s2', 'Real')],
      [detail('d1', '')],
      [detail('p1', '')],
    );
    expect(out.likedProductTitles).toEqual(['Real']);
    expect(out.dismissedProductTitles).toEqual([]);
  });

  it('still excludes ids even when titles are empty (id-only signal still useful)', () => {
    // A snapshot doc may exist with no productSnapshot.title — the id is
    // still authoritative for hard exclusion. We must NOT silently drop the
    // exclusion just because the title is missing.
    const out = buildPreferenceSignals(
      [detail('s1', '')],
      [detail('d1', '')],
      [detail('p1', '')],
    );
    expect(out.excludedProductIds).toEqual(['s1', 'd1', 'p1']);
  });

  it('caps title lists at PREFERENCE_TITLE_CAP', () => {
    const many: GiftActivityDetail[] = Array.from({ length: 25 }, (_, i) =>
      detail(`l${i}`, `liked-${i}`),
    );
    const dismissed: GiftActivityDetail[] = Array.from({ length: 25 }, (_, i) =>
      detail(`d${i}`, `dismissed-${i}`),
    );
    const out = buildPreferenceSignals(many, dismissed, []);
    expect(out.likedProductTitles).toHaveLength(PREFERENCE_TITLE_CAP);
    expect(out.dismissedProductTitles).toHaveLength(PREFERENCE_TITLE_CAP);
  });

  it('caps excluded ids at PREFERENCE_ID_CAP', () => {
    const liked: GiftActivityDetail[] = Array.from({ length: 30 }, (_, i) =>
      detail(`s${i}`, `t-${i}`),
    );
    const dismissed: GiftActivityDetail[] = Array.from({ length: 30 }, (_, i) =>
      detail(`d${i}`, `t-${i}`),
    );
    const purchased: GiftActivityDetail[] = Array.from({ length: 30 }, (_, i) =>
      detail(`p${i}`, `t-${i}`),
    );
    const out = buildPreferenceSignals(liked, dismissed, purchased);
    expect(out.excludedProductIds).toHaveLength(PREFERENCE_ID_CAP);
    // Liked entries come first in the concat order — saved → dismissed →
    // purchased — so the first entry should be from the saved set.
    expect(out.excludedProductIds[0]).toBe('s0');
  });

  it('preserves brand field upstream but only emits titles+ids downstream', () => {
    const out = buildPreferenceSignals(
      [detail('s1', 'Brand product', 'AcmeCo')],
      [],
      [],
    );
    expect(out.likedProductTitles).toEqual(['Brand product']);
    // Brand isn't part of the wire contract — it would just be noise to the
    // BE today. If we ever surface brand-level signal, this test should
    // change to encode that contract.
  });
});
