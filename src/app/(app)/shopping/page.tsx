'use client'

import { useState, useEffect } from 'react'
import { ShoppingCart, Plus, Trash2, Check, ArrowRight, RefreshCw, ShoppingBag, PackageOpen, CheckCircle2 } from 'lucide-react'
import { ReminderStatus } from '@/components/shopping/ReminderStatus'
import { RECIPES, type Recipe } from '@/data/recipes'

// Capitalise first letter of every word
function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase())
}

interface ShoppingItem {
  id: string
  name: string
  qty: number
  unit: string
  checked: boolean
  addedAt: string
  source?: 'manual' | 'meal-plan'
}

interface PantryItem {
  id: string
  name: string
  quantity: string
  unit?: string
  addedAt: string
}

interface MealPlanData {
  [date: string]: {
    [mealType: string]: { name: string; emoji?: string; cuisine?: string; prepTime?: string }
  }
}

const SHOPPING_KEY = 'posha_shopping'
const MEALPLAN_KEY = 'posha_mealplan'
const PANTRY_KEY = 'posha_pantry'
const SAVED_RECIPES_KEY = 'posha_saved_recipes'

const UNITS = ['pcs', 'g', 'kg', 'ml', 'L', 'cups', 'tbsp', 'tsp', 'oz', 'lb']

function loadShopping(): ShoppingItem[] {
  try {
    const raw = JSON.parse(localStorage.getItem(SHOPPING_KEY) || '[]')
    // Migrate old format (quantity: string) → new format (qty: number, unit: string)
    return raw.map((item: any) => ({
      ...item,
      qty: typeof item.qty === 'number' ? item.qty : (parseFloat(item.quantity) || 1),
      unit: item.unit || 'pcs',
    }))
  } catch {
    return []
  }
}

function saveShopping(items: ShoppingItem[]) {
  localStorage.setItem(SHOPPING_KEY, JSON.stringify(items))
}

function loadPantry(): PantryItem[] {
  try { return JSON.parse(localStorage.getItem(PANTRY_KEY) || '[]') } catch { return [] }
}

function savePantry(items: PantryItem[]) {
  localStorage.setItem(PANTRY_KEY, JSON.stringify(items))
}

function loadSavedRecipes(): Recipe[] {
  try {
    return JSON.parse(localStorage.getItem(SAVED_RECIPES_KEY) || '[]')
  } catch {
    return []
  }
}

function getWeekDates(): string[] {
  const today = new Date()
  const day = today.getDay()
  const diff = today.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(today)
  monday.setDate(diff)
  const dates: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    dates.push(d.toISOString().split('T')[0])
  }
  return dates
}

function genId() {
  return Date.now().toString() + Math.random().toString(36).slice(2, 8)
}

// Parse ingredient string like "200g rice noodles" or "2 cups flour" or "1/4 cup peanuts"
function parseIngredient(raw: string): { qty: number; unit: string; name: string } {
  const s = raw.trim()

  // Pattern: number (optional space) unit (space) name
  // Handles: "200g shrimp", "2 cups flour", "1/4 cup peanuts", "2 tbsp fish sauce", "1 lemon"
  // Unit must be followed by whitespace (or end) so "1 lemon" doesn't match "l" as unit
  const match = s.match(/^([\d.\/]+)(?:\s*(cups?|tbsp|tsp|oz|g|kg|ml|lb|L|bunch|cloves?|cans?|slices?|pieces?|stalks?)(?=\s|$))?\s*(.+)$/i)

  if (match) {
    let qty = 0
    if (match[1].includes('/')) {
      const parts = match[1].split('/')
      qty = parseInt(parts[0]) / (parseInt(parts[1]) || 1)
    } else {
      qty = parseFloat(match[1])
    }

    const unitRaw = (match[2] || '').toLowerCase()
    // Normalize plural units
    const unitMap: Record<string, string> = {
      cup: 'cups', cups: 'cups', tbsp: 'tbsp', tsp: 'tsp',
      oz: 'oz', g: 'g', kg: 'kg', ml: 'ml', lb: 'lb', l: 'L',
      bunch: 'pcs', clove: 'pcs', cloves: 'pcs', can: 'pcs', cans: 'pcs',
      slice: 'pcs', slices: 'pcs', piece: 'pcs', pieces: 'pcs', stalk: 'pcs', stalks: 'pcs',
    }
    const unit = unitMap[unitRaw] || (unitRaw || 'pcs')
    const name = match[3].trim()

    return { qty: qty || 1, unit, name }
  }

  return { qty: 1, unit: 'pcs', name: s }
}

