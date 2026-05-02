// Pure builder that shapes the recipient's prior gift activity into the
// generic preference primitives the carousel callable consumes. Lives in
// `lib/` rather than the page so it's covered by unit tests and reusable
// from any future surface (e.g. iOS, admin) that adopts the same contract.
//
// Combination logic:
// - liked_product_titles  ← SAVED + PURCHASED (positive signal; purchased
//                          counts because what the user already bought is a
//                          stronger preference than a heart click)
// - dismissed_product_titles ← DISMISSED only
// - excluded_product_ids ← SAVED + DISMISSED + PURCHASED. Once a user has
//                          taken any action on a product, don't show it
//                          again on the next regenerate — saved items
//                          already live in the Saved tab, so re-surfacing
//                          them in the recommended feed is just clutter.
//
// Each list is capped so the callable payload stays bounded. The id list
// runs at 3× the title cap because all three states can contribute
// independently and the BE only uses ids for hard exclusion (no prompt cost).

import type { GiftActivityDetail } from '../hooks/useGiftActivities';
import type { PreferenceSignals } from '../hooks/useRegenerate';

export const PREFERENCE_TITLE_CAP = 10;
export const PREFERENCE_ID_CAP = PREFERENCE_TITLE_CAP * 3;

export function buildPreferenceSignals(
  likedDetails: GiftActivityDetail[],
  dismissedDetails: GiftActivityDetail[],
  purchasedDetails: GiftActivityDetail[],
): PreferenceSignals {
  const likedProductTitles = [
    ...likedDetails.map((d) => d.title),
    ...purchasedDetails.map((d) => d.title),
  ]
    .filter((t): t is string => Boolean(t))
    .slice(0, PREFERENCE_TITLE_CAP);

  const dismissedProductTitles = dismissedDetails
    .map((d) => d.title)
    .filter((t): t is string => Boolean(t))
    .slice(0, PREFERENCE_TITLE_CAP);

  const excludedProductIds = [
    ...likedDetails.map((d) => d.id),
    ...dismissedDetails.map((d) => d.id),
    ...purchasedDetails.map((d) => d.id),
  ].slice(0, PREFERENCE_ID_CAP);

  return { likedProductTitles, dismissedProductTitles, excludedProductIds };
}
