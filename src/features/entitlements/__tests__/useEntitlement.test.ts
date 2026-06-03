import { useEntitlementStore } from '../entitlementStore';
import { TIER_FEATURES } from '../types';
import type { EntitlementTier } from '../types';

// Test the entitlement logic directly via the store (same logic as useEntitlement hook)
function checkEntitlement(featureKey: string): { hasAccess: boolean; requiredTier: EntitlementTier } {
  const hasAccess = useEntitlementStore.getState().hasFeature(featureKey);
  const requiredTier: EntitlementTier = TIER_FEATURES[featureKey] ?? 'free';
  return { hasAccess, requiredTier };
}

beforeEach(() => {
  useEntitlementStore.setState({ tier: 'free', isDevMode: false });
});

describe('useEntitlement — free tier', () => {
  it('returns hasAccess:true for a free feature', () => {
    const result = checkEntitlement('voice-checkin');
    expect(result.hasAccess).toBe(true);
    expect(result.requiredTier).toBe('free');
  });

  it('returns hasAccess:false for a pro feature', () => {
    const result = checkEntitlement('pattern-coaching');
    expect(result.hasAccess).toBe(false);
    expect(result.requiredTier).toBe('pro');
  });

  it('returns hasAccess:false for an ads-removed feature', () => {
    const result = checkEntitlement('unlimited-habits');
    expect(result.hasAccess).toBe(false);
    expect(result.requiredTier).toBe('ads-removed');
  });

  it('returns hasAccess:false for a lifetime feature', () => {
    const result = checkEntitlement('priority-model-updates');
    expect(result.hasAccess).toBe(false);
    expect(result.requiredTier).toBe('lifetime');
  });
});

describe('useEntitlement — pro tier', () => {
  beforeEach(() => {
    useEntitlementStore.setState({ tier: 'pro', isDevMode: false });
  });

  it('returns hasAccess:true for pro feature', () => {
    const result = checkEntitlement('pattern-coaching');
    expect(result.hasAccess).toBe(true);
    expect(result.requiredTier).toBe('pro');
  });

  it('returns hasAccess:true for free feature', () => {
    const result = checkEntitlement('streaks');
    expect(result.hasAccess).toBe(true);
    expect(result.requiredTier).toBe('free');
  });

  it('returns hasAccess:false for lifetime feature', () => {
    const result = checkEntitlement('founding-user-badge');
    expect(result.hasAccess).toBe(false);
    expect(result.requiredTier).toBe('lifetime');
  });
});

describe('useEntitlement — lifetime tier', () => {
  beforeEach(() => {
    useEntitlementStore.setState({ tier: 'lifetime', isDevMode: false });
  });

  it('returns hasAccess:true for lifetime feature', () => {
    const result = checkEntitlement('priority-model-updates');
    expect(result.hasAccess).toBe(true);
    expect(result.requiredTier).toBe('lifetime');
  });

  it('returns hasAccess:true for pro feature', () => {
    const result = checkEntitlement('weekly-debrief-full');
    expect(result.hasAccess).toBe(true);
    expect(result.requiredTier).toBe('pro');
  });
});

describe('useEntitlement — unknown feature', () => {
  it('returns hasAccess:false and requiredTier:free for unknown feature key', () => {
    const result = checkEntitlement('not-a-real-feature');
    expect(result.hasAccess).toBe(false);
    expect(result.requiredTier).toBe('free');
  });
});
