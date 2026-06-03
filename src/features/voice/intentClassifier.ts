import type { IntentResult } from './types';
import type { IntentType } from './types';

// Keyword-based stub intent classifier (replaced by intent-classifier.onnx in production)
// Order matters: more specific / multi-word intents must come before broader ones.
const INTENT_PATTERNS: Array<{ intent: IntentType; patterns: string[] }> = [
  // compound must be checked before skip-with-reason and log-detail
  {
    intent: 'compound',
    patterns: ['but did', 'but also', 'but walked', 'but listened', 'and also', 'skipped.*but', 'instead'],
  },
  {
    intent: 'habit-create',
    patterns: ['add habit', 'new habit', 'create habit', 'start habit', 'track habit', 'set up habit'],
  },
  {
    intent: 'habit-delete',
    patterns: ['stop tracking', 'remove the', 'delete the', 'remove', 'delete'],
  },
  {
    intent: 'habit-edit',
    patterns: ['rename', 'modify', 'edit habit', 'move to', 'change', 'update'],
  },
  {
    intent: 'status-query',
    patterns: ['how am i doing', "what's my", 'what is my', "what's left", 'show my', 'how many', 'current streak'],
  },
  {
    intent: 'skip-with-reason',
    // "read" excluded from log-detail when "too tired" appears — skip patterns listed before log-detail
    patterns: ['skipping', 'skip', 'rest day', 'too tired', 'too sore', 'not feeling', 'missed', 'no gym', 'not running'],
  },
  {
    intent: 'log-detail',
    // "read" only matches log-detail when not preceded by "too tired" — checked after skip
    patterns: ['ran', 'walked', 'slept', 'drank', 'lifted', 'swam', 'cycled', 'meditated for', 'read '],
  },
  {
    intent: 'log-complete',
    patterns: ['done', 'finished', 'completed', 'fertig', 'gemacht', 'termine', 'hice', 'hit my', 'did my'],
  },
];

export async function classifyIntent(transcript: string): Promise<IntentResult> {
  const lower = transcript.toLowerCase();

  for (const { intent, patterns } of INTENT_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace('*', '.*'));
        if (regex.test(lower)) return { intent, confidence: 0.78 };
      } else if (lower.includes(pattern)) {
        return { intent, confidence: 0.88 };
      }
    }
  }

  // Default to log-complete with low confidence
  return { intent: 'log-complete', confidence: 0.45 };
}
