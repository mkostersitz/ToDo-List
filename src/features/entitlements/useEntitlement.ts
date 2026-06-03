import { useEntitlementStore } from './entitlementStore';
import type { EntitlementTier } from './types';
import { TIER_FEATURES } from './types';

interface UseEntitlementResult {
  hasAccess: boolean;
  requiredTier: EntitlementTier;
}

export function useEntitlement(featureKey: string): UseEntitlementResult {
  const hasAccess = useEntitlementStore((s) => s.hasFeature(featureKey));
  const requiredTier: EntitlementTier = TIER_FEATURES[featureKey] ?? 'free';
  return { hasAccess, requiredTier };
}
