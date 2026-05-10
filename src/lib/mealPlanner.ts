import type { Recipe } from '@/data/recipes';

export type MealType = Recipe['category'];

export interface PlannerFamilyProfile {
  allergies?: string[];
  excludedIngredients?: string[];
}

export interface PlannerSettings {
  dailyGoals?: {
    calories?: string;
    protein?: string;
    carbs?: string;
    fat?: string;
  };
  goals?: {
    weightGoal?: 'lose' | 'maintain' | 'gain';
    targetWeight?: string;
    caloriePlanningMode?: 'daily' | 'per-meal';
    mealCalories?: Partial<Record<MealType, string>>;
  };
  familyProfiles?: PlannerFamilyProfile[];
}

export interface PlannedMealEntry {
  name: string;
  emoji?: string;
  cuisine?: string;
  prepTime?: string;
}

export type PlannedWeekData = Record<string, Partial<Record<MealType, PlannedMealEntry>>>;

export interface DietaryRestrictions {
  allergyLabels: string[];
  excludedTerms: string[];
  summaryLabels: string[];
}

export interface WeekPlanResult {
  plan: PlannedWeekData;
  selectedRecipes: Recipe[];
  unmetMealTypes: MealType[];
  restrictions: DietaryRestrictions;
}

export type BlockedMealSuggestions = Partial<Record<string, Partial<Record<MealType, string[]>>>>;

const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

const nutrientPriorities: Record<MealType, string[]> = {
  breakfast: ['Protein', 'Fiber', 'Calcium', 'B Vitamins'],
  lunch: ['Protein', 'Fiber', 'Vitamin C', 'Iron'],
  dinner: ['Protein', 'Healthy Fats', 'Iron', 'Vitamin A', 'Vitamin C'],
  snack: ['Protein', 'Fiber', 'Healthy Fats', 'Calcium'],
};

const preferredPrepMinutes: Record<MealType, number> = {
  breakfast: 20,
  lunch: 30,
  dinner: 35,
  snack: 15,
};

const mealCalorieShares: Record<MealType, number> = {
  breakfast: 0.25,
  lunch: 0.3,
  dinner: 0.35,
  snack: 0.1,
};

const aliasMap: Record<string, string[]> = {
  'gluten free': ['gluten'],
  'gluten-free': ['gluten'],
  'dairy free': ['dairy'],
  'dairy-free': ['dairy'],
  'egg free': ['eggs'],
  'egg-free': ['eggs'],
  'nut free': ['peanuts', 'tree nuts'],
  'nut-free': ['peanuts', 'tree nuts'],
  vegetarian: ['vegetarian'],
  vegan: ['vegan'],
  pescatarian: ['pescatarian'],
};

const meatTerms = ['beef', 'chicken', 'pork', 'lamb', 'bacon', 'sausage', 'turkey'];
const fishTerms = ['fish', 'salmon', 'anchovy', 'anchovies', 'tuna', 'cod'];
const shellfishTerms = ['shrimp', 'prawn', 'prawns', 'crab', 'lobster', 'scallop', 'shellfish'];
const dairyTerms = [
  'cheese',
  'butter',
  'cream',
  'yogurt',
  'yoghurt',
  'mozzarella',
  'feta',
  'parmesan',
  'burrata',
  'mascarpone',
  'ghee',
  'crema',
  'paneer',
];
const treeNutTerms = ['almond', 'walnut', 'pistachio', 'hazelnut', 'cashew', 'pecan'];
const glutenTerms = [
  'flour',
  'bread',
  'breadcrumbs',
  'baguette',
  'pita',
  'tortilla',
  'pasta',
  'ramen',
  'pizza dough',
  'croissant',
  'phyllo',
  'barley',
  'rye',
  'wheat',
];
const plantMilkTerms = ['almond milk', 'coconut milk', 'oat milk', 'soy milk', 'rice milk'];

function normalizeText(value: string): string {
  return value.toLowerCase().trim();
}

function includesAny(value: string, terms: string[]): boolean {
  return terms.some((term) => value.includes(term));
}

function ingredientHasMilkDairy(ingredient: string): boolean {
  if (plantMilkTerms.some((term) => ingredient.includes(term))) {
    return false;
  }

  return /\bmilk\b/.test(ingredient) || ingredient.includes('evaporated milk');
}

