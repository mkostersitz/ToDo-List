import type { LanguageDetectResult } from './types';

// Keyword-based stub language detection (replaced by ONNX lang-detect.onnx in production)
const DE_KEYWORDS = ['ich', 'habe', 'bin', 'nicht', 'heute', 'fertig', 'gemacht', 'kein', 'mit', 'und'];
const ES_KEYWORDS = ['hice', 'termine', 'completi', 'hoy', 'no', 'porque', 'mañana', 'tengo', 'fue'];

export async function detectLanguage(transcript: string): Promise<LanguageDetectResult> {
  const lower = transcript.toLowerCase();
  const words = lower.split(/\s+/);

  const deScore = words.filter(w => DE_KEYWORDS.includes(w)).length;
  const esScore = words.filter(w => ES_KEYWORDS.includes(w)).length;

  if (deScore >= 2) return { language: 'de', confidence: 0.85 + Math.min(deScore * 0.02, 0.1) };
  if (esScore >= 2) return { language: 'es', confidence: 0.85 + Math.min(esScore * 0.02, 0.1) };
  return { language: 'en', confidence: 0.95 };
}
