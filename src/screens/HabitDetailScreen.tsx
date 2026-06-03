import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'HabitDetail'>;

export default function HabitDetailScreen({ route }: Props) {
  const { habitId } = route.params;
  return (
    <View style={styles.container} accessibilityLabel="Habit detail screen">
      <Text style={styles.title}>HabitDetail</Text>
      <Text style={styles.subtitle} accessibilityLabel={`Habit ID: ${habitId}`}>
        {habitId}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { fontSize: 16, marginTop: 8 },
});
