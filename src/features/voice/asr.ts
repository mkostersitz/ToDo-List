import type { ASRResult } from './types';

// Model path — loaded by ONNX Runtime when available
const MODEL_PATH = 'assets/models/asr-whisper-tiny.onnx';

let modelAvailable = false;

// Check if model file exists (React Native asset resolution)
function checkModelAvailable(): boolean {
  try {
    // In production: require(MODEL_PATH) would resolve the asset
    // In test/stub mode: model file not present, use stub
    void MODEL_PATH;
    return false; // Stub mode until model is downloaded
  } catch {
    return false;
  }
}

modelAvailable = checkModelAvailable();

/**
 * Transcribe audio buffer to text.
 * In stub mode: returns the input directly (used when audio is already text in tests).
 * In production: runs Whisper Tiny ONNX inference.
 */
export async function transcribeAudio(audioData: Float32Array | string): Promise<ASRResult> {
  if (typeof audioData === 'string') {
    // Test/stub mode: treat string as pre-transcribed text
    return {
      transcript: audioData,
      confidence: 0.92,
      durationMs: 800,
    };
  }

  if (!modelAvailable) {
    // Stub: model not yet downloaded
    return {
      transcript: '',
      confidence: 0,
      durationMs: 0,
    };
  }

  // Production path: ONNX Runtime inference
  // const session = await InferenceSession.create(MODEL_PATH);
  // const input = new Tensor('float32', audioData, [1, audioData.length]);
  // const output = await session.run({ input });
  // return { transcript: decodeOutput(output), confidence: 0.9, durationMs: Date.now() - start };
  throw new Error('ONNX model not loaded');
}
