/**
 * Feature Flags Configuration
 *
 * Controls visibility of features that are in development or testing.
 * Set flags to false to hide features from production users.
 */

export const FEATURE_FLAGS = {
  /**
   * Life Arc page - comprehensive life event prediction
   * Currently in development - disable for production release
   */
  LIFE_ARC_ENABLED: false,

  /**
   * Birth Chart feature
   */
  BIRTH_CHART_ENABLED: true,
} as const;

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(flag: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[flag];
}
