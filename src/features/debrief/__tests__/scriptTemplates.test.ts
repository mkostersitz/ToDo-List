import { getMode, getTemplates } from '../scriptTemplates';
import type { WeekStats } from '../types';

const baseStats: WeekStats = {
  totalHabits: 5,
  completedHabits: 4,
  completionRate: 0.8,
  dataWeeks: 4,
};

describe('getMode', () => {
  test('≥85% → strong', () => expect(getMode(0.85)).toBe('strong'));
  test('100% → strong', () => expect(getMode(1.0)).toBe('strong'));
  test('50% → solid', () => expect(getMode(0.5)).toBe('solid'));
  test('84% → solid', () => expect(getMode(0.84)).toBe('solid'));
  test('25% → rough', () => expect(getMode(0.25)).toBe('rough'));
  test('49% → rough', () => expect(getMode(0.49)).toBe('rough'));
  test('0% → slip', () => expect(getMode(0)).toBe('slip'));
  test('24% → slip', () => expect(getMode(0.24)).toBe('slip'));
});

describe('getTemplates', () => {
  const modes = ['strong', 'solid', 'rough', 'slip'] as const;
  const langs = ['en', 'de', 'es'] as const;

  for (const mode of modes) {
    for (const lang of langs) {
      test(`${mode}/${lang} templates render without error`, () => {
        const t = getTemplates(mode, lang);
        expect(typeof t.opening(baseStats)).toBe('string');
        expect(typeof t.data(baseStats)).toBe('string');
        expect(typeof t.close(baseStats)).toBe('string');
        expect(t.opening(baseStats).length).toBeGreaterThan(5);
        expect(t.data(baseStats).length).toBeGreaterThan(5);
        expect(t.close(baseStats).length).toBeGreaterThan(5);
      });
    }
  }
});
