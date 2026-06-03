import type { IntentType } from '../../shared/types';

export type { IntentType };

export interface ASRResult {
  transcript: string;
  confidence: number;
  durationMs: number;
}

export interface LanguageDetectResult {
  language: 'en' | 'de' | 'es';
  confidence: number;
}

export interface IntentResult {
  intent: IntentType;
  confidence: number;
}

export interface EntityResult {
  habitName?: string;
  metricValue?: number;
  metricUnit?: string;
  duration?: number;
  skipReason?: string;
  rawText: string;
}

export type ConfidenceLevel = 'high' | 'mid' | 'low';

export interface ParsedCheckIn {
  intent: IntentType;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  entities: EntityResult;
  language: 'en' | 'de' | 'es';
  transcript: string;
}
