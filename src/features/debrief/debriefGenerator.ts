import { getMode, getTemplates } from './scriptTemplates';
import type { WeekStats, DebriefScript, DebriefMode, Language } from './types';
import type { CoachingInsight } from '../coaching/types';

const FORBIDDEN_AS_QUALIFIERS = ['failed', 'missed', 'only', 'just'];

function sanitize(text: string): string {
  let result = text;
  for (const word of FORBIDDEN_AS_QUALIFIERS) {
    // Match as qualifier: followed by space+number or space+determiner
    const qualifierRegex = new RegExp(`\\b${word}\\s+(?=\\d|a |an |some |few )`, 'gi');
    result = result.replace(qualifierRegex, '');
  }
  return result.trim();
}

function enforceLimit(text: string, maxChars = 600): string {
  if (text.length <= maxChars) return text;
  const truncated = text.slice(0, maxChars);
  const lastPeriod = Math.max(
    truncated.lastIndexOf('.'),
    truncated.lastIndexOf('!'),
    truncated.lastIndexOf('?')
  );
  return lastPeriod > 0 ? truncated.slice(0, lastPeriod + 1) : truncated;
}

export function generateDebrief(
  stats: WeekStats,
  language: Language = 'en',
  coachingInsight?: CoachingInsight | null,
  userName?: string
): DebriefScript {
  const mode: DebriefMode = getMode(stats.completionRate);
  const t = getTemplates(mode, language);

  const opening = sanitize(t.opening(stats, userName));
  const data = sanitize(t.data(stats));
  const close = sanitize(t.close(stats));

  // Pattern section: only if ≥ 3 weeks of data and insight available
  let pattern: string | null = null;
  if (stats.dataWeeks >= 3 && coachingInsight) {
    pattern = sanitize(coachingInsight.pattern.evidence);
  }

  // Suggestion: only if ≥ 4 weeks and insight has suggestion
  let suggestion: string | null = null;
  if (stats.dataWeeks >= 4 && coachingInsight?.suggestion) {
    suggestion = sanitize(coachingInsight.suggestion);
  }

  const parts = [opening, data, pattern, suggestion, close].filter(Boolean) as string[];
  const fullScript = parts.join(' ');
  const limited = enforceLimit(fullScript);
  const totalChars = limited.length;

  return {
    opening,
    data,
    pattern,
    suggestion,
    close,
    mode,
    language,
    totalChars,
  };
}

export function isDebriefDay(now: Date): boolean {
  return now.getDay() === 0; // Sunday
}

export function shouldAutoTrigger(now: Date, triggerHour = 18): boolean {
  return isDebriefDay(now) && now.getHours() >= triggerHour;
}
