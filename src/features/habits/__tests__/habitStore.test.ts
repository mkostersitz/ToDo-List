import { mockDb, mockExpoSQLite } from './mocks/sqliteMock';

jest.mock('expo-sqlite', () => mockExpoSQLite);

// Reset mock DB and store state before each test
beforeEach(async () => {
  mockDb._reset();
  // Reset the db singleton so initDb() re-runs against fresh tables
  const { _resetDbForTests } = await import('../habitDb');
  _resetDbForTests();
  // Reset Zustand store state
  const { useHabitStore } = await import('../habitStore');
  useHabitStore.setState({ habits: [], logs: [], streaks: {}, undoStack: null });
});

describe('habitStore', () => {
  test('addHabit adds a habit with id and createdAt', async () => {
    const { useHabitStore } = await import('../habitStore');
    const store = useHabitStore.getState();

    await store.addHabit({ name: 'Morning run', frequency: 'daily' });
    const habits = store.getTodayHabits();

    expect(habits).toHaveLength(1);
    expect(habits[0].name).toBe('Morning run');
    expect(habits[0].id).toBeTruthy();
    expect(habits[0].createdAt).toBeTruthy();
  });

  test('editHabit updates name', async () => {
    const { useHabitStore } = await import('../habitStore');
    const store = useHabitStore.getState();

    await store.addHabit({ name: 'Run', frequency: 'daily' });
    const { id } = store.getTodayHabits()[0];
    await store.editHabit(id, { name: 'Morning jog' });

    expect(store.getTodayHabits()[0].name).toBe('Morning jog');
  });

  test('archiveHabit removes habit from getTodayHabits', async () => {
    const { useHabitStore } = await import('../habitStore');
    const store = useHabitStore.getState();

    await store.addHabit({ name: 'Run', frequency: 'daily' });
    const { id } = store.getTodayHabits()[0];
    await store.archiveHabit(id);

    expect(store.getTodayHabits()).toHaveLength(0);
  });

  test('logHabit creates log with correct fields', async () => {
    const { useHabitStore } = await import('../habitStore');
    const store = useHabitStore.getState();

    await store.addHabit({ name: 'Meditate', frequency: 'daily' });
    const { id } = store.getTodayHabits()[0];
    await store.logHabit(id, 'done');

    const history = store.getHabitHistory(id);
    expect(history).toHaveLength(1);
    expect(history[0].habitId).toBe(id);
    expect(history[0].status).toBe('done');
    expect(history[0].loggedAt).toBeTruthy();
  });

  test('undoLog removes last log within 60s window', async () => {
    const { useHabitStore } = await import('../habitStore');
    const store = useHabitStore.getState();

    await store.addHabit({ name: 'Run', frequency: 'daily' });
    const { id } = store.getTodayHabits()[0];
    await store.logHabit(id, 'done');

    const result = await store.undoLog();
    expect(result).toBe(true);
    expect(store.getHabitHistory(id)).toHaveLength(0);
  });

  test('undoLog returns false when no undo stack', async () => {
    const { useHabitStore } = await import('../habitStore');
    const store = useHabitStore.getState();

    const result = await store.undoLog();
    expect(result).toBe(false);
  });

  test('getTodayHabits excludes archived habits', async () => {
    const { useHabitStore } = await import('../habitStore');
    const store = useHabitStore.getState();

    await store.addHabit({ name: 'Run', frequency: 'daily' });
    await store.addHabit({ name: 'Meditate', frequency: 'daily' });
    const { id } = store.getTodayHabits()[0];
    await store.archiveHabit(id);

    expect(store.getTodayHabits()).toHaveLength(1);
    expect(store.getTodayHabits()[0].name).toBe('Meditate');
  });
});
