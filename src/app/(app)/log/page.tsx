'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Camera,
  CheckCircle2,
  Copy,
  Pencil,
  Flame,
  Loader2,
  MessageSquare,
  Plus,
  ScanBarcode,
  Search,
  Sparkles,
  History,
  UtensilsCrossed,
  Wheat,
  Beef,
  Droplets,
  X,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RECIPES } from '@/data/recipes';
import {
  buildDecisionSupportSummary,
  createMealId,
  deleteLoggedMeal,
  getLocalDateKey,
  loadLoggedMeals,
  syncMealToMealPlan,
  type LoggedMeal,
  type DecisionSupportSummary,
  type MealType,
  saveLoggedMeals,
  updateLoggedMeal,
} from '@/lib/nutritionTracker';
import type { MealPhotoAnalysis } from '@/lib/mealPhoto';

interface FoodItem {
  name: string;
  portion: string;
  cal: number;
  protein: number;
  carbs: number;
  fat: number;
  tags: string[];
  ingredients?: string[];
  barcode?: string;
}

interface ParsedMeal {
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

const popularFoods: FoodItem[] = [
  { name: 'Chicken Breast', portion: '100g', cal: 156, protein: 31, carbs: 0, fat: 3.6, tags: ['High Protein'], ingredients: ['Chicken breast'], barcode: '9300605123451' },
  { name: 'Brown Rice', portion: '1 cup', cal: 216, protein: 5, carbs: 45, fat: 1.8, tags: ['Complex Carbs'], ingredients: ['Brown rice', 'Water'], barcode: '9300605987654' },
  { name: 'Scrambled Eggs', portion: '2 eggs', cal: 182, protein: 12, carbs: 2, fat: 14, tags: ['Breakfast'], ingredients: ['Eggs', 'Butter', 'Salt', 'Pepper'], barcode: '9312345678901' },
  { name: 'Greek Yogurt', portion: '200g', cal: 130, protein: 12, carbs: 7, fat: 6, tags: ['Probiotic'], ingredients: ['Milk', 'Live cultures'], barcode: '9345678901234' },
  { name: 'Banana', portion: '1 medium', cal: 117, protein: 1.3, carbs: 27, fat: 0.4, tags: ['Fruit'], ingredients: ['Banana'], barcode: '9400000000001' },
  { name: 'Avocado', portion: 'Half', cal: 161, protein: 2, carbs: 9, fat: 15, tags: ['Healthy Fats'], ingredients: ['Avocado'], barcode: '9400000000002' },
  { name: 'Oatmeal', portion: '1 cup', cal: 150, protein: 5, carbs: 27, fat: 2.5, tags: ['Breakfast'], ingredients: ['Rolled oats', 'Water', 'Berries'], barcode: '9311111111111' },
  { name: 'Salmon Fillet', portion: '100g', cal: 208, protein: 20, carbs: 0, fat: 13, tags: ['Omega-3'], ingredients: ['Salmon fillet', 'Lemon', 'Olive oil'], barcode: '9333333333333' },
];

const tagColors: Record<string, string> = {
  'High Protein': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  'Complex Carbs': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  Breakfast: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  Probiotic: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  Fruit: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  'Healthy Fats': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  'Omega-3': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
};

function estimateRecipeFoodItem(name: string): FoodItem {
  const recipe = RECIPES.find((item) => item.name === name);
  const ingredients = recipe?.ingredients ?? [name];
  const hasProtein = recipe?.nutrients.includes('Protein');
  const hasFiber = recipe?.nutrients.includes('Fiber');
  const hasHealthyFats = recipe?.nutrients.includes('Healthy Fats');

  return {
    name,
    portion: '1 serving',
    cal: hasProtein ? 420 : 320,
    protein: hasProtein ? 24 : 10,
    carbs: hasFiber ? 34 : 28,
    fat: hasHealthyFats ? 16 : 11,
    tags: [recipe?.category ? mealTypeLabel(recipe.category) : 'Recipe', recipe?.cuisine || 'Recipe'],
    ingredients,
  };
}

function mealTypeLabel(mealType: MealType) {
  return mealType.charAt(0).toUpperCase() + mealType.slice(1);
}

function normalizeIngredient(value: string) {
  return value
    .replace(/^\s*[-*]\s*/, '')
    .replace(/^\s*\d+[.)]?\s*/, '')
    .trim();
}

function parseNutritionText(text: string, label: string) {
  const pattern = new RegExp(`${label}\\s*[:=-]?\\s*(\\d+(?:\\.\\d+)?)`, 'i');
  const match = text.match(pattern);
  return match ? Number(match[1]) : 0;
}

function parseIngredientsFromText(text: string) {
  const ingredientsMatch = text.match(/ingredients?\s*[:=-]?\s*([\s\S]+)/i);
  if (!ingredientsMatch) return [];

  const source = ingredientsMatch[1]
    .split(/\n|,|;/)
    .map(normalizeIngredient)
    .filter(Boolean);

  return [...new Set(source)].slice(0, 12);
}