export default function ShoppingPage() {
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [name, setName] = useState('')
  const [qty, setQty] = useState('')
  const [unit, setUnit] = useState('pcs')
  const [toast, setToast] = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  function handleClearAll() {
    if (items.length === 0) return
    if (!confirm('Clear all shopping list items? This cannot be undone.')) return
    setItems([])
    saveShopping([])
    showToast('Shopping list cleared')
  }

  useEffect(() => {
    setItems(loadShopping())
  }, [])

  // Add or merge item — if same name+unit exists, sum quantities
  function addOrMerge(itemName: string, itemQty: number, itemUnit: string): ShoppingItem[] {
    const lower = itemName.toLowerCase().trim()
    const existing = items.find(
      (i) => i.name.toLowerCase().trim() === lower && i.unit === itemUnit && !i.checked
    )
    if (existing) {
      return items.map((i) =>
        i.id === existing.id ? { ...i, qty: i.qty + itemQty } : i
      )
    }
    return [
      {
        id: genId(),
        name: itemName.trim(),
        qty: itemQty,
        unit: itemUnit,
        checked: false,
        addedAt: new Date().toISOString(),
        source: 'manual',
      },
      ...items,
    ]
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    const q = parseFloat(qty) || 1
    const updated = addOrMerge(trimmed, q, unit)
    setItems(updated)
    saveShopping(updated)
    setName('')
    setQty('')
    setUnit('pcs')
  }

  function toggleItem(id: string) {
    const updated = items.map((item) =>
      item.id === id ? { ...item, checked: !item.checked } : item
    )
    setItems(updated)
    saveShopping(updated)
  }

  function removeItem(id: string) {
    const updated = items.filter((item) => item.id !== id)
    setItems(updated)
    saveShopping(updated)
  }

  function moveToPantry(item: ShoppingItem) {
    const pantry = loadPantry()
    if (!pantry.some((p) => p.name.toLowerCase() === item.name.toLowerCase())) {
      pantry.unshift({
        id: genId(),
        name: item.name,
        quantity: String(item.qty),
        unit: item.unit,
        addedAt: new Date().toISOString(),
      })
      savePantry(pantry)
    }
    const updated = items.filter((i) => i.id !== item.id)
    setItems(updated)
    saveShopping(updated)
  }

  function moveAllCheckedToPantry() {
    const checkedItems = items.filter((i) => i.checked)
    const pantry = loadPantry()
    const existingNames = new Set(pantry.map((p) => p.name.toLowerCase()))

    for (const item of checkedItems) {
      if (!existingNames.has(item.name.toLowerCase())) {
        pantry.unshift({
          id: genId(),
          name: item.name,
          quantity: String(item.qty),
          unit: item.unit,
          addedAt: new Date().toISOString(),
        })
        existingNames.add(item.name.toLowerCase())
      }
    }
    savePantry(pantry)
    const updated = items.filter((i) => !i.checked)
    setItems(updated)
    saveShopping(updated)
  }

  function handleSync() {
    try {
      const mealPlan: MealPlanData = JSON.parse(localStorage.getItem(MEALPLAN_KEY) || '{}')
      const savedRecipes = loadSavedRecipes()
      const recipeLookup = new Map<string, Recipe>()
      for (const recipe of RECIPES) {
        recipeLookup.set(recipe.name.toLowerCase(), recipe)
      }
      for (const recipe of savedRecipes) {
        recipeLookup.set(recipe.name.toLowerCase(), recipe)
      }
      const weekDates = getWeekDates()
      const pantry = loadPantry()
      const pantryNames = new Set(pantry.map((p) => p.name.toLowerCase()))

      // 1. Aggregate required qty per (name|unit) from meal plan
      const required = new Map<string, { name: string; qty: number; unit: string }>()
      for (const date of weekDates) {
        const dayPlan = mealPlan[date]
        if (!dayPlan) continue
        for (const mealType of Object.keys(dayPlan)) {
          const meal = dayPlan[mealType]
          if (!meal?.name) continue
          const recipe = recipeLookup.get(meal.name.toLowerCase())
          if (!recipe?.ingredients) continue
          for (const ing of recipe.ingredients as string[]) {
            const parsed = parseIngredient(ing)
            if (!parsed.name || pantryNames.has(parsed.name.toLowerCase())) continue
            const key = `${parsed.name.toLowerCase()}|${parsed.unit}`
            const prev = required.get(key)
            if (prev) prev.qty += parsed.qty
            else required.set(key, { name: parsed.name, qty: parsed.qty, unit: parsed.unit })
          }
        }
      }

      // 2. Upsert: SET (not add) qty for meal-plan items; insert new; leave manual items alone
      const updated = [...items]
      for (const [key, req] of required) {
        const idx = updated.findIndex(
          (i) =>
            !i.checked &&
            i.source === 'meal-plan' &&
            i.name.toLowerCase() === req.name.toLowerCase() &&
            i.unit === req.unit,
        )
        if (idx >= 0) {
          updated[idx] = { ...updated[idx], qty: req.qty }
        } else {
          // Skip insert if user already has manual entry for same name (any unit)
          const hasManual = updated.some(
            (i) => !i.checked && i.source !== 'meal-plan' && i.name.toLowerCase() === req.name.toLowerCase(),
          )
          if (hasManual) continue
          updated.unshift({
            id: genId(),
            name: req.name,
            qty: req.qty,
            unit: req.unit,
            checked: false,
            addedAt: new Date().toISOString(),
            source: 'meal-plan',
          })
        }
      }

      setItems(updated)
      saveShopping(updated)
      if (required.size === 0) {
        showToast('No ingredients to sync — meal plan is empty')
      } else {
        showToast(`Synced ${required.size} ingredient${required.size === 1 ? '' : 's'} from meal plan`)
      }
    } catch {
      showToast('Sync failed — try again')
    }
  }

  const unchecked = items.filter((i) => !i.checked)
  const checked = items.filter((i) => i.checked)

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-primary" />
          Shopping List
        </h1>
        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-xl font-medium text-sm hover:bg-muted/80 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Clear All
            </button>
          )}
          <button
            onClick={handleSync}
            className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl font-medium text-sm hover:bg-primary/20 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Sync from Meal Plan
          </button>
        </div>
      </div>

      {toast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-primary text-white rounded-xl shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}

      <ReminderStatus />

      {/* Add Form — Item + Qty + Unit */}
      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Item name..."
          className="flex-1 px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
        />
        <input
          type="number"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          placeholder="Qty"
          min="0"
          step="any"
          className="w-20 px-3 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm text-center"
        />
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          className="w-20 px-2 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm bg-card-bg"
        >
          {UNITS.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={!name.trim()}
          className="px-4 py-3 bg-foreground text-white rounded-xl hover:bg-foreground/80 transition-colors flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </form>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBag className="w-12 h-12 text-muted-foreground-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-2">Shopping list is empty!</p>
          <p className="text-xs text-muted-foreground-foreground">Add items manually or sync from your meal plan</p>
        </div>
      ) : (
        <>
          {/* Checked Items */}
          {checked.length > 0 && (
            <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Purchased ({checked.length})
                </p>
                <button
                  onClick={moveAllCheckedToPantry}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 rounded-xl hover:bg-primary/20 transition-colors"
                >
                  <PackageOpen className="w-3.5 h-3.5" /> Move All to Pantry
                </button>
              </div>
              <div className="space-y-2">
                {checked.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2 bg-background rounded-xl px-4 py-3 border border-border group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <button
                        onClick={() => toggleItem(item.id)}
                        className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0"
                      >
                        <Check className="w-3 h-3 text-white" />
                      </button>
                      <span className="text-sm text-muted-foreground line-through">{titleCase(item.name)}</span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {item.qty} {item.unit}
                      </span>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 text-muted-foreground-foreground hover:text-red-500 rounded-lg transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unchecked Items */}
          <div className="space-y-2 mb-6">
            {unchecked.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 bg-card-bg rounded-xl px-4 py-3 border border-border group"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <button
                    onClick={() => toggleItem(item.id)}
                    className="w-5 h-5 rounded-full border-2 border-border hover:border-primary transition-colors flex-shrink-0"
                  />
                  <span className="text-sm font-medium text-foreground">{titleCase(item.name)}</span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {item.qty} {item.unit}
                  </span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => moveToPantry(item)}
                    className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                    title="Move to Pantry"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 text-muted-foreground-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
