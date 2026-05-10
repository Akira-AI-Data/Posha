'use client'

import { useState, useEffect, useMemo } from 'react'
import { ChefHat, Globe, Carrot, Heart, Loader2, Clock, Bookmark, Shuffle, ChevronDown, X, Search, Zap, AlertTriangle, Sparkles } from 'lucide-react'
import { FluentEmoji } from '@/components/ui/FluentEmoji'
import { UpgradeNotice } from '@/components/billing/UpgradeNotice'
import { useBillingAccess } from '@/hooks/useBillingAccess'
import {
  RECIPES,
  CUISINE_OPTIONS,
  NUTRIENT_OPTIONS,
  INGREDIENT_OPTIONS,
  type Recipe as RecipeType,
} from '@/data/recipes'

interface Recipe {
  name: string
  emoji: string
  description: string
  category: string
  cuisine: string
  prepTime: string
  ageRange: string
  nutrients: string[]
  ingredients: string[]
  instructions: string[]
  savedAt?: string
}

// ── Nutrient deficiency detection ────────────────────────────────────
// Analyzes recent meal plan to find which nutrients are underrepresented
const NUTRIENT_FOOD_MAP: Record<string, string[]> = {
  'Vitamin A': ['sweet potato', 'carrot', 'pumpkin', 'spinach', 'mango', 'liver', 'egg', 'cantaloupe', 'kale'],
  'Vitamin C': ['lemon', 'lime', 'orange', 'bell pepper', 'strawberry', 'broccoli', 'kiwi', 'tomato', 'grapefruit'],
  'Iron': ['red meat', 'beef', 'lentil', 'spinach', 'chickpea', 'tofu', 'quinoa', 'dark chocolate'],
  'Calcium': ['yogurt', 'cheese', 'milk', 'sardine', 'tofu', 'kale', 'almond', 'broccoli'],
  'Protein': ['chicken', 'fish', 'egg', 'bean', 'lentil', 'tofu', 'yogurt', 'nut', 'quinoa', 'beef', 'turkey', 'salmon', 'shrimp'],
  'Healthy Fats': ['avocado', 'salmon', 'olive oil', 'nut', 'seed', 'dark chocolate', 'egg', 'walnut', 'almond'],
  'Fiber': ['oat', 'bean', 'lentil', 'berry', 'broccoli', 'quinoa', 'whole grain', 'chia', 'apple', 'pear'],
  'Zinc': ['beef', 'pumpkin seed', 'chickpea', 'cashew', 'yogurt', 'oat', 'crab', 'dark chocolate'],
  'B Vitamins': ['egg', 'salmon', 'spinach', 'whole grain', 'legume', 'poultry', 'banana', 'chicken'],
  'Potassium': ['banana', 'potato', 'avocado', 'spinach', 'bean', 'yogurt', 'sweet potato'],
  'Omega-3': ['salmon', 'sardine', 'walnut', 'flaxseed', 'chia', 'mackerel', 'hemp'],
  'Folate': ['lentil', 'spinach', 'asparagus', 'broccoli', 'beet', 'avocado'],
}

function detectNutrientGaps(): { nutrient: string; score: number; foods: string[] }[] {
  try {
    const mealPlan = JSON.parse(localStorage.getItem('posha_mealplan') || '{}')
    const savedRecipes: Recipe[] = JSON.parse(localStorage.getItem('posha_saved_recipes') || '[]')

    // Collect all ingredients from recent meals
    const allIngredients: string[] = []
    Object.values(mealPlan).forEach((day: any) => {
      Object.values(day).forEach((meal: any) => {
        if (meal?.name) {
          const recipe = savedRecipes.find((r: Recipe) => r.name === meal.name)
          if (recipe?.ingredients) {
            allIngredients.push(...recipe.ingredients.map((i: string) => i.toLowerCase()))
          }
        }
      })
    })

    const ingredientText = allIngredients.join(' ')

    // Score each nutrient based on how well it's covered
    const gaps = NUTRIENT_OPTIONS.map((nutrient) => {
      const foods = NUTRIENT_FOOD_MAP[nutrient] || []
      const found = foods.filter((f) => ingredientText.includes(f))
      const score = foods.length > 0 ? Math.round((found.length / foods.length) * 100) : 0
      return { nutrient, score, foods }
    })

    // Sort by lowest coverage first
    return gaps.sort((a, b) => a.score - b.score)
  } catch {
    // If no meal plan data, return all nutrients as gaps
    return NUTRIENT_OPTIONS.map((n) => ({
      nutrient: n,
      score: 0,
      foods: NUTRIENT_FOOD_MAP[n] || [],
    }))
  }
}

const SAVED_RECIPES_KEY = 'posha_saved_recipes'
const categories = ['breakfast', 'lunch', 'dinner', 'snack']

