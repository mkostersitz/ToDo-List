import type { Habit, HabitLog, Streak } from '../../shared/types';

export function calculateStreak(logs: HabitLog[], habit: Habit): Streak {
  const sorted = [...logs].filter(l => l.habitId === habit.id).sort((a, b) => b.date.localeCompare(a.date));
  let currentStreak = 0;
  let longestStreak = 0;
  let lastCompletedDate = '';
  let consecutiveSkips = 0;
  for (const log of sorted) {
    if (log.status === 'done') {
      currentStreak++;
      consecutiveSkips = 0;
      if (!lastCompletedDate) lastCompletedDate = log.date;
    } else if (log.status === 'skip') {
      consecutiveSkips++;
      if (consecutiveSkips >= 2) break;
    }
  }
  longestStreak = Math.max(longestStreak, currentStreak);
  return { habitId: habit.id, currentStreak, longestStreak, lastCompletedDate };
}

export function isStreakBroken(streak: Streak, today: string, _habit: Habit): boolean {
  if (!streak.lastCompletedDate) return false;
  const diffDays = (new Date(today).getTime() - new Date(streak.lastCompletedDate).getTime()) / 86400000;
  return diffDays > 2;
}

export function getStreakAtRisk(streak: Streak, habit: Habit, now: Date): boolean {
  if (!habit.reminderTime) return false;
  const [h, m] = habit.reminderTime.split(':').map(Number);
  const reminder = new Date(now);
  reminder.setHours(h, m, 0, 0);
  if (now < reminder) return false;
  return streak.lastCompletedDate !== now.toISOString().slice(0, 10);
}

export function applyGraceSkip(logs: HabitLog[], habit: Habit): boolean {
  const sorted = [...logs].filter(l => l.habitId === habit.id).sort((a, b) => b.date.localeCompare(a.date));
  if (sorted.length < 2) return false;
  return sorted[0].status === 'skip' && sorted[1].status === 'done';
}