function matchesRestrictionLabel(ingredient: string, label: string): boolean {
  switch (label) {
    case 'dairy':
      return includesAny(ingredient, dairyTerms) || ingredientHasMilkDairy(ingredient);
    case 'eggs':
      return /\beggs?\b/.test(ingredient) || ingredient.includes('mayo');
    case 'peanuts':
      return ingredient.includes('peanut');
    case 'tree nuts':
      return includesAny(ingredient, treeNutTerms);
    case 'soy':
      return includesAny(ingredient, ['soy', 'tofu', 'edamame', 'miso']);
    case 'wheat':
    case 'gluten':
      return includesAny(ingredient, glutenTerms);
    case 'fish':
      return includesAny(ingredient, fishTerms);
    case 'shellfish':
      return includesAny(ingredient, shellfishTerms);
    case 'sesame':
      return ingredient.includes('sesame') || ingredient.includes('tahini');
    case 'mustard':
      return ingredient.includes('mustard');
    case 'celery':
      return ingredient.includes('celery');
    case 'vegetarian':
      return includesAny(ingredient, [...meatTerms, ...fishTerms, ...shellfishTerms]);
    case 'vegan':
      return (
        includesAny(ingredient, [...meatTerms, ...fishTerms, ...shellfishTerms, ...dairyTerms]) ||
        ingredientHasMilkDairy(ingredient) ||
        /\beggs?\b/.test(ingredient) ||
        ingredient.includes('honey') ||
        ingredient.includes('gelatin')
      );
    case 'pescatarian':
      return includesAny(ingredient, meatTerms);
    default:
      return false;
  }
}

function parsePrepMinutes(prepTime?: string): number | null {
  if (!prepTime) return null;
  const match = prepTime.match(/(\d+)/);
  return match ? Number(match[1]) : null;
}

export function estimateIngredientCalories(ingredient: string): number {
  const normalized = normalizeText(ingredient);
  const quantityMatch = normalized.match(/^([\d.\/]+)/);
  let quantity = 1;

  if (quantityMatch) {
    const raw = quantityMatch[1];
    if (raw.includes('/')) {
      const [num, denom] = raw.split('/').map(Number);
      quantity = num / (denom || 1);
    } else {
      quantity = Number(raw) || 1;
    }
  }

  const perUnitCalories: Array<[string, number]> = [
    ['olive oil', 119],
    ['butter', 102],
    ['ghee', 112],
    ['cream', 52],
    ['cheese', 110],
    ['mozzarella', 85],
    ['parmesan', 86],
    ['feta', 75],
    ['burrata', 150],
    ['yogurt', 100],
    ['milk', 120],
    ['egg', 78],
    ['eggs', 78],
    ['chicken', 165],
    ['beef', 220],
    ['lamb', 250],
    ['pork', 210],
    ['salmon', 208],
    ['shrimp', 85],
    ['tofu', 90],
    ['lentil', 115],
    ['beans', 114],
    ['bean', 114],
    ['chickpea', 134],
    ['rice', 205],
    ['oats', 150],
    ['pasta', 200],
    ['bread', 80],
    ['tortilla', 120],
    ['pizza dough', 220],
    ['baguette', 180],
    ['croissant', 230],
    ['banana', 105],
    ['avocado', 120],
    ['potato', 110],
    ['sweet potato', 112],
    ['peanut butter', 95],
    ['peanut', 85],
    ['almond', 82],
    ['walnut', 95],
    ['granola', 120],
    ['honey', 64],
    ['sugar', 48],
    ['coconut milk', 120],
    ['flour', 110],
  ];

  const matched = perUnitCalories.find(([term]) => normalized.includes(term));
  if (!matched) {
    if (normalized.includes('tomato') || normalized.includes('onion') || normalized.includes('spinach') || normalized.includes('pepper') || normalized.includes('cucumber') || normalized.includes('broccoli')) {
      return 20 * quantity;
    }
    return 45 * quantity;
  }

  const [term, baseCalories] = matched;
  if (normalized.includes('g ') || normalized.endsWith('g')) {
    return (baseCalories / 100) * quantity;
  }
  if (normalized.includes('ml ') || normalized.endsWith('ml')) {
    return (baseCalories / 240) * quantity;
  }
  if (normalized.includes('tbsp')) {
    return (baseCalories / 1) * quantity;
  }
  if (normalized.includes('tsp')) {
    return (baseCalories / 3) * quantity;
  }
  return baseCalories * quantity;
}

export function estimateRecipeCalories(recipe: Recipe): number {
  const ingredientCalories = (recipe.ingredients ?? []).reduce(
    (sum, ingredient) => sum + estimateIngredientCalories(ingredient),
    0
  );

  return Math.max(Math.round(ingredientCalories), 120);
}

