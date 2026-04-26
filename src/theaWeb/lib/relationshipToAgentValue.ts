import type { TheaWebRelationshipEnum } from '../schemas';

// The /feed agent's RELATIONSHIP_CAROUSELS rules are keyed off a different
// vocabulary than theaWeb's recipient relationship enum. Map the closest
// theaWeb labels onto the agent's expected values; everything else falls
// back to FRIEND, which the agent treats as the generic case.
//
// Source for agent vocab: thea-serverless functions/common/carousel_config.py
//   ROMANTIC_PARTNER → Date Night carousel
//   PARENT, GRAND_PARENT → Sentimental carousel
const MAPPING: Partial<Record<TheaWebRelationshipEnum, string>> = {
  MOM: 'PARENT',
  DAD: 'PARENT',
  GRANDMA: 'GRAND_PARENT',
  GRANDPA: 'GRAND_PARENT',
  PARTNER: 'ROMANTIC_PARTNER',
};

export function relationshipToAgentValue(
  relationship: TheaWebRelationshipEnum,
): string {
  return MAPPING[relationship] ?? 'FRIEND';
}
