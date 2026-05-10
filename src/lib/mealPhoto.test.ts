import { describe, expect, it } from 'vitest';
import { buildMealPhotoPrompt, parseMealPhotoAnalysis } from './mealPhoto';

describe('mealPhoto helpers', () => {
  it('parses structured JSON response', () => {
    const result = parseMealPhotoAnalysis(`{
      "name": "Paneer rice bowl",
      "serving": "1 bowl",
      "estimatedGrams": 380,
      "calories": 540,
      "protein": 19,
      "carbs": 62,
      "fat": 21,
      "ingredients": ["paneer", "rice", "peas"],
      "confidence": 0.71,
      "notes": "Oil amount estimated."
    }`);

    expect(result).toMatchObject({
      name: 'Paneer rice bowl',
      serving: '1 bowl',
      estimatedGrams: 380,
      calories: 540,
      protein: 19,
      carbs: 62,
      fat: 21,
      ingredients: ['paneer', 'rice', 'peas'],
      confidence: 0.71,
    });
  });

  it('normalizes confidence percentages', () => {
    const result = parseMealPhotoAnalysis(`{"name":"Meal","serving":"1","calories":100,"protein":10,"carbs":10,"fat":2,"ingredients":["egg"],"confidence":82}`);
    expect(result?.confidence).toBe(0.82);
  });

  it('requires a named meal with ingredients', () => {
    expect(parseMealPhotoAnalysis(`{"name":"","ingredients":[]}`)).toBeNull();
  });

  it('builds a trust-first prompt', () => {
    expect(buildMealPhotoPrompt()).toContain('Do not pretend exact nutrition');
  });
});