function parseDescribeFallback(input: string): ParsedMeal {
  const cleaned = input.trim();
  const pieces = cleaned
    .split(/,| with | and /i)
    .map((part) => normalizeIngredient(part))
    .filter(Boolean);

  const name = pieces[0] || cleaned || 'Custom meal';
  const ingredients = pieces.length > 1 ? pieces : [name];
  const calories = Math.max(ingredients.length * 110, 180);
  const protein = Math.max(Math.round(calories * 0.09 / 4), 8);
  const carbs = Math.max(Math.round(calories * 0.45 / 4), 12);
  const fat = Math.max(Math.round(calories * 0.25 / 9), 4);

  return {
    name,
    serving: '1 serving',
    estimatedGrams: undefined,
    calories,
    protein,
    carbs,
    fat,
    ingredients,
    confidence: 0.45,
    notes: 'Estimated from your description.',
  };
}

function parsePhotoFallback(file: File): ParsedMeal {
  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const normalized = baseName.replace(/[-_]+/g, ' ').trim();
  const title =
    normalized
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') || 'Captured meal';

  const ingredients = normalized
    .split(/[\s,_-]+/)
    .map(normalizeIngredient)
    .filter((part) => part.length > 2)
    .slice(0, 6);

  return {
    name: title,
    serving: '1 serving',
    estimatedGrams: undefined,
    calories: 350,
    protein: 20,
    carbs: 30,
    fat: 14,
    ingredients: ingredients.length > 0 ? ingredients : ['Review ingredients manually'],
    confidence: 0.25,
    notes: 'AI image analysis is unavailable on this deployment, so this was created for manual review.',
  };
}

function parseAiMealResponse(text: string): ParsedMeal | null {
  const fencedMatch = text.match(/```json\s*([\s\S]*?)```/i);
  const candidate = fencedMatch?.[1] ?? text;
  const objectMatch = candidate.match(/\{[\s\S]*\}/);

  if (objectMatch) {
    try {
      const parsed = JSON.parse(objectMatch[0]) as ParsedMeal;
      if (parsed.name && Array.isArray(parsed.ingredients)) {
        return {
          name: parsed.name,
          serving: parsed.serving || '1 serving',
          estimatedGrams: Number(parsed.estimatedGrams) || undefined,
          calories: Number(parsed.calories) || 0,
          protein: Number(parsed.protein) || 0,
          carbs: Number(parsed.carbs) || 0,
          fat: Number(parsed.fat) || 0,
          ingredients: parsed.ingredients.map(normalizeIngredient).filter(Boolean),
          confidence: typeof parsed.confidence === 'number' ? parsed.confidence : undefined,
          notes: parsed.notes,
        };
      }
    } catch {
      // Fall through to text parsing.
    }
  }

  const ingredients = parseIngredientsFromText(candidate);
  const lines = candidate
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const nameLine =
    lines.find((line) => /^meal|^dish|^name/i.test(line)) ||
    lines.find((line) => !/calories|protein|carbs|fat|ingredients/i.test(line));

  if (!nameLine) return null;

  return {
    name: nameLine.replace(/^meal|^dish|^name\s*[:=-]?/i, '').trim() || 'Captured meal',
    serving: '1 serving',
    estimatedGrams: undefined,
    calories: parseNutritionText(candidate, 'calories'),
    protein: parseNutritionText(candidate, 'protein'),
    carbs: parseNutritionText(candidate, 'carbs'),
    fat: parseNutritionText(candidate, 'fat'),
    ingredients,
    confidence: undefined,
    notes: 'Parsed from AI capture.',
  };
}

async function readFileAsBase64(file: File) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Failed to read image.'));
        return;
      }
      resolve(result.split(',')[1] || '');
    };
    reader.onerror = () => reject(new Error('Failed to read image.'));
    reader.readAsDataURL(file);
  });
}

async function analyzeWithAi({
  prompt,
  imageFile,
}: {
  prompt: string;
  imageFile?: File;
}): Promise<ParsedMeal | null> {
  const files = imageFile
    ? [
        {
          name: imageFile.name,
          type: imageFile.type,
          content: await readFileAsBase64(imageFile),
        },
      ]
    : [];

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      messages: [
        {
          role: 'user',
          content: prompt,
          files,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Could not read AI response.');
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let text = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n\n');
    buffer = parts.pop() || '';

    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6);
      if (payload === '[DONE]') continue;
      const parsed = JSON.parse(payload) as { text?: string; error?: string };
      if (parsed.error) throw new Error(parsed.error);
      if (parsed.text) text += parsed.text;
    }
  }

  return parseAiMealResponse(text);
}

