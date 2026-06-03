import { checkMilestone, getMilestoneMessage, STREAK_MILESTONES } from '../milestones';

describe('checkMilestone', () => {
  test.each([3,7,14,21,30,60,90,180,365])('triggers at %i', d => { expect(checkMilestone(d)).toBe(d); });
  test.each([1,2,4,5,6,8,15,100])('null for non-milestone %i', d => { expect(checkMilestone(d)).toBeNull(); });
  test('covers all 9 milestones', () => { expect(STREAK_MILESTONES).toHaveLength(9); });
});

describe('getMilestoneMessage', () => {
  test.each([3,7,14,21,30,60,90,180,365])('message for %i', d => {
    const msg = getMilestoneMessage(d, 'running');
    expect(typeof msg).toBe('string');
    expect(msg.length).toBeGreaterThan(5);
  });
});
