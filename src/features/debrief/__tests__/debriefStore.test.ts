import { useDebriefStore } from '../debriefStore';
import type { DebriefScript, DebriefTrigger } from '../types';

beforeEach(() => {
  useDebriefStore.setState({ currentDebrief: null, lastTrigger: null, isGenerating: false });
});

const mockScript: DebriefScript = {
  opening: 'Great week!',
  data: '5 of 5 habits done.',
  pattern: null,
  suggestion: null,
  close: 'Keep it up.',
  mode: 'strong',
  language: 'en',
  totalChars: 42,
};
const mockTrigger: DebriefTrigger = { type: 'automatic', triggeredAt: '2024-01-07T18:00:00Z' };

describe('debriefStore', () => {
  test('setDebrief stores script and trigger', () => {
    useDebriefStore.getState().setDebrief(mockScript, mockTrigger);
    expect(useDebriefStore.getState().currentDebrief).toEqual(mockScript);
    expect(useDebriefStore.getState().lastTrigger).toEqual(mockTrigger);
  });

  test('clearDebrief resets state', () => {
    useDebriefStore.getState().setDebrief(mockScript, mockTrigger);
    useDebriefStore.getState().clearDebrief();
    expect(useDebriefStore.getState().currentDebrief).toBeNull();
  });

  test('setGenerating updates flag', () => {
    useDebriefStore.getState().setGenerating(true);
    expect(useDebriefStore.getState().isGenerating).toBe(true);
    useDebriefStore.getState().setGenerating(false);
    expect(useDebriefStore.getState().isGenerating).toBe(false);
  });
});