export function getMealCalorieTarget(mealType: MealType, settings: PlannerSettings): number | null {
  const planningMode = settings.goals?.caloriePlanningMode ?? 'daily';
  const explicitMealCalories = Number(settings.goals?.mealCalories?.[mealType] ?? 0);

  if (planningMode === 'per-meal' && explicitMealCalories > 0) {
    return explicitMealCalories;
  }

  const dailyCalories = Number(settings.dailyGoals?.calories ?? 0);
  if (dailyCalories <= 0) return null;

  let adjustedDailyCalories = dailyCalories;
  switch (settings.goals?.weightGoal) {
    case 'lose':
      adjustedDailyCalories = Math.max(dailyCalories - 250, 1200);
      break;
    case 'gain':
      adjustedDailyCalories = dailyCalories + 250;
      break;
    default:
      break;
  }

  return Math.round(adjustedDailyCalories * mealCalorieShares[mealType]);
}

export function collectDietaryRestrictions(settings: PlannerSettings): DietaryRestrictions {
  const allergyLabels = new Set<string>();
  const excludedTerms = new Set<string>();
  const summaryLabels = new Set<string>();

  for (const profile of settings.familyProfiles ?? []) {
    for (const rawAllergy of profile.allergies ?? []) {
      const allergy = normalizeText(rawAllergy);
      if (!allergy) continue;
      summaryLabels.add(rawAllergy.trim());

      const expanded = aliasMap[allergy] ?? [allergy];
      for (const item of expanded) {
        allergyLabels.add(item);
      }
    }

    for (const rawExcluded of profile.excludedIngredients ?? []) {
      const excluded = normalizeText(rawExcluded);
      if (!excluded) continue;
      summaryLabels.add(rawExcluded.trim());

      const expanded = aliasMap[excluded];
      if (expanded) {
        for (const item of expanded) {
          allergyLabels.add(item);
        }
      } else {
        excludedTerms.add(excluded);
      }
    }
  }

  return {
    allergyLabels: [...allergyLabels],
    excludedTerms: [...excludedTerms],
    summaryLabels: [...summaryLabels],
  };
}

export function recipeMatchesDietaryRestrictions(
  recipe: Recipe,
  restrictions: DietaryRestrictions
): boolean {
  const ingredients = (recipe.ingredients ?? []).map(normalizeText);
  const combinedText = normalizeText(
    [recipe.name, recipe.description, ...(recipe.ingredients ?? [])].filter(Boolean).join(' ')
  );

  for (const label of restrictions.allergyLabels) {
    if (ingredients.some((ingredient) => matchesRestrictionLabel(ingredient, label))) {
      return false;
    }

    if (
      ['vegetarian', 'vegan', 'pescatarian'].includes(label) &&
      matchesRestrictionLabel(combinedText, label)
    ) {
      return false;
    }
  }

  for (const term of restrictions.excludedTerms) {
    if (combinedText.includes(term)) {
      return false;
    }
  }

  return true;
}

function scoreRecipe(
  recipe: Recipe,
  mealType: MealType,
  date: string,
  settings: PlannerSettings,
  usedRecipeCounts: Map<string, number>,
  usedCuisineCounts: Map<string, number>,
  usedNutrients: Set<string>,
  previousRecipeByMeal: Partial<Record<MealType, string>>,
  blockedSuggestions: BlockedMealSuggestions
): number {
  const nutrients = recipe.nutrients ?? [];
  const preferredNutrients = nutrientPriorities[mealType];
  const proteinGoal = Number(settings.dailyGoals?.protein ?? 0);
  const calorieGoal = Number(settings.dailyGoals?.calories ?? 0);
  const targetMealCalories = getMealCalorieTarget(mealType, settings);
  const estimatedCalories = estimateRecipeCalories(recipe);
  const prepMinutes = parsePrepMinutes(recipe.prepTime);
  const cuisineKey = normalizeText(recipe.cuisine ?? 'unknown');
  const usedCount = usedRecipeCounts.get(recipe.name) ?? 0;
  const cuisineCount = usedCuisineCounts.get(cuisineKey) ?? 0;
  const blockedForSlot = blockedSuggestions[date]?.[mealType] ?? [];

  let score = 0;
  if (blockedForSlot.includes(recipe.name)) {
    return -1000;
  }
  score += nutrients.length * 1.25;
  score += preferredNutrients.filter((nutrient) => nutrients.includes(nutrient)).length * 4;
  score += nutrients.filter((nutrient) => !usedNutrients.has(nutrient)).length * 1.5;

  if (proteinGoal >= 120 && nutrients.includes('Protein')) {
    score += 4;
  }

  if (calorieGoal > 0 && calorieGoal <= 1800 && nutrients.includes('Fiber')) {
    score += 2;
  }

  if (targetMealCalories) {
    const calorieDelta = Math.abs(estimatedCalories - targetMealCalories);
    if (calorieDelta <= 75) {
      score += 7;
    } else if (calorieDelta <= 150) {
      score += 4;
    } else if (calorieDelta <= 250) {
      score += 1;
    } else {
      score -= Math.min(calorieDelta / 90, 6);
    }
  }

  if (settings.goals?.weightGoal === 'lose' && estimatedCalories <= (targetMealCalories ?? 450)) {
    score += 2;
  }

  if (settings.goals?.weightGoal === 'gain' && estimatedCalories >= (targetMealCalories ?? 550)) {
    score += 2;
  }

  if (mealType === 'snack' && nutrients.includes('Healthy Fats')) {
    score += 2;
  }

  if (prepMinutes !== null) {
    const target = preferredPrepMinutes[mealType];
    if (prepMinutes <= target) {
      score += 3;
    } else if (prepMinutes <= target + 10) {
      score += 1;
    } else {
      score -= Math.min((prepMinutes - target) / 10, 3);
    }
  }

  score -= usedCount * 8;
  score -= cuisineCount * 2;

  if (previousRecipeByMeal[mealType] === recipe.name) {
    score -= 12;
  }

  return score;
}

