import { create } from 'zustand';
import type { Habit, HabitLog, Streak } from '../../shared/types';
import * as db from './habitDb';
import { UNDO_WINDOW_MS } from '../../shared/constants';

interface UndoEntry { log: HabitLog; timestamp: number; }

interface HabitState {
  habits: Habit[];
  logs: HabitLog[];
  streaks: Record<string, Streak>;
  undoStack: UndoEntry | null;
  initialize: () => Promise<void>;
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt'>) => Promise<void>;
  editHabit: (id: string, updates: Partial<Omit<Habit, 'id' | 'createdAt'>>) => Promise<void>;
  archiveHabit: (id: string) => Promise<void>;
  logHabit: (habitId: string, status: HabitLog['status'], opts?: Partial<HabitLog>) => Promise<void>;
  undoLog: () => Promise<boolean>;
  getTodayHabits: () => Habit[];
  getStreak: (habitId: string) => Streak | null;
  getHabitHistory: (habitId: string) => HabitLog[];
}

function uuid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  logs: [],
  streaks: {},
  undoStack: null,

  initialize: async () => {
    await db.initDb();
    const habits = await db.getHabitsForDate(todayDate());
    set({ habits });
  },

  addHabit: async (partial) => {
    const habit: Habit = {
      ...partial,
      id: uuid(),
      createdAt: new Date().toISOString(),
    };
    await db.insertHabit(habit);
    set(state => ({ habits: [...state.habits, habit] }));
  },

  editHabit: async (id, updates) => {
    await db.updateHabit(id, updates);
    set(state => ({
      habits: state.habits.map(h => h.id === id ? { ...h, ...updates } : h),
    }));
  },

  archiveHabit: async (id) => {
    const archivedAt = new Date().toISOString();
    await db.archiveHabit(id, archivedAt);
    set(state => ({
      habits: state.habits.map(h => h.id === id ? { ...h, archivedAt } : h),
    }));
  },

  logHabit: async (habitId, status, opts = {}) => {
    const log: HabitLog = {
      id: uuid(),
      habitId,
      date: todayDate(),
      status,
      loggedAt: new Date().toISOString(),
      source: 'tap',
      ...opts,
    };
    await db.insertHabitLog(log);
    set(state => ({
      logs: [...state.logs, log],
      undoStack: { log, timestamp: Date.now() },
    }));
  },

  undoLog: async () => {
    const { undoStack } = get();
    if (!undoStack) return false;
    if (Date.now() - undoStack.timestamp > UNDO_WINDOW_MS) return false;
    await db.deleteHabitLog(undoStack.log.id);
    set(state => ({
      logs: state.logs.filter(l => l.id !== undoStack.log.id),
      undoStack: null,
    }));
    return true;
  },

  getTodayHabits: () => {
    return get().habits.filter(h => !h.archivedAt);
  },

  getStreak: (habitId) => {
    return get().streaks[habitId] ?? null;
  },

  getHabitHistory: (habitId) => {
    return get().logs.filter(l => l.habitId === habitId);
  },
}));
