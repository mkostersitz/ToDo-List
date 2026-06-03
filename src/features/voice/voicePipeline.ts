import { transcribeAudio } from './asr';
import { detectLanguage } from './langDetect';
import { classifyIntent } from './intentClassifier';
import { extractEntities } from './entityExtractor';
import { getConfidenceLevel } from './confidenceGate';
import type { ParsedCheckIn } from './types';

/**
 * Full voice NLU pipeline.
 * Input: audio buffer (Float32Array) or pre-transcribed string (for testing).
 * Output: structured ParsedCheckIn ready for the habit store.
 */
export async function processVoiceInput(input: Float32Array | string): Promise<ParsedCheckIn> {
  // Step 1: ASR
  const asr = await transcribeAudio(input);

  // Step 2: Language detection
  const lang = await detectLanguage(asr.transcript);

  // Step 3: Intent classification
  const intent = await classifyIntent(asr.transcript);

  // Step 4: Entity extraction
  const entities = await extractEntities(asr.transcript);

  // Step 5: Confidence gate
  const confidenceLevel = getConfidenceLevel(intent.confidence);

  return {
    intent: intent.intent,
    confidence: intent.confidence,
    confidenceLevel,
    entities,
    language: lang.language,
    transcript: asr.transcript,
  };
}
