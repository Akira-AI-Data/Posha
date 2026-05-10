import { RECIPES, type Recipe } from '@/data/recipes';
import { estimateRecipeCalories, getMealCalorieTarget, type PlannerSettings } from '@/lib/mealPlanner';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface GoalSettings {
  weightGoal?: 'lose' | 'maintain' | 'gain';
  targetWeight?: string;
  caloriePlanningMode?: 'daily' | 'per-meal';
  mealCalories?: Partial<Record<MealType, string>>;
}

export interface LoggedMeal {
  id: string;
  mealType: MealType;
  source: 'photo' | 'barcode' | 'describe' | 'manual' | 'quick-add';
  name: string;
  serving: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  notes?: string;
  createdAt: string;
  linkedDate?: string;
  linkedMealType?: MealType;
}

export interface MealPlanEntry {
  name: string;
  emoji?: string;
  cuisine?: string;
  prepTime?: string;
}

export type MealPlanData = Record<string, Partial<Record<MealType, MealPlanEntry>>>;

interface SettingsData {
  dailyGoals?: {
    calories?: string;
    protein?: string;
    carbs?: string;
    fat?: string;
    water?: string;
  };
  goals?: GoalSettings;
}

export interface MacroCard {
  label: 'Protein' | 'Carbs' | 'Fat' | 'Water';
  current: number;
  target: number;
  unit: 'g' | 'ml';
  color: string;
  bg: string;
  text: string;
}

export interface DailyNutritionSummary {
  consumed: number;
  goal: number;
  remaining: number;
  calorieProgress: number;
  macros: MacroCard[];
}

export interface RecentMealItem {
  id: string;
  name: string;
  type: string;
  time: string;
  cal: number;
}

export interface WeeklyCaloriePoint {
  day: string;
  cal: number;
  dateKey: string;
}

export interface FoodGroupSummary {
  label: string;
  emoji: string;
  types: number;
  pct: number;
  color: string;
}

export interface NutrientCoverageItem {
  label: string;
  pct: number;
  priority: boolean;
}

export interface RecommendationItem {
  type: 'warning' | 'success' | 'suggestion';
  title: string;
  desc: string;
}

export interface NutritionInsights {
  nutritionScore: number;
  foodGroups: FoodGroupSummary[];
  nutrients: NutrientCoverageItem[];
  recommendations: RecommendationItem[];
}

export interface MealSuggestion {
  mealType: MealType;
  targetCalories: number | null;
  recipeName: string;
  cuisine?: string;
  calories: number;
  why: string;
}

export interface DecisionSupportSummary {
  nextMealType: MealType;
  headline: string;
  summary: string;
  suggestions: MealSuggestion[];
}

export const LOG_KEY = 'posha_logged_meals';
export const MEALPLAN_KEY = 'posha_mealplan';
export const SETTINGS_KEY = 'posha_settings';
export const TRACKER_EVENT = 'posha:data-changed';

const nutrientLabels = [
  'Vitamin A',
  'Vitamin C',
  'Iron',
  'Calcium',
  'Protein',
  'Healthy Fats',
  'Fiber',
  'Zinc',
  'B Vitamins',
  'Potassium',
  'Omega-3',
  'Folate',
] as const;

const priorityNutrients = new Set(['Vitamin A', 'Iron', 'Zinc']);

