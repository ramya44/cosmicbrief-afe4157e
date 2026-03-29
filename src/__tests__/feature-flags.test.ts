import { describe, it, expect } from 'vitest';
import { FEATURE_FLAGS, isFeatureEnabled } from '@/config/feature-flags';

describe('FEATURE_FLAGS', () => {
  it('has expected flag keys', () => {
    expect(FEATURE_FLAGS).toHaveProperty('LIFE_ARC_ENABLED');
    expect(FEATURE_FLAGS).toHaveProperty('BIRTH_CHART_ENABLED');
  });

  it('flags are booleans', () => {
    for (const value of Object.values(FEATURE_FLAGS)) {
      expect(typeof value).toBe('boolean');
    }
  });
});

describe('isFeatureEnabled', () => {
  it('returns boolean for known flags', () => {
    expect(typeof isFeatureEnabled('BIRTH_CHART_ENABLED')).toBe('boolean');
    expect(typeof isFeatureEnabled('LIFE_ARC_ENABLED')).toBe('boolean');
  });
});
