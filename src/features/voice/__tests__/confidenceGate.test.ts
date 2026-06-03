import { getConfidenceLevel, evaluateConfidence } from '../confidenceGate';
import type { ParsedCheckIn } from '../types';

const base: ParsedCheckIn = {
  intent: 'log-complete',
  confidence: 0.9,
  confidenceLevel: 'high',
  entities: { habitName: 'run', rawText: 'done with run' },
  language: 'en',
  transcript: 'done with run',
};

describe('getConfidenceLevel', () => {
  test('≥ 0.85 is high', () => expect(getConfidenceLevel(0.85)).toBe('high'));
  test('≥ 0.60 is mid', () => expect(getConfidenceLevel(0.72)).toBe('mid'));
  test('< 0.60 is low', () => expect(getConfidenceLevel(0.45)).toBe('low'));
  test('exactly 0.85 is high', () => expect(getConfidenceLevel(0.85)).toBe('high'));
  test('exactly 0.60 is mid', () => expect(getConfidenceLevel(0.60)).toBe('mid'));
});

describe('evaluateConfidence', () => {
  test('high confidence → act', () => {
    const d = evaluateConfidence({ ...base, confidence: 0.9, confidenceLevel: 'high' });
    expect(d.action).toBe('act');
    expect(d.undoWindowMs).toBe(60_000);
  });

  test('mid confidence → confirm', () => {
    const d = evaluateConfidence({ ...base, confidence: 0.7, confidenceLevel: 'mid' });
    expect(d.action).toBe('confirm');
    expect(d.undoWindowMs).toBe(60_000);
  });

  test('low confidence → clarify', () => {
    const d = evaluateConfidence({ ...base, confidence: 0.4, confidenceLevel: 'low' });
    expect(d.action).toBe('clarify');
    expect(d.undoWindowMs).toBe(0);
  });

  test('clarify message asks binary question', () => {
    const d = evaluateConfidence({ ...base, confidence: 0.4, confidenceLevel: 'low' });
    expect(d.message).toContain('?');
  });
});