const nutrientIngredientMap: Record<string, string[]> = {
  'Vitamin A': ['carrot', 'spinach', 'sweet potato', 'pumpkin', 'egg', 'kale', 'tomato'],
  'Vitamin C': ['orange', 'lemon', 'lime', 'berry', 'tomato', 'pepper', 'mango', 'broccoli'],
  Iron: ['beef', 'spinach', 'lentil', 'bean', 'lamb', 'egg', 'chickpea'],
  Calcium: ['milk', 'yogurt', 'cheese', 'tofu', 'feta', 'parmesan'],
  Protein: ['chicken', 'beef', 'egg', 'yogurt', 'tofu', 'fish', 'salmon', 'shrimp', 'lentil'],
  'Healthy Fats': ['avocado', 'olive oil', 'salmon', 'nut', 'seed', 'peanut butter'],
  Fiber: ['oat', 'bean', 'lentil', 'berry', 'rice', 'broccoli', 'vegetable', 'apple'],
  Zinc: ['beef', 'lamb', 'pumpkin seed', 'cheese', 'yogurt', 'chickpea'],
  'B Vitamins': ['egg', 'chicken', 'rice', 'oat', 'bread', 'beef', 'yogurt'],
  Potassium: ['banana', 'avocado', 'potato', 'tomato', 'spinach', 'bean'],
  'Omega-3': ['salmon', 'tuna', 'chia', 'walnut', 'fish'],
  Folate: ['spinach', 'lentil', 'bean', 'avocado', 'broccoli'],
};

const foodGroupRules = [
  {
    label: 'Vegetables',
    emoji: '🥬',
    color: '#22C55E',
    terms: ['lettuce', 'tomato', 'pepper', 'broccoli', 'spinach', 'onion', 'cucumber', 'zucchini', 'carrot'],
  },
  {
    label: 'Fruits',
    emoji: '🍎',
    color: '#F59E0B',
    terms: ['banana', 'apple', 'berry', 'mango', 'avocado', 'peach', 'fig', 'lemon', 'lime'],
  },
  {
    label: 'Grains',
    emoji: '🌾',
    color: '#8B5CF6',
    terms: ['rice', 'oat', 'bread', 'pasta', 'noodle', 'pizza dough', 'tortilla', 'flour'],
  },
  {
    label: 'Protein',
    emoji: '🍗',
    color: '#EF4444',
    terms: ['chicken', 'beef', 'egg', 'fish', 'salmon', 'shrimp', 'lentil', 'bean', 'tofu', 'yogurt'],
  },
  {
    label: 'Dairy',
    emoji: '🥛',
    color: '#3B82F6',
    terms: ['milk', 'cheese', 'yogurt', 'mozzarella', 'feta', 'parmesan', 'cream'],
  },
] as const;

