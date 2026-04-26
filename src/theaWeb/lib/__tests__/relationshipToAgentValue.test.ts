import { relationshipToAgentValue } from '../relationshipToAgentValue';

describe('relationshipToAgentValue', () => {
  test('parents map to PARENT', () => {
    expect(relationshipToAgentValue('MOM')).toBe('PARENT');
    expect(relationshipToAgentValue('DAD')).toBe('PARENT');
  });

  test('grandparents map to GRAND_PARENT', () => {
    expect(relationshipToAgentValue('GRANDMA')).toBe('GRAND_PARENT');
    expect(relationshipToAgentValue('GRANDPA')).toBe('GRAND_PARENT');
  });

  test('PARTNER maps to ROMANTIC_PARTNER', () => {
    expect(relationshipToAgentValue('PARTNER')).toBe('ROMANTIC_PARTNER');
  });

  test('unmapped relationships fall back to FRIEND', () => {
    expect(relationshipToAgentValue('FRIEND')).toBe('FRIEND');
    expect(relationshipToAgentValue('SISTER')).toBe('FRIEND');
    expect(relationshipToAgentValue('COWORKER')).toBe('FRIEND');
    expect(relationshipToAgentValue('OTHER')).toBe('FRIEND');
  });
});
