import { create } from 'zustand';
import type { DebriefScript, DebriefTrigger } from './types';

interface DebriefState {
  currentDebrief: DebriefScript | null;
  lastTrigger: DebriefTrigger | null;
  isGenerating: boolean;
  setDebrief: (script: DebriefScript, trigger: DebriefTrigger) => void;
  clearDebrief: () => void;
  setGenerating: (v: boolean) => void;
}

export const useDebriefStore = create<DebriefState>((set) => ({
  currentDebrief: null,
  lastTrigger: null,
  isGenerating: false,
  setDebrief: (script, trigger) => set({ currentDebrief: script, lastTrigger: trigger, isGenerating: false }),
  clearDebrief: () => set({ currentDebrief: null, lastTrigger: null }),
  setGenerating: (v) => set({ isGenerating: v }),
}));