const macroCardMeta = {
  Protein: { color: '#22C55E', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600' },
  Carbs: { color: '#3B82F6', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600' },
  Fat: { color: '#F59E0B', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600' },
  Water: { color: '#06B6D4', bg: 'bg-cyan-50 dark:bg-cyan-900/20', text: 'text-cyan-600' },
};

export function getLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getWeekDates(baseDate: Date): string[] {
  const date = new Date(baseDate);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date);
  monday.setDate(diff);

  return Array.from({ length: 7 }, (_, index) => {
    const current = new Date(monday);
    current.setDate(monday.getDate() + index);
    return getLocalDateKey(current);
  });
}

export function loadLoggedMeals(): LoggedMeal[] {
  if (typeof window === 'undefined') return [];

  try {
    return JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveLoggedMeals(meals: LoggedMeal[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOG_KEY, JSON.stringify(meals));
  notifyTrackerChanged();
}

export function loadMealPlan(): MealPlanData {
  if (typeof window === 'undefined') return {};

  try {
    return JSON.parse(localStorage.getItem(MEALPLAN_KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveMealPlan(plan: MealPlanData) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MEALPLAN_KEY, JSON.stringify(plan));
  notifyTrackerChanged();
}

export function loadTrackerSettings(): SettingsData {
  if (typeof window === 'undefined') return {};

  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
  } catch {
    return {};
  }
}

export function notifyTrackerChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(TRACKER_EVENT));
}

export function createMealId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function persistLoggedMeal(meal: LoggedMeal) {
  const existing = loadLoggedMeals();
  saveLoggedMeals([meal, ...existing]);
}

export function updateLoggedMeal(id: string, updates: Partial<LoggedMeal>) {
  const meals = loadLoggedMeals().map((meal) => (meal.id === id ? { ...meal, ...updates } : meal));
  saveLoggedMeals(meals);
}

export function deleteLoggedMeal(id: string) {
  const meals = loadLoggedMeals().filter((meal) => meal.id !== id);
  saveLoggedMeals(meals);
}

function findRecipeByName(name: string): Recipe | undefined {
  const normalized = name.trim().toLowerCase();
  return RECIPES.find((recipe) => recipe.name.trim().toLowerCase() === normalized);
}

function normalizeIngredient(value: string) {
  return value.toLowerCase().trim();
}

function inferEmoji(meal: Pick<LoggedMeal, 'name' | 'ingredients'>): string {
  return findRecipeByName(meal.name)?.emoji || '🍽️';
}

function inferCuisine(meal: Pick<LoggedMeal, 'name'>): string | undefined {
  return findRecipeByName(meal.name)?.cuisine;
}

function inferPrepTime(meal: Pick<LoggedMeal, 'name'>): string | undefined {
  return findRecipeByName(meal.name)?.prepTime;
}

export function syncMealToMealPlan(meal: LoggedMeal, dateKey: string, mealType: MealType) {
  const mealPlan = loadMealPlan();
  const nextPlan = { ...mealPlan };
  nextPlan[dateKey] = {
    ...(nextPlan[dateKey] || {}),
    [mealType]: {
      name: meal.name,
      emoji: inferEmoji(meal),
      cuisine: inferCuisine(meal),
      prepTime: inferPrepTime(meal),
    },
  };
  saveMealPlan(nextPlan);
}

function inferNutrients(meal: LoggedMeal): Set<string> {
  const directRecipe = findRecipeByName(meal.name);
  if (directRecipe) return new Set(directRecipe.nutrients);

  const derived = new Set<string>();
  if (meal.protein >= 15) derived.add('Protein');
  if (meal.carbs >= 20) derived.add('B Vitamins');
  if (meal.fat >= 10) derived.add('Healthy Fats');
  if (meal.ingredients.length >= 3) derived.add('Fiber');

  const combined = [meal.name, ...meal.ingredients].map(normalizeIngredient).join(' ');
  for (const [nutrient, terms] of Object.entries(nutrientIngredientMap)) {
    if (terms.some((term) => combined.includes(term))) {
      derived.add(nutrient);
    }
  }

  return derived;
}

function getTodayMeals(dateKey = getLocalDateKey()) {
  return loadLoggedMeals().filter((meal) => getLocalDateKey(new Date(meal.createdAt)) === dateKey);
}

function getNextMealTypeFromMeals(meals: LoggedMeal[]): MealType {
  const order: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
  const seen = new Set(meals.map((meal) => meal.mealType));
  return order.find((mealType) => !seen.has(mealType)) ?? 'snack';
}

function buildPlannerSettings(): PlannerSettings {
  return loadTrackerSettings();
}

function getMissingMacroSignals(meals: LoggedMeal[], settings: SettingsData) {
  const protein = meals.reduce((sum, meal) => sum + meal.protein, 0);
  const carbs = meals.reduce((sum, meal) => sum + meal.carbs, 0);
  const fat = meals.reduce((sum, meal) => sum + meal.fat, 0);

  return {
    proteinLow: protein < Number(settings.dailyGoals?.protein || 150) * 0.55,
    carbsLow: carbs < Number(settings.dailyGoals?.carbs || 250) * 0.55,
    fatLow: fat < Number(settings.dailyGoals?.fat || 65) * 0.55,
  };
}

export function buildDecisionSupportSummary(dateKey = getLocalDateKey()): DecisionSupportSummary {
  const settings = loadTrackerSettings();
  const meals = getTodayMeals(dateKey);
  const nextMealType = getNextMealTypeFromMeals(meals);
  const targetCalories = getMealCalorieTarget(nextMealType, buildPlannerSettings());
  const macros = getMissingMacroSignals(meals, settings);

  const suggestions = RECIPES
    .filter((recipe) => recipe.category === nextMealType)
    .map((recipe) => {
      const calories = estimateRecipeCalories(recipe);
      const calorieDelta = targetCalories ? Math.abs(calories - targetCalories) : 0;
      let score = recipe.nutrients.length * 2 - calorieDelta / 80;

      if (macros.proteinLow && recipe.nutrients.includes('Protein')) score += 5;
      if (macros.carbsLow && recipe.nutrients.includes('Fiber')) score += 2;
      if (macros.fatLow && recipe.nutrients.includes('Healthy Fats')) score += 2;
      if (settings.goals?.weightGoal === 'lose' && targetCalories && calories <= targetCalories + 60) score += 2;
      if (settings.goals?.weightGoal === 'gain' && targetCalories && calories >= targetCalories - 60) score += 2;

      const whyParts = [];
      if (targetCalories) whyParts.push(`${calories} kcal vs target ${targetCalories}`);
      if (macros.proteinLow && recipe.nutrients.includes('Protein')) whyParts.push('supports protein goal');
      if (recipe.nutrients.includes('Fiber')) whyParts.push('adds fiber');

      return {
        mealType: nextMealType,
        targetCalories,
        recipeName: recipe.name,
        cuisine: recipe.cuisine,
        calories,
        why: whyParts.join(' · ') || 'balanced fit for your day',
        score,
      };
    })
    .sort((a, b) => b.score - a.score || a.recipeName.localeCompare(b.recipeName))
    .slice(0, 3)
    .map(({ score: _score, ...item }) => item);

  const weightGoalLabel =
    settings.goals?.weightGoal === 'lose'
      ? 'keep calories tighter'
      : settings.goals?.weightGoal === 'gain'
        ? 'push calories a little higher'
        : 'stay balanced';

  return {
    nextMealType,
    headline: `Next up: ${nextMealType.charAt(0).toUpperCase() + nextMealType.slice(1)}`,
    summary: targetCalories
      ? `Aim for about ${targetCalories} kcal and ${weightGoalLabel}.`
      : `Keep ${nextMealType} balanced around your nutrition goals.`,
    suggestions,
  };
}

function countFoodGroupHits(meals: LoggedMeal[]) {
  const groupHits = new Map<string, Set<string>>();

  for (const meal of meals) {
    const ingredients = meal.ingredients.map(normalizeIngredient);
    const combined = [meal.name, ...ingredients].join(' ');
    for (const group of foodGroupRules) {
      if (group.terms.some((term) => combined.includes(term))) {
        if (!groupHits.has(group.label)) groupHits.set(group.label, new Set());
        ingredients.forEach((ingredient) => {
          if (group.terms.some((term) => ingredient.includes(term))) {
            groupHits.get(group.label)?.add(ingredient);
          }
        });
        if (groupHits.get(group.label)?.size === 0) {
          groupHits.get(group.label)?.add(meal.name);
        }
      }
    }
  }

  return groupHits;
}

export function buildDailyNutritionSummary(dateKey = getLocalDateKey()): DailyNutritionSummary {
  const meals = loadLoggedMeals().filter((meal) => getLocalDateKey(new Date(meal.createdAt)) === dateKey);
  const settings = loadTrackerSettings();
  const consumed = meals.reduce((sum, meal) => sum + meal.calories, 0);
  const protein = meals.reduce((sum, meal) => sum + meal.protein, 0);
  const carbs = meals.reduce((sum, meal) => sum + meal.carbs, 0);
  const fat = meals.reduce((sum, meal) => sum + meal.fat, 0);
  const goal = Number(settings.dailyGoals?.calories || 2000);
  const waterTargetGlasses = Number(settings.dailyGoals?.water || 8);

  return {
    consumed,
    goal,
    remaining: Math.max(goal - consumed, 0),
    calorieProgress: goal > 0 ? Math.min((consumed / goal) * 100, 100) : 0,
    macros: [
      { label: 'Protein', current: protein, target: Number(settings.dailyGoals?.protein || 150), unit: 'g', ...macroCardMeta.Protein },
      { label: 'Carbs', current: carbs, target: Number(settings.dailyGoals?.carbs || 250), unit: 'g', ...macroCardMeta.Carbs },
      { label: 'Fat', current: fat, target: Number(settings.dailyGoals?.fat || 65), unit: 'g', ...macroCardMeta.Fat },
      { label: 'Water', current: 0, target: waterTargetGlasses * 250, unit: 'ml', ...macroCardMeta.Water },
    ],
  };
}

export function buildRecentMeals(limit = 5): RecentMealItem[] {
  return loadLoggedMeals()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit)
    .map((meal) => ({
      id: meal.id,
      name: meal.name,
      type: meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1),
      time: new Date(meal.createdAt).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      }),
      cal: meal.calories,
    }));
}

