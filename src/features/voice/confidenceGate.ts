import type { ConfidenceLevel, ParsedCheckIn } from './types';
import { CONFIDENCE_HIGH, CONFIDENCE_MID } from '../../shared/constants';

export function getConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= CONFIDENCE_HIGH) return 'high';
  if (confidence >= CONFIDENCE_MID) return 'mid';
  return 'low';
}

export interface GateDecision {
  action: 'act' | 'confirm' | 'clarify';
  message: string;
  undoWindowMs: number;
}

export function evaluateConfidence(parsed: ParsedCheckIn): GateDecision {
  const level = getConfidenceLevel(parsed.confidence);
  const habitName = parsed.entities.habitName ?? 'that habit';

  switch (level) {
    case 'high':
      return {
        action: 'act',
        message: buildConfirmationMessage(parsed),
        undoWindowMs: 60_000,
      };
    case 'mid':
      return {
        action: 'confirm',
        message: `Logged ${habitName} — say undo if wrong.`,
        undoWindowMs: 60_000,
      };
    case 'low':
      return {
        action: 'clarify',
        message: buildClarificationMessage(parsed),
        undoWindowMs: 0,
      };
  }
}

function buildConfirmationMessage(parsed: ParsedCheckIn): string {
  const { intent, entities } = parsed;
  const habit = entities.habitName ?? 'habit';
  switch (intent) {
    case 'log-complete': return `Got it — ${habit} done!`;
    case 'log-detail': return `Logged: ${entities.metricValue} ${entities.metricUnit ?? ''} for ${habit}.`;
    case 'skip-with-reason': return `Skipped ${habit}${entities.skipReason ? ` — ${entities.skipReason}` : ''}.`;
    case 'habit-create': return `Creating new habit: ${habit}.`;
    case 'habit-delete': return `Removed ${habit}.`;
    case 'status-query': return `Here is your progress for today.`;
    default: return `Logged.`;
  }
}

function buildClarificationMessage(parsed: ParsedCheckIn): string {
  const habit = parsed.entities.habitName ?? 'that';
  return `Did you mean to log ${habit} as done, or skip it?`;
}
