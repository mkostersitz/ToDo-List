import { calculateStreak, isStreakBroken, getStreakAtRisk, applyGraceSkip } from '../streakEngine';
import type { Habit, HabitLog } from '../../../shared/types';

const habit: Habit = { id: 'h1', name: 'Run', frequency: 'daily', createdAt: '2024-01-01T00:00:00Z' };

function makeLog(date: string, status: HabitLog['status']): HabitLog {
  return { id: `log-${date}`, habitId: 'h1', date, status, loggedAt: date + 'T12:00:00Z', source: 'tap' };
}

describe('calculateStreak', () => {
  test('streak increments on done logs', () => {
    const logs = [makeLog('2024-01-03', 'done'), makeLog('2024-01-02', 'done'), makeLog('2024-01-01', 'done')];
    const streak = calculateStreak(logs, habit);
    expect(streak.currentStreak).toBe(3);
  });

  test('single skip does not break streak (grace skip)', () => {
    const logs = [makeLog('2024-01-03', 'done'), makeLog('2024-01-02', 'skip'), makeLog('2024-01-01', 'done')];
    const streak = calculateStreak(logs, habit);
    expect(streak.currentStreak).toBeGreaterThan(0);
  });

  test('two consecutive skips break the streak', () => {
    const logs = [makeLog('2024-01-04', 'done'), makeLog('2024-01-03', 'skip'), makeLog('2024-01-02', 'skip'), makeLog('2024-01-01', 'done')];
    const streak = calculateStreak(logs, habit);
    expect(streak.currentStreak).toBe(1);
  });

  test('returns 0 streak for no logs', () => {
    const streak = calculateStreak([], habit);
    expect(streak.currentStreak).toBe(0);
  });

  test('only counts logs for the correct habit', () => {
    const otherLog = { ...makeLog('2024-01-03', 'done'), habitId: 'other' };
    const streak = calculateStreak([otherLog], habit);
    expect(streak.currentStreak).toBe(0);
  });
});

describe('isStreakBroken', () => {
  test('returns false if completed today', () => {
    const today = '2024-01-10';
    const streak = { habitId: 'h1', currentStreak: 5, longestStreak: 5, lastCompletedDate: today };
    expect(isStreakBroken(streak, today, habit)).toBe(false);
  });

  test('returns true if last completed 3+ days ago', () => {
    const streak = { habitId: 'h1', currentStreak: 5, longestStreak: 5, lastCompletedDate: '2024-01-05' };
    expect(isStreakBroken(streak, '2024-01-10', habit)).toBe(true);
  });
});

describe('getStreakAtRisk', () => {
  const habitWithReminder: Habit = { ...habit, reminderTime: '08:00' };
  const streak = { habitId: 'h1', currentStreak: 5, longestStreak: 5, lastCompletedDate: '2024-01-09' };

  test('returns true when past reminder time and not completed today', () => {
    const now = new Date('2024-01-10T10:00:00');
    expect(getStreakAtRisk(streak, habitWithReminder, now)).toBe(true);
  });

  test('returns false when before reminder time', () => {
    const now = new Date('2024-01-10T06:00:00');
    expect(getStreakAtRisk(streak, habitWithReminder, now)).toBe(false);
  });

  test('returns false when no reminder time set', () => {
    const now = new Date('2024-01-10T10:00:00');
    expect(getStreakAtRisk(streak, habit, now)).toBe(false);
  });
});

describe('applyGraceSkip', () => {
  test('returns true when last log is skip and previous is done', () => {
    const logs = [makeLog('2024-01-02', 'skip'), makeLog('2024-01-01', 'done')];
    expect(applyGraceSkip(logs, habit)).toBe(true);
  });

  test('returns false when last two are both skip', () => {
    const logs = [makeLog('2024-01-02', 'skip'), makeLog('2024-01-01', 'skip')];
    expect(applyGraceSkip(logs, habit)).toBe(false);
  });
});
