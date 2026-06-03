import { useEntitlementStore } from '../entitlementStore';

// Reset store between tests
function getStore() {
  return useEntitlementStore.getState();
}

beforeEach(() => {
  useEntitlementStore.setState({ tier: 'free', isDevMode: false });
});

describe('entitlementStore — free tier', () => {
  it('voice-checkin is accessible on free tier', () => {
    expect(getStore().hasFeature('voice-checkin')).toBe(true);
  });

  it('streaks is accessible on free tier', () => {
    expect(getStore().hasFeature('streaks')).toBe(true);
  });

  it('habit-crud is accessible on free tier', () => {
    expect(getStore().hasFeature('habit-crud')).toBe(true);
  });

  it('pattern-coaching is NOT accessible on free tier', () => {
    expect(getStore().hasFeature('pattern-coaching')).toBe(false);
  });

  it('unlimited-habits is NOT accessible on free tier', () => {
    expect(getStore().hasFeature('unlimited-habits')).toBe(false);
  });

  it('priority-model-updates is NOT accessible on free tier', () => {
    expect(getStore().hasFeature('priority-model-updates')).toBe(false);
  });

  it('unknown feature returns false', () => {
    expect(getStore().hasFeature('nonexistent-feature')).toBe(false);
  });
});

describe('entitlementStore — ads-removed tier', () => {
  beforeEach(() => {
    useEntitlementStore.setState({ tier: 'ads-removed', isDevMode: false });
  });

  it('free features are accessible', () => {
    expect(getStore().hasFeature('voice-checkin')).toBe(true);
    expect(getStore().hasFeature('streaks')).toBe(true);
  });

  it('unlimited-habits is accessible', () => {
    expect(getStore().hasFeature('unlimited-habits')).toBe(true);
  });

  it('weekly-summary-basic is accessible', () => {
    expect(getStore().hasFeature('weekly-summary-basic')).toBe(true);
  });

  it('pattern-coaching is NOT accessible', () => {
    expect(getStore().hasFeature('pattern-coaching')).toBe(false);
  });
});

describe('entitlementStore — pro tier', () => {
  beforeEach(() => {
    useEntitlementStore.setState({ tier: 'pro', isDevMode: false });
  });

  it('all pro features are accessible', () => {
    expect(getStore().hasFeature('pattern-coaching')).toBe(true);
    expect(getStore().hasFeature('ambient-reminders')).toBe(true);
    expect(getStore().hasFeature('weekly-debrief-full')).toBe(true);
    expect(getStore().hasFeature('shared-habits')).toBe(true);
  });

  it('free and ads-removed features are accessible', () => {
    expect(getStore().hasFeature('voice-checkin')).toBe(true);
    expect(getStore().hasFeature('unlimited-habits')).toBe(true);
  });

  it('lifetime features are NOT accessible', () => {
    expect(getStore().hasFeature('priority-model-updates')).toBe(false);
    expect(getStore().hasFeature('founding-user-badge')).toBe(false);
  });
});

describe('entitlementStore — lifetime tier', () => {
  beforeEach(() => {
    useEntitlementStore.setState({ tier: 'lifetime', isDevMode: false });
  });

  it('all features including pro are accessible', () => {
    expect(getStore().hasFeature('pattern-coaching')).toBe(true);
    expect(getStore().hasFeature('ambient-reminders')).toBe(true);
    expect(getStore().hasFeature('weekly-debrief-full')).toBe(true);
    expect(getStore().hasFeature('shared-habits')).toBe(true);
  });

  it('lifetime features are accessible', () => {
    expect(getStore().hasFeature('priority-model-updates')).toBe(true);
    expect(getStore().hasFeature('founding-user-badge')).toBe(true);
  });
});

describe('entitlementStore — dev mode', () => {
  beforeEach(() => {
    useEntitlementStore.setState({ tier: 'free', isDevMode: true });
  });

  it('all features return true in dev mode regardless of tier', () => {
    expect(getStore().hasFeature('pattern-coaching')).toBe(true);
    expect(getStore().hasFeature('priority-model-updates')).toBe(true);
    expect(getStore().hasFeature('founding-user-badge')).toBe(true);
    expect(getStore().hasFeature('nonexistent-feature')).toBe(true);
  });
});

describe('entitlementStore — setTier', () => {
  it('correctly updates tier from free to pro', () => {
    expect(getStore().tier).toBe('free');
    getStore().setTier('pro');
    expect(getStore().tier).toBe('pro');
  });

  it('correctly updates tier from pro to lifetime', () => {
    useEntitlementStore.setState({ tier: 'pro' });
    getStore().setTier('lifetime');
    expect(getStore().tier).toBe('lifetime');
  });

  it('correctly updates tier to ads-removed', () => {
    getStore().setTier('ads-removed');
    expect(getStore().tier).toBe('ads-removed');
  });
});
