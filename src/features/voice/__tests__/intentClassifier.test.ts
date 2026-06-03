import { classifyIntent } from '../intentClassifier';

const cases: Array<[string, string]> = [
  // log-complete
  ['done with run', 'log-complete'],
  ['finished meditation', 'log-complete'],
  ['completed morning workout', 'log-complete'],
  ['did my pushups', 'log-complete'],
  ['hit my water goal', 'log-complete'],
  // log-detail
  ['ran 5k in 28 minutes', 'log-detail'],
  ['slept 7.5 hours', 'log-detail'],
  ['drank 6 glasses of water', 'log-detail'],
  ['walked 10000 steps', 'log-detail'],
  ['meditated for 20 minutes', 'log-detail'],
  ['read 30 pages', 'log-detail'],
  // skip-with-reason
  ['skipping gym knee hurts', 'skip-with-reason'],
  ['rest day today', 'skip-with-reason'],
  ['too tired for reading', 'skip-with-reason'],
  ['not running today', 'skip-with-reason'],
  ['missed yoga', 'skip-with-reason'],
  // habit-create
  ['add habit journal every night', 'habit-create'],
  ['new habit drink 8 glasses daily', 'habit-create'],
  ['create habit meditate morning', 'habit-create'],
  // habit-edit
  ['change gym to 4 times a week', 'habit-edit'],
  ['rename run to morning jog', 'habit-edit'],
  ['update water goal to 10 glasses', 'habit-edit'],
  // habit-delete
  ['remove the flossing habit', 'habit-delete'],
  ['delete cold plunge', 'habit-delete'],
  ['stop tracking coffee', 'habit-delete'],
  // status-query
  ['how am i doing', 'status-query'],
  ["what's my meditation streak", 'status-query'],
  ["what's left today", 'status-query'],
  // compound
  ['skipped gym but did yoga instead', 'compound'],
  ["didn't run but walked 40 minutes", 'compound'],
];

describe('classifyIntent — all 8 intent types', () => {
  test.each(cases)('"%s" → %s', async (utterance, expectedIntent) => {
    const result = await classifyIntent(utterance);
    expect(result.intent).toBe(expectedIntent);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });
});
