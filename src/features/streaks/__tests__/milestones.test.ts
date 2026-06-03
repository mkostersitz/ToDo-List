import { checkMilestone, getMilestoneMessage, STREAK_MILESTONES } from '../milestones';

describe('checkMilestone', () => {
  test.each([3, 7, 14, 21, 30, 60, 90, 180, 365])('triggers at %i days', (days) => {
    expect(checkMilestone(days)).toBe(days);
  });

  test.each([1, 2, 4, 5, 6, 8, 15, 100])('returns null for non-milestone %i', (days) => {
    expect(checkMilestone(days)).toBeNull();
  });

  test('covers all 9 milestones', () => {
    expect(STREAK_MILESTONES).toHaveLength(9);
  });
});

describe('getMilestoneMessage', () => {
  test.each([3, 7, 14, 21, 30, 60, 90, 180, 365])('returns message for milestone %i', (days) => {
    const msg = getMilestoneMessage(days, 'running');
    expect(msg).toBeTruthy();
    expect(typeof msg).toBe('string');
    expect(msg.length).toBeGreaterThan(5);
  });
});
