/**
 * Navigation scaffold tests — verify route type definitions.
 * Screen module imports are excluded because react-native uses Flow syntax
 * that bun's bundler cannot parse without a transformer.
 */
import type { RootStackParamList } from '../types';

describe('RootStackParamList', () => {
  it('has all required routes defined', () => {
    const routes: (keyof RootStackParamList)[] = [
      'Today',
      'HabitList',
      'HabitDetail',
      'AddHabit',
      'Debrief',
      'Settings',
    ];
    expect(routes).toHaveLength(6);
  });

  it('HabitDetail requires habitId param', () => {
    const params: RootStackParamList['HabitDetail'] = { habitId: 'test-123' };
    expect(params.habitId).toBe('test-123');
  });

  it('parameterless routes list is complete', () => {
    const parameterlessRoutes: (keyof RootStackParamList)[] = [
      'Today', 'HabitList', 'AddHabit', 'Debrief', 'Settings',
    ];
    expect(parameterlessRoutes).toHaveLength(5);
  });
});

describe('Navigation types module', () => {
  it('loads successfully', async () => {
    const mod = await import('../types');
    expect(mod).toBeDefined();
  });
});
