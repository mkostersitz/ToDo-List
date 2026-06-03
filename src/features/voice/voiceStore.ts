import { create } from 'zustand';
import type { ParsedCheckIn } from './types';

interface VoiceState {
  isListening: boolean;
  lastResult: ParsedCheckIn | null;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  setResult: (result: ParsedCheckIn) => void;
  setError: (error: string) => void;
  clearResult: () => void;
}

export const useVoiceStore = create<VoiceState>((set) => ({
  isListening: false,
  lastResult: null,
  error: null,
  startListening: () => set({ isListening: true, error: null }),
  stopListening: () => set({ isListening: false }),
  setResult: (result) => set({ lastResult: result, isListening: false }),
  setError: (error) => set({ error, isListening: false }),
  clearResult: () => set({ lastResult: null, error: null }),
}));
