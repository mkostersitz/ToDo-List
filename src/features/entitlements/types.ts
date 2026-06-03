export type EntitlementTier = 'free' | 'ads-removed' | 'pro' | 'lifetime';

export interface EntitlementState {
  tier: EntitlementTier;
  isDevMode: boolean;
}

export const TIER_FEATURES: Record<string, EntitlementTier> = {
  'voice-checkin': 'free',
  'streaks': 'free',
  'habit-crud': 'free',
  'unlimited-habits': 'ads-removed',
  'weekly-summary-basic': 'ads-removed',
  'pattern-coaching': 'pro',
  'ambient-reminders': 'pro',
  'weekly-debrief-full': 'pro',
  'shared-habits': 'pro',
  'priority-model-updates': 'lifetime',
  'founding-user-badge': 'lifetime',
};

export const TIER_ORDER: EntitlementTier[] = ['free', 'ads-removed', 'pro', 'lifetime'];
