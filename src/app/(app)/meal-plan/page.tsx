'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CalendarDays, ChevronLeft, ChevronRight, Trash2, Plus, X, Search, Bookmark, Globe, Clock, ShoppingCart, Sparkles, Loader2, RotateCcw } from 'lucide-react'
import { FluentEmoji } from '@/components/ui/FluentEmoji'
import { RECIPES, type Recipe } from '@/data/recipes'
import { planNutritionSmartWeek, type PlannerSettings, type BlockedMealSuggestions } from '@/lib/mealPlanner'
import {
  getLocalDateKey,
  getWeekDates,
  loadMealPlan,
  loadTrackerSettings,
  saveMealPlan,
  type MealType,
  type MealPlanData,
  type MealPlanEntry,
} from '@/lib/nutritionTracker'

const SAVED_RECIPES_KEY = 'posha_saved_recipes'
const PANTRY_KEY = 'posha_pantry'
const SHOPPING_KEY = 'posha_shopping'
const REMOVED_SUGGESTIONS_KEY = 'posha_removed_meal_suggestions'
const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']

interface PantryItem {
  id: string
  name: string
  quantity: string
}

interface ShoppingItem {
  id: string
  name: string
  qty: number
  unit: string
  checked: boolean
  addedAt: string
}

// Parse "200g rice noodles" → { qty: 200, unit: 'g', name: 'rice noodles' }
function parseIngredient(raw: string): { qty: number; unit: string; name: string } {
  const s = raw.trim()
  const match = s.match(/^([\d.\/]+)\s*(cups?|tbsp|tsp|oz|g|kg|ml|lb|L)?\s*(.+)$/i)
  if (match) {
    let qty = 0
    if (match[1].includes('/')) {
      const parts = match[1].split('/')
      qty = parseInt(parts[0]) / (parseInt(parts[1]) || 1)
    } else {
      qty = parseFloat(match[1])
    }
    const unitMap: Record<string, string> = {
      cup: 'cups', cups: 'cups', tbsp: 'tbsp', tsp: 'tsp',
      oz: 'oz', g: 'g', kg: 'kg', ml: 'ml', lb: 'lb', l: 'L',
    }
    const unitRaw = (match[2] || '').toLowerCase()
    return { qty: qty || 1, unit: unitMap[unitRaw] || 'pcs', name: match[3].trim() }
  }
  return { qty: 1, unit: 'pcs', name: s }
}

function loadPantry(): PantryItem[] {
  try { return JSON.parse(localStorage.getItem(PANTRY_KEY) || '[]') } catch { return [] }
}

function loadShopping(): ShoppingItem[] {
  try { return JSON.parse(localStorage.getItem(SHOPPING_KEY) || '[]') } catch { return [] }
}

function saveShopping(items: ShoppingItem[]) {
  localStorage.setItem(SHOPPING_KEY, JSON.stringify(items))
}

function addMissingIngredientsToShopping(ingredients: string[]) {
  const pantry = loadPantry()
  const shopping = loadShopping()

  const pantryNames = new Set(pantry.map((p) => p.name.toLowerCase().trim()))
  const shoppingNames = new Set(shopping.map((s) => s.name.toLowerCase().trim()))

  const updated = [...shopping]
  let addedCount = 0

  for (const ing of ingredients) {
    if (!ing.trim()) continue
    const parsed = parseIngredient(ing)
    const lower = parsed.name.toLowerCase()

    // Skip if in pantry (exact or partial match)
    if (pantryNames.has(lower)) continue
    const inPantry = Array.from(pantryNames).some(p => p.includes(lower) || lower.includes(p))
    if (inPantry) continue

    // If already in shopping with same unit, sum quantities
    const existingIdx = updated.findIndex(
      (s) => s.name.toLowerCase().trim() === lower && s.unit === parsed.unit && !s.checked
    )
    if (existingIdx >= 0) {
      updated[existingIdx] = { ...updated[existingIdx], qty: updated[existingIdx].qty + parsed.qty }
      continue
    }

    // Skip if name already in shopping (different unit)
    if (shoppingNames.has(lower)) continue

    updated.unshift({
      id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
      name: parsed.name,
      qty: parsed.qty,
      unit: parsed.unit,
      checked: false,
      addedAt: new Date().toISOString(),
    })
    shoppingNames.add(lower)
    addedCount++
  }

  if (addedCount > 0 || updated.length !== shopping.length) {
    saveShopping(updated)
  }
  return addedCount
}

