import type { EntityResult } from './types';

const METRIC_UNITS = ['km', 'miles', 'steps', 'minutes', 'hours', 'glasses', 'liters', 'pages', 'reps', 'sets', 'laps'];
const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  twenty: 20, thirty: 30, forty: 40, fifty: 50,
};

function parseNumber(s: string): number | null {
  const n = parseFloat(s);
  if (!isNaN(n)) return n;
  return NUMBER_WORDS[s.toLowerCase()] ?? null;
}

export async function extractEntities(transcript: string): Promise<EntityResult> {
  const lower = transcript.toLowerCase();
  const words = lower.split(/\s+/);
  const result: EntityResult = { rawText: transcript };

  // Extract metric value + unit (e.g., "5k", "7.5 hours", "10000 steps")
  // First pass: look for combined formats like "5k" or "5km" — these take priority
  let metricFound = false;
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    // Combined like "5k" or "5km"
    const combinedMatch = word.match(/^(\d+(?:\.\d+)?)(k|km|mi|miles?)$/);
    if (combinedMatch) {
      result.metricValue = parseFloat(combinedMatch[1]) * (combinedMatch[2] === 'k' ? 1000 : 1);
      result.metricUnit = combinedMatch[2] === 'k' || combinedMatch[2] === 'km' ? 'km' : 'miles';
      metricFound = true;
      break;
    }
  }
  // Second pass: standalone number followed by unit (only if no combined match found)
  if (!metricFound) {
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const num = parseNumber(word);
      if (num !== null && i + 1 < words.length) {
        const nextWord = words[i + 1].replace(/[.,]$/, '');
        if (METRIC_UNITS.includes(nextWord)) {
          result.metricValue = num;
          result.metricUnit = nextWord;
          break;
        }
      }
    }
  }

  // Extract skip reason after "because", "since", ",", "hurt", "tired"
  const skipReasonMatch = transcript.match(/(?:because|since|,)\s+(.+)$/i)
    ?? transcript.match(/(?:skipping|skip|missed)\s+\w+[,\s]+(.+)$/i);
  if (skipReasonMatch) {
    result.skipReason = skipReasonMatch[1].trim();
  }

  // Extract habit name (heuristic: noun after "done with", "finished", "my", etc.)
  const habitMatch = transcript.match(/(?:done with|finished|completed|my|the)\s+([a-z\s]+?)(?:\s+today|\s+goal|\s+habit|$)/i)
    ?? transcript.match(/(?:add habit|new habit|create habit):\s*(.+?)(?:\s+every|\s+daily|\s+weekly|$)/i);
  if (habitMatch) {
    result.habitName = habitMatch[1].trim();
  }

  return result;
}
