import { calculateStreak, isStreakBroken, getStreakAtRisk, applyGraceSkip } from '../streakEngine';
import type { Habit, HabitLog } from '../../../shared/types';

const habit: Habit = { id: 'h1', name: 'Run', frequency: 'daily', createdAt: '2024-01-01T00:00:00Z' };
const log = (date: string, status: HabitLog['status']): HabitLog =>
  ({ id: `l-${date}`, habitId: 'h1', date, status, loggedAt: `${date}T12:00:00Z`, source: 'tap' });

describe('calculateStreak', () => {
  test('increments on done logs', () => {
    expect(calculateStreak([log('2024-01-03','done'),log('2024-01-02','done'),log('2024-01-01','done')], habit).currentStreak).toBe(3);
  });
  test('one skip does not break streak', () => {
    const s = calculateStreak([log('2024-01-03','done'),log('2024-01-02','skip'),log('2024-01-01','done')], habit);
    expect(s.currentStreak).toBeGreaterThan(0);
  });
  test('two consecutive skips break streak', () => {
    const s = calculateStreak([log('2024-01-04','done'),log('2024-01-03','skip'),log('2024-01-02','skip'),log('2024-01-01','done')], habit);
    expect(s.currentStreak).toBe(1);
  });
  test('returns 0 for no logs', () => {
    expect(calculateStreak([], habit).currentStreak).toBe(0);
  });
  test('ignores logs for other habits', () => {
    const other = { ...log('2024-01-01','done'), habitId: 'other' };
    expect(calculateStreak([other], habit).currentStreak).toBe(0);
  });
});

describe('isStreakBroken', () => {
  test('false if completed today', () => {
    const s = { habitId:'h1', currentStreak:5, longestStreak:5, lastCompletedDate:'2024-01-10' };
    expect(isStreakBroken(s, '2024-01-10', habit)).toBe(false);
  });
  test('true if 3+ days since completion', () => {
    const s = { habitId:'h1', currentStreak:5, longestStreak:5, lastCompletedDate:'2024-01-05' };
    expect(isStreakBroken(s, '2024-01-10', habit)).toBe(true);
  });
});

describe('getStreakAtRisk', () => {
  const withReminder: Habit = { ...habit, reminderTime: '08:00' };
  const streak = { habitId:'h1', currentStreak:5, longestStreak:5, lastCompletedDate:'2024-01-09' };
  test('true when past reminder and not completed', () => {
    expect(getStreakAtRisk(streak, withReminder, new Date('2024-01-10T10:00:00'))).toBe(true);
  });
  test('false when before reminder time', () => {
    expect(getStreakAtRisk(streak, withReminder, new Date('2024-01-10T06:00:00'))).toBe(false);
  });
  test('false when no reminder set', () => {
    expect(getStreakAtRisk(streak, habit, new Date('2024-01-10T10:00:00'))).toBe(false);
  });
});

describe('applyGraceSkip', () => {
  test('true when last is skip and previous is done', () => {
    expect(applyGraceSkip([log('2024-01-02','skip'),log('2024-01-01','done')], habit)).toBe(true);
  });
  test('false when both are skips', () => {
    expect(applyGraceSkip([log('2024-01-02','skip'),log('2024-01-01','skip')], habit)).toBe(false);
  });
});
