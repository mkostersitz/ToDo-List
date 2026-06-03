export type DebriefMode = 'strong' | 'solid' | 'rough' | 'slip';
export type Language = 'en' | 'de' | 'es';

export interface WeekStats {
  totalHabits: number;
  completedHabits: number;
  completionRate: number; // 0-1
  streakHighlight?: { habitName: string; streak: number };
  topHabit?: string;
  dataWeeks: number;
}

export interface DebriefScript {
  opening: string;
  data: string;
  pattern: string | null; // null if < 3 weeks data
  suggestion: string | null; // null if < 4 weeks data
  close: string;
  mode: DebriefMode;
  language: Language;
  totalChars: number; // must be ≤ 600
}

export interface DebriefTrigger {
  type: 'automatic' | 'voice';
  triggeredAt: string; // ISO timestamp
}
