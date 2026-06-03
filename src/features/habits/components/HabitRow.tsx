import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { Habit, Streak } from '../types';

interface HabitRowProps {
  habit: Habit;
  streak?: Streak;
  onPress?: () => void;
}

export function HabitRow({ habit, streak, onPress }: HabitRowProps) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      accessibilityLabel={`${habit.name}, ${streak?.currentStreak ?? 0} day streak`}
      accessibilityRole="button"
    >
      <Text style={styles.name}>{habit.name}</Text>
      {streak && <Text style={styles.streak}>{streak.currentStreak} day streak</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  name: { fontSize: 16, fontWeight: '500' },
  streak: { fontSize: 14, color: '#FF6B35' },
});