function loadPlannerSettings(): PlannerSettings {
  return loadTrackerSettings()
}

function loadSavedRecipes(): Recipe[] {
  try {
    return JSON.parse(localStorage.getItem(SAVED_RECIPES_KEY) || '[]')
  } catch {
    return []
  }
}

function loadRemovedSuggestions(): BlockedMealSuggestions {
  try {
    return JSON.parse(localStorage.getItem(REMOVED_SUGGESTIONS_KEY) || '{}')
  } catch {
    return {}
  }
}

function saveRemovedSuggestions(data: BlockedMealSuggestions) {
  localStorage.setItem(REMOVED_SUGGESTIONS_KEY, JSON.stringify(data))
}

// ── Recipe Picker Modal ──────────────────────────────────────────────
function RecipePicker({
  mealType,
  onSelect,
  onClose,
}: {
  mealType: MealType
  onSelect: (recipe: Recipe) => void
  onClose: () => void
}) {
  const [search, setSearch] = useState('')
  const savedRecipes = loadSavedRecipes()

  const filtered = savedRecipes.filter((r) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      r.name?.toLowerCase().includes(q) ||
      r.cuisine?.toLowerCase().includes(q) ||
      r.ingredients?.some((ing) => ing.toLowerCase().includes(q))
    )
  })

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-card-bg rounded-3xl max-w-md w-full max-h-[80vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-primary" />
              Pick from My Recipes
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-background rounded-xl transition-colors">
              <X className="w-5 h-5 text-muted-foreground-foreground" />
            </button>
          </div>
          {mealType && (
            <p className="text-xs text-muted-foreground-foreground mb-3 capitalize">Adding to: {mealType}</p>
          )}
          <div className="flex items-center gap-2 px-3 py-2 bg-background rounded-xl">
            <Search className="w-4 h-4 text-muted-foreground-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search recipes..."
              className="bg-transparent outline-none text-sm text-foreground w-full placeholder-muted-foreground"
              autoFocus
            />
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-2">
          {filtered.length > 0 ? (
            filtered.map((recipe) => (
              <button
                key={recipe.name}
                onClick={() => onSelect(recipe)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-primary/10 transition-colors text-left"
              >
                <FluentEmoji emoji={recipe.emoji || '\ud83c\udf7d\ufe0f'} size={28} className="flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-foreground text-sm truncate">{recipe.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground-foreground">
                      <Globe className="w-3 h-3" /> {recipe.cuisine}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground-foreground">
                      <Clock className="w-3 h-3" /> {recipe.prepTime}
                    </span>
                  </div>
                </div>
              </button>
            ))
          ) : savedRecipes.length > 0 ? (
            <div className="text-center py-8 text-muted-foreground-foreground">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No recipes match your search</p>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground-foreground">
              <Bookmark className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No saved recipes yet</p>
              <p className="text-xs mt-1">Add recipes from the Cookbook first</p>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-border">
          <Link
            href="/cookbook"
            className="block w-full text-center py-2 text-sm text-primary font-medium hover:bg-primary/10 rounded-xl transition-colors"
          >
            Browse Cookbook for new recipes
          </Link>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────
export default function MealPlanPage() {
  const [mealPlan, setMealPlan] = useState<MealPlanData>(() => {
    if (typeof window === 'undefined') return {}
    return loadMealPlan()
  })
  const [weekOffset, setWeekOffset] = useState(0)
  const [pickerSlot, setPickerSlot] = useState<{ date: string; mealType: MealType } | null>(null)
  const [planningWeek, setPlanningWeek] = useState(false)
  const [statusNotice, setStatusNotice] = useState<{ message: string; href?: string; cta?: string } | null>(null)
  const [removedSuggestions, setRemovedSuggestions] = useState<BlockedMealSuggestions>(() => {
    if (typeof window === 'undefined') return {}
    return loadRemovedSuggestions()
  })

  const baseDate = new Date()
  baseDate.setDate(baseDate.getDate() + weekOffset * 7)
  const weekDates = getWeekDates(baseDate)
  const todayStr = getLocalDateKey()

  function getMeal(date: string, mealType: MealType): MealPlanEntry | null {
    return mealPlan[date]?.[mealType] || null
  }

  function handleSlotClick(date: string, mealType: MealType) {
    setPickerSlot({ date, mealType })
  }

  function showStatusNotice(message: string, options?: { href?: string; cta?: string }) {
    setStatusNotice({ message, ...options })
    setTimeout(() => setStatusNotice(null), 4000)
  }

  function handlePickRecipe(recipe: Recipe) {
    if (!pickerSlot) return
    const { date, mealType } = pickerSlot
    const updated = { ...mealPlan }
    if (!updated[date]) updated[date] = {}
    updated[date][mealType] = {
      name: recipe.name,
      emoji: recipe.emoji,
      cuisine: recipe.cuisine,
      prepTime: recipe.prepTime,
    }
    setMealPlan(updated)
    saveMealPlan(updated)
    if (removedSuggestions[date]?.[mealType]?.length) {
      const nextRemoved = { ...removedSuggestions, [date]: { ...(removedSuggestions[date] || {}), [mealType]: [] } }
      setRemovedSuggestions(nextRemoved)
      saveRemovedSuggestions(nextRemoved)
    }
    setPickerSlot(null)

    // Auto-add missing ingredients to shopping list
    if (recipe.ingredients && recipe.ingredients.length > 0) {
      const added = addMissingIngredientsToShopping(recipe.ingredients)
      if (added > 0) {
        showStatusNotice(
          `${added} ingredient${added > 1 ? 's' : ''} added to Shopping List`,
          { href: '/shopping', cta: 'View' }
        )
      }
    }
  }

  function removeMeal(date: string, mealType: MealType) {
    const removedMealName = mealPlan[date]?.[mealType]?.name
    const updated = { ...mealPlan }
    if (updated[date]) {
      delete updated[date][mealType]
      if (Object.keys(updated[date]).length === 0) delete updated[date]
    }
    setMealPlan(updated)
    saveMealPlan(updated)

    if (removedMealName) {
      const nextRemoved: BlockedMealSuggestions = {
        ...removedSuggestions,
        [date]: {
          ...(removedSuggestions[date] || {}),
          [mealType]: Array.from(new Set([...(removedSuggestions[date]?.[mealType] || []), removedMealName])),
        },
      }
      setRemovedSuggestions(nextRemoved)
      saveRemovedSuggestions(nextRemoved)
    }
  }

  function clearCurrentWeek() {
    const updated = { ...mealPlan }
    const nextRemoved = { ...removedSuggestions }

    for (const date of weekDates) {
      delete updated[date]
      delete nextRemoved[date]
    }

    setMealPlan(updated)
    saveMealPlan(updated)
    setRemovedSuggestions(nextRemoved)
    saveRemovedSuggestions(nextRemoved)
    showStatusNotice('Current week cleared.')
  }

  function handlePlanMyWeek() {
    setPlanningWeek(true)

    const targetWeekDates = [...weekDates]
    const settings = loadPlannerSettings()
    const result = planNutritionSmartWeek(RECIPES, targetWeekDates, settings, removedSuggestions)
    const updated = { ...mealPlan }

    for (const date of targetWeekDates) {
      const existingDayPlan = updated[date] || {}
      const plannedDay = result.plan[date] || {}

      for (const mealType of mealTypes) {
        if (!existingDayPlan[mealType] && plannedDay[mealType]) {
          existingDayPlan[mealType] = plannedDay[mealType]
        }
      }

      if (Object.keys(existingDayPlan).length > 0) updated[date] = existingDayPlan
    }

    setMealPlan(updated)
    saveMealPlan(updated)

    const shoppingIngredients = result.selectedRecipes.flatMap((recipe) => recipe.ingredients ?? [])
    const added = shoppingIngredients.length > 0
      ? addMissingIngredientsToShopping(shoppingIngredients)
      : 0
    const restrictionSummary =
      result.restrictions.summaryLabels.length > 0
        ? ` using ${result.restrictions.summaryLabels.slice(0, 3).join(', ')}${
            result.restrictions.summaryLabels.length > 3 ? ', and more' : ''
          }`
        : ''

    if (added > 0) {
      showStatusNotice(
        `Week planned${restrictionSummary}. ${added} ingredient${added > 1 ? 's' : ''} added to Shopping List.`,
        { href: '/shopping', cta: 'View' }
      )
    } else if (result.unmetMealTypes.length > 0) {
      showStatusNotice(
        `Week planned${restrictionSummary}, but some ${result.unmetMealTypes.join(', ')} slots were left open.`
      )
    } else {
      showStatusNotice(`Week planned with nutrition-smart meals${restrictionSummary}.`)
    }

    setPlanningWeek(false)
  }

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <CalendarDays className="w-6 h-6 text-primary" />
          Meal Planner
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="p-2 hover:bg-background rounded-xl transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className="px-3 py-1.5 text-sm font-medium text-primary bg-primary/10 rounded-xl hover:bg-primary/20 transition-colors"
          >
            This Week
          </button>
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="p-2 hover:bg-background rounded-xl transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="mb-5 flex justify-center">
        <div className="flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
          <button
            onClick={handlePlanMyWeek}
            disabled={planningWeek}
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {planningWeek ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Plan My Week
          </button>
          <button
            onClick={clearCurrentWeek}
            className="px-4 py-2 text-sm font-medium text-primary bg-white border border-primary/20 rounded-xl hover:bg-primary/10 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            Clear This Week
          </button>
        </div>
      </div>

      {/* Hint */}
      <div className="flex items-center gap-2 mb-5 px-3 py-2.5 bg-primary/10 border border-primary/20 rounded-xl">
        <Bookmark className="w-4 h-4 text-primary flex-shrink-0" />
        <p className="text-xs text-foreground">
          Tap <Plus className="w-3 h-3 inline" /> on any slot to add from{' '}
          <Link href="/my-recipes" className="font-semibold underline underline-offset-2 text-primary">My Recipes</Link>
          {' '}or discover new ones in the{' '}
          <Link href="/cookbook" className="font-semibold underline underline-offset-2 text-primary">Cookbook</Link>
          .{' '}
          <button
            onClick={handlePlanMyWeek}
            disabled={planningWeek}
            className="font-semibold underline underline-offset-2 text-primary disabled:opacity-70"
          >
            Plan My Week
          </button>{' '}
          fills the current week using your saved allergies and excluded ingredients. Clear This Week resets the visible week, and removed suggestions will be replaced with different meals next time.
        </p>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Day Headers */}
          <div className="grid grid-cols-8 gap-2 mb-2">
            <div className="text-xs font-medium text-muted-foreground-foreground px-2 py-1" />
            {weekDates.map((date) => {
              const d = new Date(date + 'T00:00:00')
              const isToday = date === todayStr
              return (
                <div
                  key={date}
                  className={`text-center px-2 py-2 rounded-xl text-xs font-medium ${
                    isToday ? 'bg-primary/10 text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  <div className="font-semibold">{d.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                  <div className="text-lg font-bold">{d.getDate()}</div>
                </div>
              )
            })}
          </div>

          {/* Meal Rows */}
          {mealTypes.map((mealType) => (
            <div key={mealType} className="grid grid-cols-8 gap-2 mb-2">
              <div className="flex items-center px-2 text-xs font-medium text-muted-foreground-foreground capitalize">
                {mealType}
              </div>
              {weekDates.map((date) => {
                const meal = getMeal(date, mealType)
                return (
                  <div
                    key={`${date}-${mealType}`}
                    className="min-h-[80px] bg-card-bg border border-border rounded-xl p-2 group relative"
                  >
                    {meal ? (
                      <div className="text-xs">
                        <span className="text-lg">{meal.emoji || '\ud83c\udf7d\ufe0f'}</span>
                        <p className="font-medium text-foreground mt-1 line-clamp-2 leading-tight">
                          {meal.name}
                        </p>
                        <button
                          onClick={() => removeMeal(date, mealType)}
                          className="absolute top-1 right-1 p-1 bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3 text-red-400" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSlotClick(date, mealType)}
                        className="w-full h-full flex items-center justify-center text-muted-foreground-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Recipe Picker Modal */}
      {pickerSlot && (
        <RecipePicker
          mealType={pickerSlot.mealType}
          onSelect={handlePickRecipe}
          onClose={() => setPickerSlot(null)}
        />
      )}

      {/* Status Toast */}
      {statusNotice && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Link
            href={statusNotice.href || '/shopping'}
            className="flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-xl shadow-lg shadow-accent/20 text-sm font-medium hover:bg-primary/80 transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            {statusNotice.message}
            <span className="text-white/70 text-xs ml-1">→ View</span>
          </Link>
        </div>
      )}
    </div>
  )
}