function CaptureModal({
  title,
  description,
  children,
  onClose,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="flex max-h-[calc(100vh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 p-5 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl border border-border flex items-center justify-center hover:bg-muted/40 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

export default function LogFoodPage() {
  const [search, setSearch] = useState('');
  const [activeMealType, setActiveMealType] = useState<MealType>('lunch');
  const [showManual, setShowManual] = useState(false);
  const [manual, setManual] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '', serving: '', ingredients: '' });
  const [loggedMeals, setLoggedMeals] = useState<LoggedMeal[]>(() => loadLoggedMeals());
  const [editingMeal, setEditingMeal] = useState<LoggedMeal | null>(null);
  const [editDraft, setEditDraft] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '', serving: '', ingredients: '' });
  const [captureMode, setCaptureMode] = useState<'photo' | 'barcode' | 'describe' | null>(null);
  const [captureText, setCaptureText] = useState('');
  const [barcode, setBarcode] = useState('');
  const [scannerSupported, setScannerSupported] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const [scannerStatus, setScannerStatus] = useState('Point camera at barcode');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [captureResult, setCaptureResult] = useState<ParsedMeal | null>(null);
  const [captureError, setCaptureError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [decisionSupport, setDecisionSupport] = useState<DecisionSupportSummary>(buildDecisionSupportSummary());
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const barcodeFileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanFrameRef = useRef<number | null>(null);
  const scannerTimeoutRef = useRef<number | null>(null);
  const captureActionsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setScannerSupported(typeof window !== 'undefined' && 'BarcodeDetector' in window && !!navigator.mediaDevices?.getUserMedia);
  }, []);

  useEffect(() => {
    return () => {
      if (scanFrameRef.current) cancelAnimationFrame(scanFrameRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
      if (scannerTimeoutRef.current) window.clearTimeout(scannerTimeoutRef.current);
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  useEffect(() => {
    if (!captureResult || !captureActionsRef.current) return;
    captureActionsRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [captureResult]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return popularFoods;

    const popularMatches = popularFoods.filter((food) => {
      const haystack = [food.name, food.portion, ...food.tags, ...(food.ingredients ?? [])]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });

    const seenNames = new Set(popularMatches.map((food) => food.name.toLowerCase()));
    const recipeMatches = RECIPES.filter((recipe) => {
      const haystack = [recipe.name, recipe.cuisine, ...recipe.ingredients].join(' ').toLowerCase();
      return haystack.includes(query);
    })
      .filter((recipe) => !seenNames.has(recipe.name.toLowerCase()))
      .slice(0, 10)
      .map((recipe) => estimateRecipeFoodItem(recipe.name));

    return [...popularMatches, ...recipeMatches];
  }, [search]);

  const currentMealEntries = useMemo(
    () =>
      loggedMeals
        .filter((meal) => meal.mealType === activeMealType)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [activeMealType, loggedMeals]
  );

  const yesterdayMealEntries = useMemo(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = getLocalDateKey(yesterday);

    return loggedMeals
      .filter((meal) => meal.mealType === activeMealType && meal.linkedDate === yesterdayKey)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [activeMealType, loggedMeals]);

  const recentTemplates = useMemo(() => {
    const seen = new Set<string>();
    return loggedMeals
      .filter((meal) => meal.mealType === activeMealType)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .filter((meal) => {
        const key = `${meal.name.toLowerCase()}|${meal.serving.toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 4);
  }, [activeMealType, loggedMeals]);

  function persistMeals(nextMeals: LoggedMeal[]) {
    setLoggedMeals(nextMeals);
    saveLoggedMeals(nextMeals);
    setDecisionSupport(buildDecisionSupportSummary());
  }

  function addMeal(meal: ParsedMeal, source: LoggedMeal['source'], options?: { syncToMealPlan?: boolean }) {
    const dateKey = getLocalDateKey();
    const shouldSync = !!options?.syncToMealPlan;
    const entry: LoggedMeal = {
      id: createMealId(),
      mealType: activeMealType,
      source,
      name: meal.name,
      serving: meal.serving,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
      ingredients: meal.ingredients,
      notes: meal.notes,
      createdAt: new Date().toISOString(),
      linkedDate: shouldSync ? dateKey : undefined,
      linkedMealType: shouldSync ? activeMealType : undefined,
    };

    persistMeals([entry, ...loggedMeals]);
    if (shouldSync) {
      syncMealToMealPlan(entry, dateKey, activeMealType);
    }
  }

  function resetCaptureState(mode: 'photo' | 'barcode' | 'describe' | null) {
    if (scanFrameRef.current) {
      cancelAnimationFrame(scanFrameRef.current);
      scanFrameRef.current = null;
    }
    if (scannerTimeoutRef.current) {
      window.clearTimeout(scannerTimeoutRef.current);
      scannerTimeoutRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl('');
    }
    setCaptureMode(mode);
    setCaptureText('');
    setBarcode('');
    setScannerActive(false);
    setScannerStatus('Point camera at barcode');
    setSelectedImage(null);
    setCaptureResult(null);
    setCaptureError('');
    setIsSubmitting(false);
  }

  function handleQuickAdd(food: FoodItem) {
    addMeal(
      {
        name: food.name,
        serving: food.portion,
        calories: food.cal,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        ingredients: food.ingredients ?? [food.name],
        notes: 'Added from food library.',
      },
      'quick-add'
    );
  }

  function repeatMeal(entry: LoggedMeal, syncToMealPlan = false) {
    addMeal(
      {
        name: entry.name,
        serving: entry.serving,
        calories: entry.calories,
        protein: entry.protein,
        carbs: entry.carbs,
        fat: entry.fat,
        ingredients: entry.ingredients,
        notes: 'Repeated from saved history.',
      },
      'manual',
      { syncToMealPlan }
    );
  }

  function handleManualLog() {
    if (!manual.name.trim()) return;

    addMeal(
      {
        name: manual.name.trim(),
        serving: manual.serving.trim() || '1 serving',
        calories: Number(manual.calories) || 0,
        protein: Number(manual.protein) || 0,
        carbs: Number(manual.carbs) || 0,
        fat: Number(manual.fat) || 0,
        ingredients: manual.ingredients
          .split(/\n|,/)
          .map(normalizeIngredient)
          .filter(Boolean),
        notes: 'Added manually.',
      },
      'manual',
      { syncToMealPlan: true }
    );

    setManual({ name: '', calories: '', protein: '', carbs: '', fat: '', serving: '', ingredients: '' });
    setShowManual(false);
  }

  function startEditing(meal: LoggedMeal) {
    setEditingMeal(meal);
    setEditDraft({
      name: meal.name,
      serving: meal.serving,
      calories: String(meal.calories),
      protein: String(meal.protein),
      carbs: String(meal.carbs),
      fat: String(meal.fat),
      ingredients: meal.ingredients.join(', '),
    });
  }

  function handleSaveEdit() {
    if (!editingMeal) return;

    const updates: Partial<LoggedMeal> = {
      name: editDraft.name.trim(),
      serving: editDraft.serving.trim() || '1 serving',
      calories: Number(editDraft.calories) || 0,
      protein: Number(editDraft.protein) || 0,
      carbs: Number(editDraft.carbs) || 0,
      fat: Number(editDraft.fat) || 0,
      ingredients: editDraft.ingredients.split(/\n|,/).map(normalizeIngredient).filter(Boolean),
      notes: editingMeal.notes,
    };

    updateLoggedMeal(editingMeal.id, updates);
    const nextMeals = loadLoggedMeals();
    setLoggedMeals(nextMeals);

    if (editingMeal.linkedDate && editingMeal.linkedMealType) {
      syncMealToMealPlan({ ...editingMeal, ...updates } as LoggedMeal, editingMeal.linkedDate, editingMeal.linkedMealType);
    }

    setEditingMeal(null);
  }

  function handleDeleteMeal(id: string) {
    deleteLoggedMeal(id);
    setLoggedMeals(loadLoggedMeals());
  }

  async function handleDescribeCapture() {
    if (!captureText.trim()) return;
    setIsSubmitting(true);
    setCaptureError('');

    try {
      const prompt =
        `Extract the meal in this text into JSON only with keys name, serving, calories, protein, carbs, fat, ingredients, notes. ` +
        `Use a short ingredient list. If you are unsure, estimate reasonably.\n\nMeal description: ${captureText}`;
      const parsed = await analyzeWithAi({ prompt }).catch(() => null);
      setCaptureResult(parsed ?? parseDescribeFallback(captureText));
    } catch (error) {
      setCaptureError(error instanceof Error ? error.message : 'Could not analyze your meal description.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePhotoCapture() {
    if (!selectedImage) return;
    setIsSubmitting(true);
    setCaptureError('');

    try {
      const response = await fetch('/api/analyze-meal-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: {
            name: selectedImage.name,
            type: selectedImage.type,
            content: await readFileAsBase64(selectedImage),
          },
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const payload = (await response.json()) as { analysis?: MealPhotoAnalysis };
      if (!payload.analysis) {
        throw new Error('Could not analyze the meal photo.');
      }

      setCaptureResult(payload.analysis);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not analyze the meal photo.';
      setCaptureResult(parsePhotoFallback(selectedImage));
      setCaptureError(`Could not identify this photo confidently. We created an editable draft instead. ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  function createPhotoDraft() {
    if (!selectedImage) return;
    setCaptureResult(parsePhotoFallback(selectedImage));
    setCaptureError('Photo added as editable draft. Review ingredients, portions, and macros before saving.');
  }

  function handleBarcodeLookup() {
    if (!barcode.trim()) return;
    setCaptureError('');

    const match = popularFoods.find((food) => food.barcode === barcode.trim());
    if (!match) {
      setCaptureResult(null);
      setCaptureError('Barcode not found in the current food catalog.');
      return;
    }

    setCaptureResult({
      name: match.name,
      serving: match.portion,
      estimatedGrams: undefined,
      calories: match.cal,
      protein: match.protein,
      carbs: match.carbs,
      fat: match.fat,
      ingredients: match.ingredients ?? [match.name],
      confidence: 0.96,
      notes: `Matched barcode ${barcode.trim()}.`,
    });
  }

  function handleBarcodeLookupWithCode(code: string) {
    setBarcode(code);
    setCaptureError('');
    const match = popularFoods.find((food) => food.barcode === code.trim());
    if (!match) {
      setCaptureResult(null);
      setCaptureError(`Barcode ${code} not found in current catalog.`);
      return;
    }

    setCaptureResult({
      name: match.name,
      serving: match.portion,
      estimatedGrams: undefined,
      calories: match.cal,
      protein: match.protein,
      carbs: match.carbs,
      fat: match.fat,
      ingredients: match.ingredients ?? [match.name],
      confidence: 0.96,
      notes: `Matched barcode ${code}.`,
    });
  }

  async function handleBarcodeImageCapture(file: File) {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl('');
    }

    setSelectedImage(file);
    setImagePreviewUrl(URL.createObjectURL(file));
    setCaptureError('');
    setCaptureResult(null);
    setIsSubmitting(true);

    try {
      if (typeof window === 'undefined' || !('BarcodeDetector' in window)) {
        throw new Error('Barcode photo scan is not supported on this device.');
      }

      const detector = new BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'],
      });
      const bitmap = await createImageBitmap(file);

      try {
        const results = await detector.detect(bitmap);
        const code = results.find((item) => item.rawValue)?.rawValue?.trim();
        if (!code) {
          throw new Error('No barcode found in the photo. Try a sharper, closer image.');
        }
        handleBarcodeLookupWithCode(code);
        setScannerStatus(`Detected ${code} from photo`);
      } finally {
        bitmap.close();
      }
    } catch (error) {
      setCaptureError(error instanceof Error ? error.message : 'Could not read barcode from photo.');
      setScannerStatus('Use barcode photo or type barcode manually');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function startBarcodeScanner() {
    if (!scannerSupported) {
      setCaptureError('Live camera scan is not supported here. Use barcode photo or manual barcode entry below.');
      return;
    }

    try {
      setCaptureError('');
      setScannerStatus('Starting camera...');
      stopBarcodeScanner();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      setScannerActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      scannerTimeoutRef.current = window.setTimeout(() => {
        const video = videoRef.current;
        if (!video || video.readyState < 2) {
          stopBarcodeScanner();
          setCaptureError('Camera did not start on this browser. Use Scan from photo below.');
          setScannerStatus('Live camera unavailable');
        }
      }, 5000);

      const detector = new BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'],
      });

      const scan = async () => {
        const video = videoRef.current;
        if (!video || video.readyState < 2) {
          scanFrameRef.current = requestAnimationFrame(scan);
          return;
        }

        if (scannerTimeoutRef.current) {
          window.clearTimeout(scannerTimeoutRef.current);
          scannerTimeoutRef.current = null;
        }

        try {
          const results = await detector.detect(video);
          const code = results.find((item) => item.rawValue)?.rawValue?.trim();
          if (code) {
            setScannerStatus(`Detected ${code}`);
            stopBarcodeScanner();
            handleBarcodeLookupWithCode(code);
            return;
          }
          setScannerStatus('Scanning...');
        } catch {
          setScannerStatus('Camera active. Hold barcode steady.');
        }

        scanFrameRef.current = requestAnimationFrame(scan);
      };

      scanFrameRef.current = requestAnimationFrame(scan);
    } catch (error) {
      setScannerActive(false);
      setCaptureError(error instanceof Error ? error.message : 'Could not access camera for barcode scanning.');
    }
  }

  function stopBarcodeScanner() {
    if (scanFrameRef.current) {
      cancelAnimationFrame(scanFrameRef.current);
      scanFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setScannerActive(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  function confirmCapture() {
    if (!captureResult || !captureMode) return;
    addMeal(captureResult, captureMode);
    resetCaptureState(null);
  }

  const mealTypeTabs: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

  return (
    <div className="min-h-screen text-foreground pb-24 space-y-5 animate-in fade-in duration-300 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Log Food</h1>
        <p className="text-sm text-muted-foreground mt-1">Track what you eat to hit your goals</p>
      </div>

      <Tabs
        value={activeMealType}
        onValueChange={(value) => setActiveMealType(value as MealType)}
        className="space-y-4"
      >
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="breakfast">🌅 Breakfast</TabsTrigger>
          <TabsTrigger value="lunch">☀️ Lunch</TabsTrigger>
          <TabsTrigger value="dinner">🌙 Dinner</TabsTrigger>
          <TabsTrigger value="snack">🍎 Snack</TabsTrigger>
        </TabsList>

        {mealTypeTabs.map((mealType) => (
          <TabsContent key={mealType} value={mealType} className="space-y-5 animate-in fade-in duration-200">
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  id: 'photo',
                  label: 'Take Photo',
                  desc: 'Photo -> editable meal draft',
                  icon: Camera,
                  cls: 'border-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10',
                  iconCls: 'bg-primary/15 text-primary',
                  onClick: () => resetCaptureState('photo'),
                },
                {
                  id: 'barcode',
                  label: 'Scan Barcode',
                  desc: 'Use camera on packaged food',
                  icon: ScanBarcode,
                  cls: 'border border-border bg-card hover:border-primary/30',
                  iconCls: 'bg-orange-100 text-orange-600 dark:bg-orange-900/20',
                  onClick: () => resetCaptureState('barcode'),
                },
                {
                  id: 'describe',
                  label: 'Describe It',
                  desc: 'Parse meal text',
                  icon: MessageSquare,
                  cls: 'border border-border bg-card hover:border-primary/30',
                  iconCls: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20',
                  onClick: () => resetCaptureState('describe'),
                },
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={method.onClick}
                  className={`flex flex-col items-center gap-2.5 p-4 rounded-2xl transition-all active:scale-95 group ${method.cls}`}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${method.iconCls}`}>
                    <method.icon className="w-5 h-5" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-foreground">{method.label}</p>
                    <p className="text-[10px] text-muted-foreground">{method.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search foods..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {search ? 'Search Results' : 'Popular Foods'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {filtered.length === 0 ? (
                  <div className="px-5 py-8 text-center">
                    <Search className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm font-medium text-foreground">No foods found</p>
                    <p className="text-xs text-muted-foreground mt-1">Try a dish name, cuisine, or ingredient like pizza, tomato, or Italian.</p>
                  </div>
                ) : (
                  filtered.map((food, index) => (
                    <div
                      key={food.name}
                      className={`flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors cursor-pointer group ${
                        index < filtered.length - 1 ? 'border-b border-border' : ''
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-foreground">{food.name}</p>
                          {food.tags.map((tag) => (
                            <Badge key={tag} className={`text-[9px] px-1.5 py-0 h-4 ${tagColors[tag] || ''}`}>
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                          <span>{food.portion}</span>
                          <span className="flex items-center gap-0.5"><Beef className="w-2.5 h-2.5" /> {food.protein}g P</span>
                          <span className="flex items-center gap-0.5"><Wheat className="w-2.5 h-2.5" /> {food.carbs}g C</span>
                          <span className="flex items-center gap-0.5"><Droplets className="w-2.5 h-2.5" /> {food.fat}g F</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                        <span className="text-sm font-bold text-primary tabular-nums flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5" />
                          {food.cal}
                        </span>
                        <button
                          onClick={() => handleQuickAdd(food)}
                          className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-all active:scale-95"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {(yesterdayMealEntries.length > 0 || recentTemplates.length > 0) ? (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Saved Meals & Repeat Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {yesterdayMealEntries.length > 0 ? (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <History className="w-4 h-4 text-primary" />
                        <p className="text-sm font-semibold text-foreground">Repeat yesterday</p>
                      </div>
                      <div className="grid gap-2">
                        {yesterdayMealEntries.slice(0, 2).map((entry) => (
                          <div key={`y-${entry.id}`} className="rounded-xl border border-border bg-background/60 p-3 flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-foreground">{entry.name}</p>
                              <p className="text-[11px] text-muted-foreground">{entry.serving} · {entry.calories} cal</p>
                            </div>
                            <button
                              onClick={() => repeatMeal(entry, true)}
                              className="inline-flex items-center gap-1 rounded-lg bg-primary text-white px-3 py-1.5 text-xs font-semibold hover:bg-primary/90"
                            >
                              <Copy className="w-3 h-3" />
                              Repeat
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {recentTemplates.length > 0 ? (
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-2">Recent templates</p>
                      <div className="flex flex-wrap gap-2">
                        {recentTemplates.map((entry) => (
                          <button
                            key={`r-${entry.id}`}
                            onClick={() => repeatMeal(entry)}
                            className="rounded-full border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/40 transition-colors"
                          >
                            {entry.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Logged for {mealTypeLabel(activeMealType)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {currentMealEntries.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border p-6 text-center">
                    <UtensilsCrossed className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm font-medium text-foreground">No foods logged yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Capture a meal photo, barcode, or description to store ingredients and macros.
                    </p>
                  </div>
                ) : (
                  currentMealEntries.map((entry) => (
                    <div key={entry.id} className="rounded-2xl border border-border p-4 bg-background/60">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-foreground">{entry.name}</p>
                            <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                              {entry.source}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{entry.serving}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-primary flex items-center gap-1 justify-end">
                            <Flame className="w-3.5 h-3.5" />
                            {entry.calories}
                          </p>
                          <p className="text-[10px] text-muted-foreground">calories</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-3 text-[11px]">
                        <div className="rounded-xl bg-card px-3 py-2">Protein: <span className="font-semibold">{entry.protein}g</span></div>
                        <div className="rounded-xl bg-card px-3 py-2">Carbs: <span className="font-semibold">{entry.carbs}g</span></div>
                        <div className="rounded-xl bg-card px-3 py-2">Fat: <span className="font-semibold">{entry.fat}g</span></div>
                      </div>
                      <div className="mt-3">
                        <p className="text-[11px] font-semibold text-foreground mb-1">Ingredients</p>
                        <div className="flex flex-wrap gap-1.5">
                          {entry.ingredients.length > 0 ? (
                            entry.ingredients.map((ingredient) => (
                              <Badge key={ingredient} variant="outline" className="text-[10px]">
                                {ingredient}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-[11px] text-muted-foreground">No ingredients captured.</span>
                          )}
                        </div>
                      </div>
                      {entry.notes ? <p className="text-[11px] text-muted-foreground mt-3">{entry.notes}</p> : null}
                      <div className="mt-3 flex items-center justify-end gap-2">
                        <button
                          onClick={() => startEditing(entry)}
                          className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/40 transition-colors"
                        >
                          <Pencil className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteMeal(entry.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <div>
              <button
                onClick={() => setShowManual(!showManual)}
                className="flex items-center gap-2 text-sm font-medium text-primary hover:underline transition-colors"
              >
                <Plus className={`w-4 h-4 transition-transform duration-200 ${showManual ? 'rotate-45' : ''}`} />
                {showManual ? 'Cancel manual entry' : 'Add manually'}
              </button>
              {showManual && (
                <Card className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Manual Entry</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2">
                        <label className="text-xs font-medium text-foreground mb-1 block">Food Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Grilled chicken salad"
                          value={manual.name}
                          onChange={(event) => setManual({ ...manual, name: event.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs font-medium text-foreground mb-1 block">Ingredients</label>
                        <textarea
                          rows={3}
                          placeholder="Chicken, lettuce, tomatoes, olive oil"
                          value={manual.ingredients}
                          onChange={(event) => setManual({ ...manual, ingredients: event.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        />
                      </div>
                      {[
                        { key: 'serving', label: 'Serving Size', placeholder: 'e.g. 1 bowl' },
                        { key: 'calories', label: 'Calories', placeholder: '0', type: 'number' },
                        { key: 'protein', label: 'Protein (g)', placeholder: '0', type: 'number' },
                        { key: 'carbs', label: 'Carbs (g)', placeholder: '0', type: 'number' },
                        { key: 'fat', label: 'Fat (g)', placeholder: '0', type: 'number' },
                      ].map((field) => (
                        <div key={field.key}>
                          <label className="text-xs font-medium text-foreground mb-1 block">{field.label}</label>
                          <input
                            type={field.type || 'text'}
                            placeholder={field.placeholder}
                            value={(manual as Record<string, string>)[field.key]}
                            onChange={(event) => setManual({ ...manual, [field.key]: event.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                          />
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={handleManualLog}
                      className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all shadow-sm shadow-primary/20 active:scale-95"
                    >
                      Log Food
                    </button>
                    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                      <p className="text-sm font-semibold text-foreground">{decisionSupport.headline}</p>
                      <p className="text-xs text-muted-foreground mt-1">{decisionSupport.summary}</p>
                      {decisionSupport.suggestions[0] ? (
                        <div className="mt-3 rounded-xl bg-background/70 border border-border px-3 py-2.5">
                          <p className="text-sm font-medium text-foreground">{decisionSupport.suggestions[0].recipeName}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{decisionSupport.suggestions[0].why}</p>
                        </div>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {captureMode === 'photo' && (
        <CaptureModal
          title="Take Photo"
          description="Upload a meal photo and Posha will estimate the meal, ingredients, and macros. Review before saving."
          onClose={() => resetCaptureState(null)}
        >
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0] || null;
                if (imagePreviewUrl) {
                  URL.revokeObjectURL(imagePreviewUrl);
                  setImagePreviewUrl('');
                }
                setSelectedImage(file);
                if (file) setImagePreviewUrl(URL.createObjectURL(file));
                setCaptureResult(null);
                setCaptureError('');
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 px-4 py-8 text-center hover:bg-primary/10 transition-colors"
            >
              <Camera className="w-8 h-8 mx-auto text-primary mb-2" />
              <p className="text-sm font-semibold text-foreground">
                {selectedImage ? selectedImage.name : 'Choose or capture a meal photo'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">JPG, PNG, or WEBP</p>
            </button>
            <button
              onClick={handlePhotoCapture}
              disabled={!selectedImage || isSubmitting}
              className="w-full rounded-xl bg-primary text-white py-2.5 font-semibold text-sm disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Analyze meal photo'}
            </button>
            {captureResult ? (
              <div
                ref={captureActionsRef}
                className="rounded-2xl border border-border bg-background/95 px-4 py-3 shadow-sm"
              >
                <button
                  onClick={confirmCapture}
                  className="w-full rounded-xl bg-foreground py-3 text-sm font-semibold text-white shadow-sm"
                >
                  Continue and save meal
                </button>
                <p className="mt-2 text-center text-[11px] text-muted-foreground">
                  You can edit ingredients, grams, and macros right after saving.
                </p>
              </div>
            ) : null}
            {imagePreviewUrl ? (
              <div className="rounded-2xl overflow-hidden border border-border">
                <img src={imagePreviewUrl} alt="Meal preview" className="w-full h-52 object-cover" />
              </div>
            ) : null}
            <button
              onClick={createPhotoDraft}
              disabled={!selectedImage || isSubmitting}
              className="w-full rounded-xl border border-border bg-background py-2.5 font-semibold text-sm disabled:opacity-60"
            >
              Use photo as editable draft
            </button>
            {captureError ? <p className="text-sm text-red-500">{captureError}</p> : null}
            {captureResult ? (
              <div className="rounded-2xl border border-border bg-background p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <p className="text-sm font-semibold">{captureResult.name}</p>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                  <p className="text-[11px] font-medium text-amber-800">AI estimate only. Confirm ingredients, serving, and macros or edit after saving.</p>
                </div>
                <p className="text-xs text-muted-foreground">{captureResult.serving}</p>
                {typeof captureResult.estimatedGrams === 'number' ? (
                  <p className="text-xs text-muted-foreground">Estimated weight: {captureResult.estimatedGrams}g</p>
                ) : null}
                {typeof captureResult.confidence === 'number' ? (
                  <p className="text-xs text-muted-foreground">AI confidence: {Math.round(captureResult.confidence * 100)}%</p>
                ) : null}
                <p className="text-xs text-foreground">Ingredients: {captureResult.ingredients.join(', ') || 'Not detected'}</p>
                {captureResult.notes ? <p className="text-[11px] text-muted-foreground">{captureResult.notes}</p> : null}
              </div>
            ) : null}
          </div>
        </CaptureModal>
      )}

      {captureMode === 'barcode' && (
        <CaptureModal
          title="Scan Barcode"
          description="Use your camera on packaged food. If live scan does not open on mobile, snap a barcode photo instead."
          onClose={() => resetCaptureState(null)}
        >
          <div className="space-y-4">
            <input
              ref={barcodeFileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0] || null;
                if (file) {
                  void handleBarcodeImageCapture(file);
                }
                event.currentTarget.value = '';
              }}
            />
            {scannerSupported ? (
              <div className="space-y-3">
                <div className="rounded-2xl overflow-hidden border border-border bg-black">
                  {scannerActive ? (
                    <video ref={videoRef} playsInline muted className="w-full h-56 object-cover" />
                  ) : (
                    <div className="h-56 flex items-center justify-center text-sm text-white/80 px-6 text-center">
                      Camera barcode scanner ready
                    </div>
                  )}
                </div>
                {!scannerActive ? (
                  <button
                    onClick={startBarcodeScanner}
                    className="w-full rounded-xl bg-primary text-white py-2.5 font-semibold text-sm"
                  >
                    Start camera scan
                  </button>
                ) : (
                  <button
                    onClick={stopBarcodeScanner}
                    className="w-full rounded-xl border border-border bg-background py-2.5 font-semibold text-sm"
                  >
                    Stop scanner
                  </button>
                )}
                <p className="text-xs text-muted-foreground">{scannerStatus}</p>
              </div>
            ) : null}
            <button
              onClick={() => barcodeFileInputRef.current?.click()}
              className="w-full rounded-xl border border-border bg-background py-2.5 font-semibold text-sm"
            >
              Scan from photo
            </button>
            {selectedImage ? (
              <p className="text-xs text-muted-foreground">
                {isSubmitting ? 'Reading barcode from photo...' : `Barcode photo: ${selectedImage.name}`}
              </p>
            ) : null}
            <input
              type="text"
              placeholder="e.g. 9300605123451"
              value={barcode}
              onChange={(event) => setBarcode(event.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm"
            />
            <button
              onClick={handleBarcodeLookup}
              className="w-full rounded-xl bg-primary text-white py-2.5 font-semibold text-sm"
            >
              Lookup typed barcode
            </button>
            <p className="text-xs text-muted-foreground">
              Sample demo barcodes: 9300605123451, 9300605987654, 9312345678901
            </p>
            {captureError ? <p className="text-sm text-red-500">{captureError}</p> : null}
            {captureResult ? (
              <div className="rounded-2xl border border-border bg-background p-4 space-y-2">
                <p className="text-sm font-semibold">{captureResult.name}</p>
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                  <p className="text-[11px] font-medium text-amber-800">Barcode matched current catalog. If pack size differs, edit after saving.</p>
                </div>
                <p className="text-xs text-muted-foreground">{captureResult.serving}</p>
                {typeof captureResult.confidence === 'number' ? (
                  <p className="text-xs text-muted-foreground">Match confidence: {Math.round(captureResult.confidence * 100)}%</p>
                ) : null}
                <p className="text-xs text-foreground">Ingredients: {captureResult.ingredients.join(', ')}</p>
                <button
                  onClick={confirmCapture}
                  className="w-full rounded-xl bg-foreground text-white py-2.5 text-sm font-semibold"
                >
                  Confirm and save
                </button>
              </div>
            ) : null}
          </div>
        </CaptureModal>
      )}

      {captureMode === 'describe' && (
        <CaptureModal
          title="Describe It"
          description="Describe your meal in plain language and Posha will turn it into a logged meal with ingredients. Review before saving."
          onClose={() => resetCaptureState(null)}
        >
          <div className="space-y-4">
            <textarea
              rows={5}
              placeholder="e.g. Grilled chicken salad with avocado, cherry tomatoes, feta, and olive oil dressing"
              value={captureText}
              onChange={(event) => setCaptureText(event.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm"
            />
            <button
              onClick={handleDescribeCapture}
              disabled={!captureText.trim() || isSubmitting}
              className="w-full rounded-xl bg-primary text-white py-2.5 font-semibold text-sm disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Analyze description'}
            </button>
            {captureError ? <p className="text-sm text-red-500">{captureError}</p> : null}
            {captureResult ? (
              <div className="rounded-2xl border border-border bg-background p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <p className="text-sm font-semibold">{captureResult.name}</p>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                  <p className="text-[11px] font-medium text-amber-800">Posha may estimate portions when your description is vague. Confirm or edit after saving.</p>
                </div>
                <p className="text-xs text-foreground">Ingredients: {captureResult.ingredients.join(', ')}</p>
                {captureResult.notes ? <p className="text-[11px] text-muted-foreground">{captureResult.notes}</p> : null}
                <button
                  onClick={confirmCapture}
                  className="w-full rounded-xl bg-foreground text-white py-2.5 text-sm font-semibold"
                >
                  Confirm and save
                </button>
              </div>
            ) : null}
          </div>
        </CaptureModal>
      )}

      {editingMeal && (
        <CaptureModal
          title="Edit Logged Food"
          description="Update the meal details, ingredients, and macros."
          onClose={() => setEditingMeal(null)}
        >
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Food Name</label>
              <input
                type="text"
                value={editDraft.name}
                onChange={(event) => setEditDraft({ ...editDraft, name: event.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Ingredients</label>
              <textarea
                rows={3}
                value={editDraft.ingredients}
                onChange={(event) => setEditDraft({ ...editDraft, ingredients: event.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'serving', label: 'Serving' },
                { key: 'calories', label: 'Calories' },
                { key: 'protein', label: 'Protein (g)' },
                { key: 'carbs', label: 'Carbs (g)' },
                { key: 'fat', label: 'Fat (g)' },
              ].map((field) => (
                <div key={field.key}>
                  <label className="text-xs font-medium text-foreground mb-1 block">{field.label}</label>
                  <input
                    type={field.key === 'serving' ? 'text' : 'number'}
                    value={(editDraft as Record<string, string>)[field.key]}
                    onChange={(event) => setEditDraft({ ...editDraft, [field.key]: event.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={handleSaveEdit}
              className="w-full rounded-xl bg-primary text-white py-2.5 font-semibold text-sm"
            >
              Save changes
            </button>
          </div>
        </CaptureModal>
      )}
    </div>
  );
}
