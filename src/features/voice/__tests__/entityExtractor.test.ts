import { extractEntities } from '../entityExtractor';

describe('extractEntities', () => {
  test('extracts metric value and unit — km', async () => {
    const r = await extractEntities('ran 5 km this morning');
    expect(r.metricValue).toBe(5);
    expect(r.metricUnit).toBe('km');
  });

  test('extracts combined 5k format', async () => {
    const r = await extractEntities('ran 5k in 28 minutes');
    expect(r.metricValue).toBe(5000);
  });

  test('extracts hours', async () => {
    const r = await extractEntities('slept 7.5 hours last night');
    expect(r.metricValue).toBe(7.5);
    expect(r.metricUnit).toBe('hours');
  });

  test('extracts steps', async () => {
    const r = await extractEntities('walked 10000 steps today');
    expect(r.metricValue).toBe(10000);
    expect(r.metricUnit).toBe('steps');
  });

  test('extracts skip reason after because', async () => {
    const r = await extractEntities('skipping gym because knee hurts');
    expect(r.skipReason).toContain('knee hurts');
  });

  test('extracts habit name after done with', async () => {
    const r = await extractEntities('done with my morning run today');
    expect(r.habitName).toBeTruthy();
  });

  test('returns rawText always', async () => {
    const r = await extractEntities('test utterance');
    expect(r.rawText).toBe('test utterance');
  });
});
