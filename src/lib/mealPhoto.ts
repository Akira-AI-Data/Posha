export interface MealPhotoAnalysis {
  name: string;
  serving: string;
  estimatedGrams?: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  confidence?: number;
  notes?: string;
}

function normalizeIngredient(value: string) {
  return value
    .replace(/^\s*[-*]\s*/, '')
    .replace(/^\s*\d+[.)]?\s*/, '')
    .trim();
}

function toNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function toConfidence(value: unknown) {
  const parsed = toNumber(value);
  if (!Number.isFinite(parsed)) return undefined;
  if (parsed > 1) return Math.min(1, parsed / 100);
  if (parsed < 0) return 0;
  return parsed;
}

export function buildMealPhotoPrompt() {
  return [
    'Analyze this meal photo.',
    'Return JSON only.',
    'Required keys: name, serving, estimatedGrams, calories, protein, carbs, fat, ingredients, confidence, notes.',
    'Use visible ingredients only when possible.',
    'If uncertain, lower confidence and explain uncertainty in notes.',
    'Do not pretend exact nutrition if the image is ambiguous.',
    'Confidence must be a number between 0 and 1.',
  ].join(' ');
}

export function parseMealPhotoAnalysis(text: string): MealPhotoAnalysis | null {
  const fencedMatch = text.match(/```json\s*([\s\S]*?)```/i);
  const candidate = fencedMatch?.[1] ?? text;
  const objectMatch = candidate.match(/\{[\s\S]*\}/);
  if (!objectMatch) return null;

  try {
    const parsed = JSON.parse(objectMatch[0]) as Record<string, unknown>;
    const name = typeof parsed.name === 'string' ? parsed.name.trim() : '';
    const ingredients = Array.isArray(parsed.ingredients)
      ? parsed.ingredients.map((item) => normalizeIngredient(String(item))).filter(Boolean)
      : [];

    if (!name || ingredients.length === 0) return null;

    return {
      name,
      serving: typeof parsed.serving === 'string' && parsed.serving.trim() ? parsed.serving.trim() : '1 serving',
      estimatedGrams: toNumber(parsed.estimatedGrams) || undefined,
      calories: toNumber(parsed.calories),
      protein: toNumber(parsed.protein),
      carbs: toNumber(parsed.carbs),
      fat: toNumber(parsed.fat),
      ingredients,
      confidence: toConfidence(parsed.confidence),
      notes: typeof parsed.notes === 'string' ? parsed.notes.trim() : undefined,
    };
  } catch {
    return null;
  }
}
