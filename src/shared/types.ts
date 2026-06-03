export interface Habit {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly' | number;
  targetMetric?: { value: number; unit: string };
  reminderTime?: string;
  createdAt: string;
  archivedAt?: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  status: 'done' | 'skip' | 'partial';
  actualMetric?: { value: number; unit: string };
  skipReason?: string;
  loggedAt: string;
  source: 'voice' | 'tap';
}

export interface Streak {
  habitId: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string;
}

export type IntentType =
  | 'log-complete'
  | 'log-detail'
  | 'skip-with-reason'
  | 'habit-create'
  | 'habit-edit'
  | 'habit-delete'
  | 'status-query'
  | 'compound';

export type PatternType =
  | 'day-of-week'
  | 'sleep-performance'
  | 'streak-fragility'
  | 'skip-cascade'
  | 'time-of-day-drift'
  | 'habit-stacking';

export type EntitlementTier = 'free' | 'ads-removed' | 'pro' | 'lifetime';
