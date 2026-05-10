import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildDecisionSupportSummary,
  LOG_KEY,
  SETTINGS_KEY,
  type LoggedMeal,
} from './nutritionTracker';

function mockMeal(overrides: Partial<LoggedMeal> = {}): LoggedMeal {
  return {
    id: 'meal-1',
    mealType: 'breakfast',
    source: 'manual',
    name: 'Protein Oats',
    serving: '1 bowl',
    calories: 320,
    protein: 18,
    carbs: 42,
    fat: 8,
    ingredients: ['oats', 'banana'],
    createdAt: '2026-04-24T08:00:00.000Z',
    ...overrides,
  };
}

describe('buildDecisionSupportSummary', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal('window', { dispatchEvent: vi.fn() });
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    });
  });

  it('suggests the next unlogged meal type using calorie-aware options', () => {
    localStorage.setItem(LOG_KEY, JSON.stringify([mockMeal()]));
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({
        dailyGoals: { calories: '2000', protein: '140', carbs: '250', fat: '65' },
        goals: {
          weightGoal: 'lose',
          caloriePlanningMode: 'per-meal',
          mealCalories: { lunch: '550' },
        },
      })
    );

    const result = buildDecisionSupportSummary('2026-04-24');

    expect(result.nextMealType).toBe('lunch');
    expect(result.summary).toContain('550 kcal');
    expect(result.suggestions.length).toBeGreaterThan(0);
  });
});
