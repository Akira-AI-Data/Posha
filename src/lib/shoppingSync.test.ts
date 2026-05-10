import { describe, expect, it } from 'vitest'
import { RECIPES } from '@/data/recipes'

function getSyncableIngredientCount(
  mealNames: string[],
  savedRecipes: { name: string; ingredients?: string[] }[] = [],
) {
  const recipeLookup = new Map<string, { ingredients?: string[] }>()

  for (const recipe of RECIPES) {
    recipeLookup.set(recipe.name.toLowerCase(), recipe)
  }

  for (const recipe of savedRecipes) {
    recipeLookup.set(recipe.name.toLowerCase(), recipe)
  }

  let count = 0

  for (const mealName of mealNames) {
    const recipe = recipeLookup.get(mealName.toLowerCase())
    if (!recipe?.ingredients?.length) continue
    count += recipe.ingredients.length
  }

  return count
}

describe('shopping sync recipe lookup', () => {
  it('finds ingredients for cookbook meals even when they are not saved recipes', () => {
    expect(getSyncableIngredientCount(['Italian Margherita Pizza'])).toBeGreaterThan(0)
  })

  it('still allows saved recipes to override or supplement lookup', () => {
    expect(
      getSyncableIngredientCount(['Custom Family Pasta'], [
        { name: 'Custom Family Pasta', ingredients: ['200g pasta', '2 tomatoes'] },
      ]),
    ).toBe(2)
  })
})
