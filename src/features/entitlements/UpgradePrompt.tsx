import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { EntitlementTier } from './types';
import { TIER_FEATURES } from './types';

interface UpgradePromptProps {
  featureKey: string;
  onDismiss: () => void;
}

const TIER_PRICES: Record<EntitlementTier, string> = {
  'free': 'Free',
  'ads-removed': '$1.99',
  'pro': '$4.99/mo',
  'lifetime': '$49.99',
};

export default function UpgradePrompt({ featureKey, onDismiss }: UpgradePromptProps) {
  const requiredTier: EntitlementTier = TIER_FEATURES[featureKey] ?? 'free';
  const price = TIER_PRICES[requiredTier];

  return (
    <View style={styles.container} accessibilityLabel="Upgrade prompt">
      <Text style={styles.featureName} accessibilityLabel={`Feature: ${featureKey}`}>
        {featureKey}
      </Text>
      <Text style={styles.tierLabel} accessibilityLabel={`Required tier: ${requiredTier}`}>
        Requires {requiredTier} tier
      </Text>
      <Text style={styles.price} accessibilityLabel={`Price: ${price}`}>
        {price}
      </Text>
      <Pressable
        style={styles.upgradeButton}
        accessibilityLabel={`Upgrade to ${requiredTier}`}
        accessibilityRole="button"
        onPress={() => {
          // Upgrade flow — handled by the caller
        }}
      >
        <Text style={styles.upgradeButtonText}>Upgrade to {requiredTier}</Text>
      </Pressable>
      <Pressable
        style={styles.dismissButton}
        accessibilityLabel="Dismiss upgrade prompt"
        accessibilityRole="button"
        onPress={onDismiss}
      >
        <Text style={styles.dismissButtonText}>Not now</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    gap: 12,
  },
  featureName: { fontSize: 18, fontWeight: 'bold' },
  tierLabel: { fontSize: 14, color: '#666' },
  price: { fontSize: 22, fontWeight: '700', color: '#4F46E5' },
  upgradeButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  upgradeButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  dismissButton: { paddingVertical: 8 },
  dismissButtonText: { color: '#999', fontSize: 14 },
});