export function buildWeeklyCalories(baseDate: Date): WeeklyCaloriePoint[] {
  const weekDates = getWeekDates(baseDate);
  const meals = loadLoggedMeals();
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return weekDates.map((dateKey, index) => ({
    day: labels[index],
    dateKey,
    cal: meals
      .filter((meal) => getLocalDateKey(new Date(meal.createdAt)) === dateKey)
      .reduce((sum, meal) => sum + meal.calories, 0),
  }));
}

export function buildNutritionInsights(): NutritionInsights {
  const meals = loadLoggedMeals();
  const nutrientCounts = new Map<string, number>();

  for (const nutrient of nutrientLabels) {
    nutrientCounts.set(nutrient, 0);
  }

  for (const meal of meals) {
    for (const nutrient of inferNutrients(meal)) {
      nutrientCounts.set(nutrient, (nutrientCounts.get(nutrient) || 0) + 1);
    }
  }

  const maxHits = Math.max(...Array.from(nutrientCounts.values()), 1);
  const nutrients = nutrientLabels.map((label) => ({
    label,
    pct: Math.min(Math.round(((nutrientCounts.get(label) || 0) / maxHits) * 100), 100),
    priority: priorityNutrients.has(label),
  }));

  const averageCoverage = nutrients.reduce((sum, nutrient) => sum + nutrient.pct, 0) / nutrients.length;
  const nutritionScore = Math.round(averageCoverage);
  const foodGroups = foodGroupRules.map((group) => {
    const hits = countFoodGroupHits(meals).get(group.label) || new Set();
    return {
      label: group.label,
      emoji: group.emoji,
      types: hits.size,
      pct: Math.min(hits.size * 20, 100),
      color: group.color,
    };
  });

  const lowPriority = nutrients.filter((nutrient) => nutrient.pct < 45);
  const highNutrients = nutrients.filter((nutrient) => nutrient.pct >= 70);

  const recommendations: RecommendationItem[] = [];
  if (lowPriority.some((nutrient) => nutrient.label === 'Iron')) {
    recommendations.push({
      type: 'warning',
      title: 'Low iron intake',
      desc: 'Add spinach, lentils, beans, beef, or eggs to lift iron coverage.',
    });
  }
  if (lowPriority.some((nutrient) => nutrient.label === 'Calcium')) {
    recommendations.push({
      type: 'warning',
      title: 'Low calcium coverage',
      desc: 'Try yogurt, cheese, milk, or tofu to improve calcium intake.',
    });
  }
  if (highNutrients.some((nutrient) => nutrient.label === 'Protein')) {
    recommendations.push({
      type: 'success',
      title: 'Protein intake looks strong',
      desc: 'Your recent meals are consistently supporting your protein goal.',
    });
  }
  recommendations.push({
    type: 'suggestion',
    title: 'Boost meal variety',
    desc: 'Adding more fruit and vegetables will improve nutrient and food-group coverage fastest.',
  });

  return {
    nutritionScore,
    foodGroups,
    nutrients,
    recommendations,
  };
}
