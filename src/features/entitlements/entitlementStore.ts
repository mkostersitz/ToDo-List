import { create } from 'zustand';
import type { EntitlementTier, EntitlementState } from './types';
import { TIER_FEATURES, TIER_ORDER } from './types';

interface EntitlementStore extends EntitlementState {
  setTier: (tier: EntitlementTier) => void;
  hasFeature: (featureKey: string) => boolean;
}

const isDevMode = process.env['EXPO_PUBLIC_APP_ENV'] === 'development';

export const useEntitlementStore = create<EntitlementStore>((set, get) => ({
  tier: 'free',
  isDevMode,

  setTier: (tier: EntitlementTier) => set({ tier }),

  hasFeature: (featureKey: string): boolean => {
    const { tier, isDevMode: devMode } = get();
    if (devMode) return true;

    const requiredTier = TIER_FEATURES[featureKey];
    if (requiredTier === undefined) return false;

    const userTierIndex = TIER_ORDER.indexOf(tier);
    const requiredTierIndex = TIER_ORDER.indexOf(requiredTier);
    return userTierIndex >= requiredTierIndex;
  },
}));