function saveRecipeToStorage(recipe: Recipe) {
  try {
    const saved: Recipe[] = JSON.parse(localStorage.getItem(SAVED_RECIPES_KEY) || '[]')
    if (saved.some((r) => r.name === recipe.name)) return
    saved.unshift({ ...recipe, savedAt: new Date().toISOString() })
    localStorage.setItem(SAVED_RECIPES_KEY, JSON.stringify(saved))
  } catch { /* ignore */ }
}

// ── SearchableMultiSelect ────────────────────────────────────────────
function SearchableMultiSelect({
  label,
  icon: Icon,
  options,
  selected,
  onChange,
}: {
  label: string
  icon: React.ComponentType<{ className?: string }>
  options: string[]
  selected: string[]
  onChange: (v: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = options.filter((opt) =>
    opt.toLowerCase().includes(search.toLowerCase())
  )

  function toggle(opt: string) {
    onChange(
      selected.includes(opt)
        ? selected.filter((s) => s !== opt)
        : [...selected, opt],
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(!open); setSearch('') }}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all border ${
          selected.length > 0
            ? 'bg-primary/10 border-primary/30 text-primary'
            : 'bg-card-bg border-border text-foreground hover:bg-background'
        }`}
      >
        <Icon className="w-4 h-4" />
        {label}
        {selected.length > 0 && (
          <span className="bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {selected.length}
          </span>
        )}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 bg-card-bg border border-border rounded-xl shadow-lg z-50 w-64">
            {/* Search input */}
            <div className="p-2 border-b border-border">
              <div className="flex items-center gap-2 px-2 py-1.5 bg-background rounded-lg">
                <Search className="w-3.5 h-3.5 text-muted-foreground-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Search ${label.toLowerCase()}...`}
                  className="bg-transparent outline-none text-sm text-foreground w-full placeholder-muted-foreground"
                  autoFocus
                />
              </div>
            </div>
            {/* Options list */}
            <div className="max-h-52 overflow-y-auto p-1">
              {filtered.length > 0 ? filtered.map((opt) => (
                <button
                  key={opt}
                  onClick={() => toggle(opt)}
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                    selected.includes(opt)
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-foreground hover:bg-background'
                  }`}
                >
                  {opt}
                </button>
              )) : (
                <p className="px-3 py-4 text-xs text-muted-foreground-foreground text-center">No matches</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── Nutrient Smart Panel ─────────────────────────────────────────────
function NutrientSmartPanel({
  gaps,
  onClose,
}: {
  gaps: { nutrient: string; score: number; foods: string[] }[]
  onClose: () => void
}) {
  const topGaps = gaps.filter((g) => g.score < 50).slice(0, 5)
  const good = gaps.filter((g) => g.score >= 70)

  return (
    <div className="bg-card-bg border border-primary/20 rounded-2xl p-5 mb-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          Nutrient Smart — Your Deficiency Report
        </h3>
        <button onClick={onClose} className="p-1 hover:bg-background rounded-lg">
          <X className="w-4 h-4 text-muted-foreground-foreground" />
        </button>
      </div>
      <p className="text-xs text-muted-foreground-foreground mb-4">
        Based on your recent meal plan, here are nutrients that need attention. Recipes below are sorted to address your biggest gaps first.
      </p>

      {topGaps.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-amber-700 mb-2 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Low coverage — prioritized in results
          </p>
          <div className="flex flex-wrap gap-1.5">
            {topGaps.map((g) => (
              <span
                key={g.nutrient}
                className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  g.score < 20
                    ? 'bg-red-100 text-red-700 border border-red-200'
                    : 'bg-amber-100 text-amber-700 border border-amber-200'
                }`}
              >
                {g.nutrient} ({g.score}%)
              </span>
            ))}
          </div>
        </div>
      )}

      {good.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Well covered
          </p>
          <div className="flex flex-wrap gap-1.5">
            {good.map((g) => (
              <span key={g.nutrient} className="text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-700 border border-green-200 font-medium">
                {g.nutrient} ({g.score}%)
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Recipe Detail Modal ──────────────────────────────────────────────
function RecipeDetailModal({
  recipe,
  onClose,
  onSave,
  isSaved,
}: {
  recipe: Recipe
  onClose: () => void
  onSave: (r: Recipe) => void
  isSaved: boolean
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card-bg rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <FluentEmoji emoji={recipe.emoji} size={48} />
              <div>
                <h2 className="text-xl font-bold text-foreground">{recipe.name}</h2>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {recipe.cuisine}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {recipe.prepTime}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-background rounded-xl"><X className="w-5 h-5 text-muted-foreground-foreground" /></button>
          </div>

          <p className="text-sm text-muted-foreground mb-4">{recipe.description}</p>

          {/* Estimated Nutrition */}
          <div className="flex gap-4 mb-4 p-3 bg-background rounded-xl">
            {[
              { label: 'Calories', value: `${280 + recipe.ingredients.length * 25}`, unit: 'cal' },
              { label: 'Protein', value: `${8 + recipe.ingredients.length * 3}`, unit: 'g' },
              { label: 'Carbs', value: `${10 + recipe.ingredients.length * 5}`, unit: 'g' },
              { label: 'Fat', value: `${5 + recipe.ingredients.length * 2}`, unit: 'g' },
            ].map((m) => (
              <div key={m.label} className="text-center flex-1">
                <p className="text-lg font-bold text-foreground">{m.value}</p>
                <p className="text-[10px] text-muted-foreground-foreground">{m.label} ({m.unit})</p>
              </div>
            ))}
          </div>

          {recipe.nutrients?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {recipe.nutrients.map((n) => (
                <span key={n} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{n}</span>
              ))}
            </div>
          )}

          <h4 className="text-sm font-semibold text-foreground mb-2">Ingredients</h4>
          <ul className="space-y-1.5 mb-4">
            {recipe.ingredients?.map((ing, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                {ing}
              </li>
            ))}
          </ul>

          <h4 className="text-sm font-semibold text-foreground mb-2">Instructions</h4>
          <ol className="space-y-2 mb-6">
            {recipe.instructions?.map((step, i) => (
              <li key={i} className="flex gap-2 text-sm text-foreground">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>

          <button
            onClick={() => onSave(recipe)}
            disabled={isSaved}
            className={`w-full py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
              isSaved ? 'bg-background text-muted-foreground cursor-default' : 'bg-primary text-white hover:bg-primary/80'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            {isSaved ? 'Already Saved' : 'Save to My Recipes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────
export default function CookbookPage() {
  const { hasPro } = useBillingAccess()
  const [category, setCategory] = useState('lunch')
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([])
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([])
  const [nutrientSmart, setNutrientSmart] = useState(false)
  const [nutrientGaps, setNutrientGaps] = useState<{ nutrient: string; score: number; foods: string[] }[]>([])
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [savedNames, setSavedNames] = useState<Set<string>>(new Set())
  const [shuffleSeed, setShuffleSeed] = useState(0)

  // Load saved recipe names
  useEffect(() => {
    try {
      const saved: Recipe[] = JSON.parse(localStorage.getItem(SAVED_RECIPES_KEY) || '[]')
      setSavedNames(new Set(saved.map((r) => r.name)))
    } catch { /* ignore */ }
  }, [])

  // Detect nutrient gaps when Nutrient Smart is activated
  useEffect(() => {
    if (nutrientSmart) {
      setNutrientGaps(detectNutrientGaps())
    }
  }, [nutrientSmart])

  // Filter and sort recipes (pure computation — no side effects)
  const recipes = useMemo(() => {
    let filtered = RECIPES.filter((r) => r.category === category)

    if (selectedCuisines.length > 0) {
      filtered = filtered.filter((r) => selectedCuisines.includes(r.cuisine))
    }

    if (selectedIngredients.length > 0) {
      filtered = filtered.filter((r) =>
        selectedIngredients.some((ing) =>
          r.ingredients.some((ri) => ri.toLowerCase().includes(ing.toLowerCase())),
        ),
      )
    }

    // Nutrient Smart: sort by how many deficient nutrients the recipe addresses
    if (nutrientSmart && nutrientGaps.length > 0) {
      const deficientNutrients = nutrientGaps
        .filter((g) => g.score < 50)
        .map((g) => g.nutrient)

      filtered = filtered
        .map((r) => ({
          ...r,
          _score: r.nutrients.filter((n) => deficientNutrients.includes(n)).length,
        }))
        .sort((a, b) => b._score - a._score)
    }

    // Shuffle when Surprise Me is pressed (works with all filters including Nutrient Smart)
    if (shuffleSeed > 0) {
      filtered = [...filtered].sort(() => Math.random() - 0.5)
    }

    // Show only 5 recipes at a time
    return filtered.slice(0, 5)
  }, [category, selectedCuisines, selectedIngredients, nutrientSmart, nutrientGaps, shuffleSeed])

  function handleSaveRecipe(recipe: Recipe) {
    saveRecipeToStorage(recipe)
    setSavedNames((prev) => new Set([...prev, recipe.name]))
  }

  function handleSurpriseMe() {
    // Shuffle results while keeping all active filters (cuisine, ingredients, nutrient smart)
    setShuffleSeed((s) => s + 1)
  }

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-primary" />
            Cookbook
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {RECIPES.length} recipes personalized for you
          </p>
        </div>
        <button
          onClick={handleSurpriseMe}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary/80 transition-colors shadow-sm"
        >
          <Shuffle className="w-4 h-4" />
          Surprise Me
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize whitespace-nowrap transition-all ${
              category === cat
                ? 'bg-primary text-white shadow-md'
                : 'bg-card-bg text-foreground border border-border hover:bg-primary/10'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {hasPro ? <SearchableMultiSelect label="Cuisine" icon={Globe} options={CUISINE_OPTIONS} selected={selectedCuisines} onChange={setSelectedCuisines} /> : null}
        {hasPro ? <SearchableMultiSelect label="Ingredients" icon={Carrot} options={INGREDIENT_OPTIONS} selected={selectedIngredients} onChange={setSelectedIngredients} /> : null}

        {/* Nutrient Smart Toggle */}
        <button
          onClick={() => hasPro && setNutrientSmart(!nutrientSmart)}
          disabled={!hasPro}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all border ${
            nutrientSmart
              ? 'bg-amber-100 border-amber-300 text-amber-800'
              : 'bg-card-bg border-border text-foreground hover:bg-background'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Heart className={`w-4 h-4 ${nutrientSmart ? 'text-amber-600 fill-amber-600' : ''}`} />
          Nutrient Smart
          {nutrientSmart && <span className="text-xs">✓</span>}
        </button>
      </div>

      {!hasPro ? (
        <div className="mb-4">
          <UpgradeNotice
            plan="pro"
            title="Pro unlocks advanced cookbook tools"
            description="Cuisine filters, ingredient filters, and Nutrient Smart recipe ranking are available on Pro and above."
          />
        </div>
      ) : null}

      {/* Nutrient Smart Panel */}
      {nutrientSmart && nutrientGaps.length > 0 && (
        <NutrientSmartPanel gaps={nutrientGaps} onClose={() => setNutrientSmart(false)} />
      )}

      {/* Active filter chips */}
      {(selectedCuisines.length > 0 || selectedIngredients.length > 0) && (
        <div className="flex flex-wrap gap-1 items-center mb-4">
          {selectedCuisines.map((c) => (
            <span key={c} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full flex items-center gap-1">
              {c}
              <button onClick={() => setSelectedCuisines((prev) => prev.filter((x) => x !== c))}><X className="w-3 h-3" /></button>
            </span>
          ))}
          {selectedIngredients.map((i) => (
            <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full flex items-center gap-1">
              {i}
              <button onClick={() => setSelectedIngredients((prev) => prev.filter((x) => x !== i))}><X className="w-3 h-3" /></button>
            </span>
          ))}
          <button
            onClick={() => { setSelectedCuisines([]); setSelectedIngredients([]) }}
            className="text-xs text-muted-foreground-foreground hover:text-foreground ml-1"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Recipe Grid */}
      {recipes.length > 0 ? (
        <>
          <p className="text-xs text-muted-foreground-foreground mb-3">
            Showing {recipes.length} recipe{recipes.length !== 1 ? 's' : ''}
            {nutrientSmart ? ' — sorted by nutrient coverage for your gaps' : ''}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recipes.map((recipe, i) => {
              const isSaved = savedNames.has(recipe.name)
              return (
                <div
                  key={recipe.name + i}
                  className="bg-card-bg border border-border rounded-2xl p-4 hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => setSelectedRecipe(recipe)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <FluentEmoji emoji={recipe.emoji} size={36} />
                    <button
                      onClick={(e) => { e.stopPropagation(); if (!isSaved) handleSaveRecipe(recipe) }}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isSaved ? 'text-primary bg-primary/10' : 'text-muted-foreground-foreground hover:text-primary hover:bg-primary/10'
                      }`}
                    >
                      <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                  <h3 className="font-semibold text-foreground text-sm mb-1 line-clamp-2">{recipe.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{recipe.description}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground-foreground">
                      <Clock className="w-3 h-3" /> {recipe.prepTime}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground-foreground">
                      <Globe className="w-3 h-3" /> {recipe.cuisine}
                    </span>
                  </div>
                  {/* Nutrient tags */}
                  {recipe.nutrients?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {recipe.nutrients.slice(0, 3).map((n) => (
                        <span key={n} className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{n}</span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      ) : (
        <div className="text-center py-20 text-muted-foreground-foreground">
          <ChefHat className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No recipes match your filters</p>
          <p className="text-sm mt-1">Try adjusting your cuisine, ingredient, or category filters</p>
        </div>
      )}

      {/* Detail Modal */}
      {selectedRecipe && (
        <RecipeDetailModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          onSave={handleSaveRecipe}
          isSaved={savedNames.has(selectedRecipe.name)}
        />
      )}
    </div>
  )
}
