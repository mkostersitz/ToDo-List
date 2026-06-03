export type PatternType = 'skip-cascade' | 'weekend-drop' | 'streak-build' | 'time-cluster';

export interface CoachingPattern {
  type: PatternType;
  confidence: number;
  evidence: string;
  affectedHabitIds: string[];
}

export interface CoachingInsight {
  pattern: CoachingPattern;
  suggestion?: string;
  weekNumber: number;
}
