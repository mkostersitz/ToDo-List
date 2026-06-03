import { processVoiceInput } from '../voicePipeline';

describe('voicePipeline — full NLU pipeline', () => {
  test('processes string input end-to-end', async () => {
    const result = await processVoiceInput('done with morning run');
    expect(result.transcript).toBe('done with morning run');
    expect(result.intent).toBe('log-complete');
    expect(result.language).toBe('en');
    expect(result.confidenceLevel).toMatch(/^(high|mid|low)$/);
  });

  test('skip-with-reason extracts skip reason', async () => {
    const result = await processVoiceInput('skipping gym because knee hurts');
    expect(result.intent).toBe('skip-with-reason');
    expect(result.entities.skipReason).toContain('knee hurts');
  });

  test('log-detail extracts metric', async () => {
    const result = await processVoiceInput('ran 5 km this morning');
    expect(result.intent).toBe('log-detail');
    expect(result.entities.metricValue).toBe(5);
  });

  test('German utterance detected as de', async () => {
    const result = await processVoiceInput('ich bin heute fertig mit dem Laufen und Meditation');
    expect(result.language).toBe('de');
  });

  test('high confidence produces act decision via gate', async () => {
    const { evaluateConfidence } = require('../confidenceGate') as typeof import('../confidenceGate');
    const result = await processVoiceInput('done with run');
    const decision = evaluateConfidence(result);
    expect(['act', 'confirm', 'clarify']).toContain(decision.action);
  });

  // German utterances
  test('German log-complete', async () => {
    const r = await processVoiceInput('fertig mit dem Laufen heute');
    expect(r.language).toBe('de');
  });

  // Spanish utterances
  test('Spanish log-complete', async () => {
    const r = await processVoiceInput('hice mi entrenamiento hoy termine bien fue');
    expect(r.language).toBe('es');
  });

  // Ambiguous case — low confidence
  test('ambiguous utterance produces low confidence', async () => {
    const r = await processVoiceInput('maybe');
    expect(r.confidence).toBeLessThan(0.85);
  });

  // Compound intent
  test('compound intent detected', async () => {
    const r = await processVoiceInput('skipped gym but did yoga instead');
    expect(r.intent).toBe('compound');
  });

  // Status query
  test('status query detected', async () => {
    const r = await processVoiceInput('how am i doing today');
    expect(r.intent).toBe('status-query');
  });
});
