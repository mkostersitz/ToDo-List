import * as SQLite from 'expo-sqlite';
import type { Habit, HabitLog, Streak } from '../../shared/types';

let db: SQLite.SQLiteDatabase | null = null;

/** Test helper — resets the module-level db singleton so initDb() re-runs */
export function _resetDbForTests(): void { db = null; }

export async function initDb(): Promise<void> {
  if (db) return;
  db = await SQLite.openDatabaseAsync('ethervox.db');
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      frequency TEXT NOT NULL,
      targetMetricValue REAL,
      targetMetricUnit TEXT,
      reminderTime TEXT,
      createdAt TEXT NOT NULL,
      archivedAt TEXT
    );
    CREATE TABLE IF NOT EXISTS habit_logs (
      id TEXT PRIMARY KEY,
      habitId TEXT NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL,
      actualMetricValue REAL,
      actualMetricUnit TEXT,
      skipReason TEXT,
      loggedAt TEXT NOT NULL,
      source TEXT NOT NULL,
      FOREIGN KEY (habitId) REFERENCES habits(id)
    );
    CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_date ON habit_logs(habitId, date);
    CREATE TABLE IF NOT EXISTS streaks (
      habitId TEXT PRIMARY KEY,
      currentStreak INTEGER NOT NULL DEFAULT 0,
      longestStreak INTEGER NOT NULL DEFAULT 0,
      lastCompletedDate TEXT,
      FOREIGN KEY (habitId) REFERENCES habits(id)
    );
  `);
}

export async function insertHabit(habit: Habit): Promise<void> {
  if (!db) await initDb();
  const stmt = await db!.prepareAsync(
    'INSERT INTO habits (id, name, frequency, targetMetricValue, targetMetricUnit, reminderTime, createdAt, archivedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );
  try {
    await stmt.executeAsync([
      habit.id, habit.name,
      typeof habit.frequency === 'number' ? String(habit.frequency) : habit.frequency,
      habit.targetMetric?.value ?? null, habit.targetMetric?.unit ?? null,
      habit.reminderTime ?? null, habit.createdAt, habit.archivedAt ?? null,
    ]);
  } finally {
    await stmt.finalizeAsync();
  }
}

export async function updateHabit(id: string, updates: Partial<Habit>): Promise<void> {
  if (!db) await initDb();
  const fields: string[] = [];
  const values: unknown[] = [];
  if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
  if (updates.frequency !== undefined) { fields.push('frequency = ?'); values.push(String(updates.frequency)); }
  if (updates.targetMetric !== undefined) {
    fields.push('targetMetricValue = ?', 'targetMetricUnit = ?');
    values.push(updates.targetMetric?.value ?? null, updates.targetMetric?.unit ?? null);
  }
  if (updates.reminderTime !== undefined) { fields.push('reminderTime = ?'); values.push(updates.reminderTime); }
  if (fields.length === 0) return;
  values.push(id);
  const stmt = await db!.prepareAsync(`UPDATE habits SET ${fields.join(', ')} WHERE id = ?`);
  try {
    await stmt.executeAsync(values as SQLite.SQLiteBindParams);
  } finally {
    await stmt.finalizeAsync();
  }
}

export async function archiveHabit(id: string, archivedAt: string): Promise<void> {
  if (!db) await initDb();
  const stmt = await db!.prepareAsync('UPDATE habits SET archivedAt = ? WHERE id = ?');
  try {
    await stmt.executeAsync([archivedAt, id]);
  } finally {
    await stmt.finalizeAsync();
  }
}

export async function insertHabitLog(log: HabitLog): Promise<void> {
  if (!db) await initDb();
  const stmt = await db!.prepareAsync(
    'INSERT INTO habit_logs (id, habitId, date, status, actualMetricValue, actualMetricUnit, skipReason, loggedAt, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  try {
    await stmt.executeAsync([
      log.id, log.habitId, log.date, log.status,
      log.actualMetric?.value ?? null, log.actualMetric?.unit ?? null,
      log.skipReason ?? null, log.loggedAt, log.source,
    ]);
  } finally {
    await stmt.finalizeAsync();
  }
}

export async function deleteHabitLog(id: string): Promise<void> {
  if (!db) await initDb();
  const stmt = await db!.prepareAsync('DELETE FROM habit_logs WHERE id = ?');
  try {
    await stmt.executeAsync([id]);
  } finally {
    await stmt.finalizeAsync();
  }
}

export async function getHabitsForDate(_date: string): Promise<Habit[]> {
  if (!db) await initDb();
  const stmt = await db!.prepareAsync('SELECT * FROM habits WHERE archivedAt IS NULL');
  try {
    const result = await stmt.executeAsync<Record<string, unknown>>([]);
    const rows = await result.getAllAsync();
    return rows.map(rowToHabit);
  } finally {
    await stmt.finalizeAsync();
  }
}

export async function getHabitHistory(habitId: string, limit = 30): Promise<HabitLog[]> {
  if (!db) await initDb();
  const stmt = await db!.prepareAsync(
    `SELECT * FROM habit_logs WHERE habitId = ? ORDER BY date DESC LIMIT ${limit}`
  );
  try {
    const result = await stmt.executeAsync<Record<string, unknown>>([habitId]);
    const rows = await result.getAllAsync();
    return rows.map(rowToLog);
  } finally {
    await stmt.finalizeAsync();
  }
}

export async function getStreak(habitId: string): Promise<Streak | null> {
  if (!db) await initDb();
  const stmt = await db!.prepareAsync('SELECT * FROM streaks WHERE habitId = ?');
  try {
    const result = await stmt.executeAsync<Record<string, unknown>>([habitId]);
    const row = await result.getFirstAsync();
    if (!row) return null;
    return {
      habitId: row['habitId'] as string,
      currentStreak: row['currentStreak'] as number,
      longestStreak: row['longestStreak'] as number,
      lastCompletedDate: row['lastCompletedDate'] as string,
    };
  } finally {
    await stmt.finalizeAsync();
  }
}

export async function updateStreak(streak: Streak): Promise<void> {
  if (!db) await initDb();
  const stmt = await db!.prepareAsync(
    'INSERT OR REPLACE INTO streaks (habitId, currentStreak, longestStreak, lastCompletedDate) VALUES (?, ?, ?, ?)'
  );
  try {
    await stmt.executeAsync([streak.habitId, streak.currentStreak, streak.longestStreak, streak.lastCompletedDate]);
  } finally {
    await stmt.finalizeAsync();
  }
}

function rowToHabit(row: Record<string, unknown>): Habit {
  return {
    id: row['id'] as string,
    name: row['name'] as string,
    frequency: isNaN(Number(row['frequency'])) ? row['frequency'] as 'daily' | 'weekly' : Number(row['frequency']),
    targetMetric: row['targetMetricValue'] != null
      ? { value: row['targetMetricValue'] as number, unit: row['targetMetricUnit'] as string }
      : undefined,
    reminderTime: row['reminderTime'] as string | undefined,
    createdAt: row['createdAt'] as string,
    archivedAt: row['archivedAt'] as string | undefined,
  };
}

function rowToLog(row: Record<string, unknown>): HabitLog {
  return {
    id: row['id'] as string,
    habitId: row['habitId'] as string,
    date: row['date'] as string,
    status: row['status'] as HabitLog['status'],
    actualMetric: row['actualMetricValue'] != null
      ? { value: row['actualMetricValue'] as number, unit: row['actualMetricUnit'] as string }
      : undefined,
    skipReason: row['skipReason'] as string | undefined,
    loggedAt: row['loggedAt'] as string,
    source: row['source'] as HabitLog['source'],
  };
}
