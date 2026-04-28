import { ADULT_AGE_CHIPS } from '../constants';
import { ADULT_AGE_BUCKETS } from '../../results/constants';

/**
 * Regression tests for adult age options across the two surfaces that
 * render them: the quiz step (ADULT_AGE_CHIPS) and the results-page
 * side edit drawer (ADULT_AGE_BUCKETS). Both surfaces must stay in
 * sync — the same recipient should see the same labels in both places.
 *
 * Bug #5: Users shopping for someone 70+ had no fitting chip — the top
 * chip was labeled "70s" which read as "exactly 70-79." Relabeled to
 * "70s+" (value=75) so it covers 70-99 without changing the backend
 * payload (`age` integer field). Applied in both surfaces.
 *
 * Bug #8: The 60s and 70s chips on the quiz used flower emoji (🌸, 🌺)
 * that read as feminine, alienating users shopping for
 * fathers/grandfathers in those brackets. Replaced with gender-neutral
 * nature emoji (🌳, 🌲) that extend the existing growth metaphor
 * (sprout → plant → herb → ...). Quiz-only — the side drawer's
 * ADULT_AGE_BUCKETS doesn't carry emoji.
 */
describe('ADULT_AGE_CHIPS (quiz step)', () => {
  it('exposes a 70s+ chip as the top option with age value 75', () => {
    const top = ADULT_AGE_CHIPS[ADULT_AGE_CHIPS.length - 1];
    expect(top.label).toBe('70s+');
    expect(top.value).toBe(75);
  });

  it('uses gender-neutral nature emoji for 60s and 70s+ (no flowers)', () => {
    const sixties = ADULT_AGE_CHIPS.find((c) => c.label === '60s');
    const seventiesPlus = ADULT_AGE_CHIPS.find((c) => c.label === '70s+');
    expect(sixties?.emoji).toBe('🌳');
    expect(seventiesPlus?.emoji).toBe('🌲');
    // Belt-and-suspenders: ensure no flower emoji slip back in.
    const flowers = ['🌸', '🌺', '🌷', '🌹', '🌼'];
    expect(flowers).not.toContain(sixties?.emoji);
    expect(flowers).not.toContain(seventiesPlus?.emoji);
  });

  it('keeps all six adult age chips with unique values and labels', () => {
    expect(ADULT_AGE_CHIPS).toHaveLength(6);
    const values = ADULT_AGE_CHIPS.map((c) => c.value);
    const labels = ADULT_AGE_CHIPS.map((c) => c.label);
    expect(new Set(values).size).toBe(values.length);
    expect(new Set(labels).size).toBe(labels.length);
  });
});

describe('ADULT_AGE_BUCKETS (results-page side drawer)', () => {
  it('exposes a 70s+ bucket as the top option with age value 75', () => {
    const top = ADULT_AGE_BUCKETS[ADULT_AGE_BUCKETS.length - 1];
    expect(top.label).toBe('70s+');
    expect(top.value).toBe(75);
  });

  it('label/value parity with ADULT_AGE_CHIPS so the same recipient sees the same options on both surfaces', () => {
    const chipPairs = ADULT_AGE_CHIPS.map(({ value, label }) => ({ value, label }));
    const bucketPairs = ADULT_AGE_BUCKETS.map(({ value, label }) => ({ value, label }));
    expect(bucketPairs).toEqual(chipPairs);
  });
});