export function planNutritionSmartWeek(
  recipes: Recipe[],
  weekDates: string[],
  settings: PlannerSettings = {},
  blockedSuggestions: BlockedMealSuggestions = {}
): WeekPlanResult {
  const restrictions = collectDietaryRestrictions(settings);
  const allowedRecipes = recipes.filter((recipe) =>
    recipeMatchesDietaryRestrictions(recipe, restrictions)
  );
  const recipesByMealType = Object.fromEntries(
    mealTypes.map((mealType) => [
      mealType,
      allowedRecipes.filter((recipe) => recipe.category === mealType),
    ])
  ) as Record<MealType, Recipe[]>;

  const plan: PlannedWeekData = {};
  const selectedRecipes: Recipe[] = [];
  const unmetMealTypes = new Set<MealType>();
  const usedRecipeCounts = new Map<string, number>();
  const usedCuisineCounts = new Map<string, number>();
  const usedNutrients = new Set<string>();
  const previousRecipeByMeal: Partial<Record<MealType, string>> = {};

  for (const date of weekDates) {
    const dayPlan: Partial<Record<MealType, PlannedMealEntry>> = {};

    for (const mealType of mealTypes) {
      const pool = recipesByMealType[mealType];
      if (!pool.length) {
        unmetMealTypes.add(mealType);
        continue;
      }

      const chosen = [...pool]
        .sort((a, b) => {
          const scoreDelta =
            scoreRecipe(
              b,
              mealType,
              date,
              settings,
              usedRecipeCounts,
              usedCuisineCounts,
              usedNutrients,
              previousRecipeByMeal,
              blockedSuggestions
            ) -
            scoreRecipe(
              a,
              mealType,
              date,
              settings,
              usedRecipeCounts,
              usedCuisineCounts,
              usedNutrients,
              previousRecipeByMeal,
              blockedSuggestions
            );

          return scoreDelta || a.name.localeCompare(b.name);
        })[0];

      if (!chosen) {
        unmetMealTypes.add(mealType);
        continue;
      }

      dayPlan[mealType] = {
        name: chosen.name,
        emoji: chosen.emoji,
        cuisine: chosen.cuisine,
        prepTime: chosen.prepTime,
      };
      selectedRecipes.push(chosen);

      usedRecipeCounts.set(chosen.name, (usedRecipeCounts.get(chosen.name) ?? 0) + 1);
      usedCuisineCounts.set(
        normalizeText(chosen.cuisine ?? 'unknown'),
        (usedCuisineCounts.get(normalizeText(chosen.cuisine ?? 'unknown')) ?? 0) + 1
      );
      for (const nutrient of chosen.nutrients ?? []) {
        usedNutrients.add(nutrient);
      }
      previousRecipeByMeal[mealType] = chosen.name;
    }

    if (Object.keys(dayPlan).length > 0) {
      plan[date] = dayPlan;
    }
  }

  return {
    plan,
    selectedRecipes,
    unmetMealTypes: [...unmetMealTypes],
    restrictions,
  };
}
