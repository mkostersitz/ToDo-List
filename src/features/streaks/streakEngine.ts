import type { Habit, HabitLog, Streak } from '../../shared/types';

export function calculateStreak(logs: HabitLog[], habit: Habit): Streak {
  const sorted = [...logs]
    .filter(l => l.habitId === habit.id)
    .sort((a, b) => b.date.localeCompare(a.date));

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
  const last = new Date(streak.lastCompletedDate);
  const now = new Date(today);
  const diffDays = Math.floor((now.getTime() - last.getTime()) / 86400000);
  return diffDays > 2;
}

export function getStreakAtRisk(streak: Streak, habit: Habit, now: Date): boolean {
  if (!habit.reminderTime) return false;
  const [hours, minutes] = habit.reminderTime.split(':').map(Number);
  const reminderToday = new Date(now);
  reminderToday.setHours(hours, minutes, 0, 0);
  if (now < reminderToday) return false;
  const today = now.toISOString().slice(0, 10);
  return streak.lastCompletedDate !== today;
}

export function applyGraceSkip(logs: HabitLog[], habit: Habit): boolean {
  const habitLogs = [...logs]
    .filter(l => l.habitId === habit.id)
    .sort((a, b) => b.date.localeCompare(a.date));
  if (habitLogs.length < 2) return false;
  return habitLogs[0].status === 'skip' && habitLogs[1].status === 'done';
}
