import { STREAK_MILESTONES } from '../../shared/constants';
export { STREAK_MILESTONES };

export function checkMilestone(newStreak: number): number | null {
  return (STREAK_MILESTONES as readonly number[]).includes(newStreak) ? newStreak : null;
}

export function getMilestoneMessage(milestone: number, habitName: string): string {
  const messages: Record<number, string> = {
    3: `3 days of ${habitName} — a great start!`,
    7: `One full week of ${habitName}. Keep going!`,
    14: `Two weeks strong on ${habitName}!`,
    21: `21 days — ${habitName} is becoming a habit.`,
    30: `30-day streak on ${habitName}. Incredible!`,
    60: `60 days of ${habitName}. You are unstoppable!`,
    90: `90 days of ${habitName}. Elite consistency.`,
    180: `Half a year of ${habitName}. Legendary.`,
    365: `365 days of ${habitName}. A full year!`,
  };
  return messages[milestone] ?? `${milestone}-day streak on ${habitName}!`;
}
