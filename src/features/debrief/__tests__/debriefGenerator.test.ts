import { generateDebrief, isDebriefDay, shouldAutoTrigger } from '../debriefGenerator';
import type { WeekStats } from '../types';

function makeStats(completionRate: number, dataWeeks = 4): WeekStats {
  const total = 5;
  return {
    totalHabits: total,
    completedHabits: Math.round(total * completionRate),
    completionRate,
    dataWeeks,
  };
}

describe('generateDebrief — all 4 modes', () => {
  test.each([
    ['strong', 0.9],
    ['solid', 0.65],
    ['rough', 0.35],
    ['slip', 0.1],
  ] as const)('%s mode at %.0f%%', (expectedMode, rate) => {
    const script = generateDebrief(makeStats(rate));
    expect(script.mode).toBe(expectedMode);
    expect(script.opening.length).toBeGreaterThan(5);
    expect(script.data.length).toBeGreaterThan(5);
    expect(script.close.length).toBeGreaterThan(5);
  });
});

describe('generateDebrief — character limit', () => {
  test('totalChars ≤ 600', () => {
    const script = generateDebrief(makeStats(0.8));
    expect(script.totalChars).toBeLessThanOrEqual(600);
  });

  test('all modes stay within 600 chars', () => {
    for (const rate of [0.9, 0.65, 0.35, 0.1]) {
      const script = generateDebrief(makeStats(rate));
      expect(script.totalChars).toBeLessThanOrEqual(600);
    }
  });
});

describe('generateDebrief — pattern and suggestion gating', () => {
  const mockInsight = {
    pattern: { type: 'skip-cascade' as const, confidence: 0.8, evidence: 'Skips cluster on Mondays.', affectedHabitIds: ['h1'] },
    suggestion: 'Would a rest day help?',
    weekNumber: 4,
  };

  test('pattern omitted when dataWeeks < 3', () => {
    const script = generateDebrief(makeStats(0.8, 2), 'en', mockInsight);
    expect(script.pattern).toBeNull();
  });

  test('pattern included when dataWeeks ≥ 3', () => {
    const script = generateDebrief(makeStats(0.8, 3), 'en', mockInsight);
    expect(script.pattern).not.toBeNull();
  });

  test('suggestion omitted when dataWeeks < 4', () => {
    const script = generateDebrief(makeStats(0.8, 3), 'en', mockInsight);
    expect(script.suggestion).toBeNull();
  });

  test('suggestion included when dataWeeks ≥ 4', () => {
    const script = generateDebrief(makeStats(0.8, 4), 'en', mockInsight);
    expect(script.suggestion).not.toBeNull();
  });
});

describe('generateDebrief — forbidden words', () => {
  test('output never contains "failed" as qualifier', () => {
    for (const rate of [0.9, 0.5, 0.3, 0.1]) {
      const script = generateDebrief(makeStats(rate));
      const full = [script.opening, script.data, script.close].join(' ');
      expect(/\bfailed\s+\d/.test(full)).toBe(false);
    }
  });
});

describe('generateDebrief — multilingual', () => {
  test('German debrief renders', () => {
    const script = generateDebrief(makeStats(0.8), 'de');
    expect(script.language).toBe('de');
    expect(script.opening.length).toBeGreaterThan(5);
  });

  test('Spanish debrief renders', () => {
    const script = generateDebrief(makeStats(0.6), 'es');
    expect(script.language).toBe('es');
    expect(script.opening.length).toBeGreaterThan(5);
  });
});

describe('debrief trigger logic', () => {
  test('Sunday is debrief day', () => {
    const sunday = new Date('2024-01-07T10:00:00');
    expect(isDebriefDay(sunday)).toBe(true);
  });

  test('Monday is not debrief day', () => {
    const monday = new Date('2024-01-08T10:00:00');
    expect(isDebriefDay(monday)).toBe(false);
  });

  test('auto-triggers after 18:00 on Sunday', () => {
    const sunday6pm = new Date('2024-01-07T18:00:00');
    expect(shouldAutoTrigger(sunday6pm)).toBe(true);
  });

  test('does not auto-trigger before 18:00 on Sunday', () => {
    const sunday5pm = new Date('2024-01-07T17:59:00');
    expect(shouldAutoTrigger(sunday5pm)).toBe(false);
  });

  test('does not auto-trigger on non-Sunday', () => {
    const saturday6pm = new Date('2024-01-06T18:00:00');
    expect(shouldAutoTrigger(saturday6pm)).toBe(false);
  });
});
