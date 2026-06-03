import { useVoiceStore } from '../voiceStore';

beforeEach(() => {
  useVoiceStore.setState({ isListening: false, lastResult: null, error: null });
});

describe('voiceStore', () => {
  test('startListening sets isListening true', () => {
    useVoiceStore.getState().startListening();
    expect(useVoiceStore.getState().isListening).toBe(true);
  });

  test('stopListening sets isListening false', () => {
    useVoiceStore.getState().startListening();
    useVoiceStore.getState().stopListening();
    expect(useVoiceStore.getState().isListening).toBe(false);
  });

  test('setResult stores result and stops listening', () => {
    const result = {
      intent: 'log-complete' as const,
      confidence: 0.9,
      confidenceLevel: 'high' as const,
      entities: { rawText: 'done' },
      language: 'en' as const,
      transcript: 'done',
    };
    useVoiceStore.getState().startListening();
    useVoiceStore.getState().setResult(result);
    expect(useVoiceStore.getState().lastResult).toEqual(result);
    expect(useVoiceStore.getState().isListening).toBe(false);
  });

  test('setError stores error and stops listening', () => {
    useVoiceStore.getState().startListening();
    useVoiceStore.getState().setError('Microphone unavailable');
    expect(useVoiceStore.getState().error).toBe('Microphone unavailable');
    expect(useVoiceStore.getState().isListening).toBe(false);
  });

  test('clearResult resets state', () => {
    useVoiceStore.getState().setError('some error');
    useVoiceStore.getState().clearResult();
    expect(useVoiceStore.getState().error).toBeNull();
    expect(useVoiceStore.getState().lastResult).toBeNull();
  });
});
