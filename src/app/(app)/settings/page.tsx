'use client'

import { useState, useEffect } from 'react'
import { Settings, User, Target, Users, Plus, Trash2, Save, Check, ChevronDown, ChevronUp, UserCircle, MapPin, Loader2 } from 'lucide-react'
import { UpgradeNotice } from '@/components/billing/UpgradeNotice'
import { useBillingAccess } from '@/hooks/useBillingAccess'

interface PersonalInfo {
  fullName: string
  dateOfBirth: string
  gender: string
  email: string
  location: string
  latitude: string
  longitude: string
}

interface BodyStats {
  height: string
  weight: string
  age: string
  activityLevel: string
}

interface DailyGoals {
  calories: string
  protein: string
  carbs: string
  fat: string
  water: string
}

interface GoalSettings {
  weightGoal: 'lose' | 'maintain' | 'gain'
  targetWeight: string
  caloriePlanningMode: 'daily' | 'per-meal'
  mealCalories: {
    breakfast: string
    lunch: string
    dinner: string
    snack: string
  }
}

interface FamilyProfile {
  id: string
  name: string
  dateOfBirth: string
  allergies: string[]
  excludedIngredients: string[]
}

interface SettingsData {
  personalInfo: PersonalInfo
  bodyStats: BodyStats
  dailyGoals: DailyGoals
  goals: GoalSettings
  familyProfiles: FamilyProfile[]
}

const SETTINGS_KEY = 'posha_settings'

const defaultSettings: SettingsData = {
  personalInfo: {
    fullName: '',
    dateOfBirth: '',
    gender: '',
    email: '',
    location: '',
    latitude: '',
    longitude: '',
  },
  bodyStats: {
    height: '',
    weight: '',
    age: '',
    activityLevel: 'moderate',
  },
  dailyGoals: {
    calories: '2000',
    protein: '150',
    carbs: '250',
    fat: '65',
    water: '8',
  },
  goals: {
    weightGoal: 'maintain',
    targetWeight: '',
    caloriePlanningMode: 'daily',
    mealCalories: {
      breakfast: '500',
      lunch: '600',
      dinner: '700',
      snack: '200',
    },
  },
  familyProfiles: [],
}

function loadSettings(): SettingsData {
  try {
    const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')
    return {
      personalInfo: { ...defaultSettings.personalInfo, ...stored.personalInfo },
      bodyStats: { ...defaultSettings.bodyStats, ...stored.bodyStats },
      dailyGoals: { ...defaultSettings.dailyGoals, ...stored.dailyGoals },
      goals: {
        ...defaultSettings.goals,
        ...stored.goals,
        mealCalories: { ...defaultSettings.goals.mealCalories, ...(stored.goals?.mealCalories || {}) },
      },
      familyProfiles: stored.familyProfiles || [],
    }
  } catch {
    return { ...defaultSettings }
  }
}

function saveSettings(data: SettingsData) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(data))
}

// Map Supabase user_profiles row → settings shape
function profileToSettings(p: Record<string, unknown> | null): SettingsData | null {
  if (!p) return null
  return {
    personalInfo: {
      fullName: (p.full_name as string) || '',
      dateOfBirth: (p.date_of_birth as string) || '',
      gender: (p.gender as string) || '',
      email: '',
      location: (p.location as string) || '',
      latitude: p.latitude != null ? String(p.latitude) : '',
      longitude: p.longitude != null ? String(p.longitude) : '',
    },
    bodyStats: {
      height: p.height_cm != null ? String(p.height_cm) : '',
      weight: p.weight_kg != null ? String(p.weight_kg) : '',
      age: p.age != null ? String(p.age) : '',
      activityLevel: (p.activity_level as string) || 'moderate',
    },
    dailyGoals: {
      calories: String(p.daily_calories ?? 2000),
      protein: String(p.daily_protein ?? 150),
      carbs: String(p.daily_carbs ?? 250),
      fat: String(p.daily_fat ?? 65),
      water: String(p.daily_water ?? 8),
    },
    goals: defaultSettings.goals,
    familyProfiles: (p.family_profiles as FamilyProfile[]) || [],
  }
}

function settingsToProfile(s: SettingsData) {
  const toNum = (v: string) => (v === '' ? null : Number(v))
  return {
    full_name: s.personalInfo.fullName || '',
    date_of_birth: s.personalInfo.dateOfBirth || null,
    gender: s.personalInfo.gender || '',
    location: s.personalInfo.location || null,
    latitude: toNum(s.personalInfo.latitude),
    longitude: toNum(s.personalInfo.longitude),
    height_cm: toNum(s.bodyStats.height),
    weight_kg: toNum(s.bodyStats.weight),
    age: toNum(s.bodyStats.age),
    activity_level: s.bodyStats.activityLevel || 'moderate',
    daily_calories: Number(s.dailyGoals.calories) || 2000,
    daily_protein: Number(s.dailyGoals.protein) || 150,
    daily_carbs: Number(s.dailyGoals.carbs) || 250,
    daily_fat: Number(s.dailyGoals.fat) || 65,
    daily_water: Number(s.dailyGoals.water) || 8,
    family_profiles: s.familyProfiles,
  }
}

const activityLevels = [
  { value: 'sedentary', label: 'Sedentary (little or no exercise)' },
  { value: 'light', label: 'Light (1-3 days/week)' },
  { value: 'moderate', label: 'Moderate (3-5 days/week)' },
  { value: 'active', label: 'Active (6-7 days/week)' },
  { value: 'very_active', label: 'Very Active (intense daily)' },
]

const personalGenderOptions = [
  { value: '', label: 'Select gender' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
]

const genderOptions = [
  { value: '', label: 'Select gender' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
]

const commonAllergies = [
  'Dairy', 'Eggs', 'Peanuts', 'Tree Nuts', 'Soy', 'Wheat', 'Gluten',
  'Fish', 'Shellfish', 'Sesame', 'Mustard', 'Celery',
]

function LocationButton({ onLocated }: { onLocated: (lat: string, lng: string) => void }) {
  const [detecting, setDetecting] = useState(false)

  function detect() {
    if (!navigator.geolocation) return
    setDetecting(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onLocated(pos.coords.latitude.toFixed(4), pos.coords.longitude.toFixed(4))
        setDetecting(false)
      },
      () => setDetecting(false),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <button
      onClick={detect}
      disabled={detecting}
      className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-border text-sm font-medium text-primary hover:bg-primary/10 transition-colors disabled:opacity-50 flex-shrink-0"
    >
      {detecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
      {detecting ? 'Detecting...' : 'Detect'}
    </button>
  )
}

export default function SettingsPage() {
  const { hasPro, hasPremium, familyProfileLimit } = useBillingAccess()
  const [settings, setSettings] = useState<SettingsData>(defaultSettings)
  const [saved, setSaved] = useState(false)
  const [expandedProfile, setExpandedProfile] = useState<string | null>(null)
  const [newAllergyInput, setNewAllergyInput] = useState<{ [profileId: string]: string }>({})
  const [newExcludedInput, setNewExcludedInput] = useState<{ [profileId: string]: string }>({})

  useEffect(() => {
    // Prime UI with localStorage cache, then overwrite from Supabase
    setSettings(loadSettings())
    fetch('/api/profile')
      .then((r) => r.json())
      .then((d) => {
        const fromDb = profileToSettings(d.profile)
        if (fromDb) {
          const cached = loadSettings()
          setSettings({
            ...fromDb,
            goals: cached.goals,
          })
        }
      })
      .catch(() => { /* ignore — keep local cache */ })
  }, [])

  async function handleSave() {
    saveSettings(settings) // optimistic cache
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsToProfile(settings)),
      })
      if (!res.ok) throw new Error(await res.text())
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      // Stay silent; localStorage already has the value
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  function updatePersonalInfo(field: keyof PersonalInfo, value: string) {
    setSettings((prev) => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value },
    }))
  }

  function updateBodyStats(field: keyof BodyStats, value: string) {
    setSettings((prev) => ({
      ...prev,
      bodyStats: { ...prev.bodyStats, [field]: value },
    }))
  }

  function updateDailyGoals(field: keyof DailyGoals, value: string) {
    setSettings((prev) => ({
      ...prev,
      dailyGoals: { ...prev.dailyGoals, [field]: value },
    }))
  }

  function updateGoals<K extends keyof GoalSettings>(field: K, value: GoalSettings[K]) {
    setSettings((prev) => ({
      ...prev,
      goals: { ...prev.goals, [field]: value },
    }))
  }

  function updateMealCalorieGoal(field: keyof GoalSettings['mealCalories'], value: string) {
    setSettings((prev) => ({
      ...prev,
      goals: {
        ...prev.goals,
        mealCalories: { ...prev.goals.mealCalories, [field]: value },
      },
    }))
  }

  function addProfile() {
    if (!hasPro) return
    if (settings.familyProfiles.length >= familyProfileLimit) return
    const newProfile: FamilyProfile = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 8),
      name: '',
      dateOfBirth: '',
      allergies: [],
      excludedIngredients: [],
    }
    setSettings((prev) => ({
      ...prev,
      familyProfiles: [...prev.familyProfiles, newProfile],
    }))
    setExpandedProfile(newProfile.id)
  }

  function updateProfile(id: string, field: keyof FamilyProfile, value: string | string[]) {
    setSettings((prev) => ({
      ...prev,
      familyProfiles: prev.familyProfiles.map((p) =>
        p.id === id ? { ...p, [field]: value } : p,
      ),
    }))
  }

  function removeProfile(id: string) {
    setSettings((prev) => ({
      ...prev,
      familyProfiles: prev.familyProfiles.filter((p) => p.id !== id),
    }))
    if (expandedProfile === id) setExpandedProfile(null)
  }

  function addAllergyToProfile(profileId: string, allergy: string) {
    setSettings((prev) => ({
      ...prev,
      familyProfiles: prev.familyProfiles.map((p) => {
        if (p.id !== profileId) return p
        if (p.allergies.includes(allergy)) return p
        return { ...p, allergies: [...p.allergies, allergy] }
      }),
    }))
  }

  function removeAllergyFromProfile(profileId: string, allergy: string) {
    setSettings((prev) => ({
      ...prev,
      familyProfiles: prev.familyProfiles.map((p) => {
        if (p.id !== profileId) return p
        return { ...p, allergies: p.allergies.filter((a) => a !== allergy) }
      }),
    }))
  }

  function addExcludedToProfile(profileId: string, ingredient: string) {
    if (!ingredient.trim()) return
    setSettings((prev) => ({
      ...prev,
      familyProfiles: prev.familyProfiles.map((p) => {
        if (p.id !== profileId) return p
        if (p.excludedIngredients.includes(ingredient.trim())) return p
        return { ...p, excludedIngredients: [...p.excludedIngredients, ingredient.trim()] }
      }),
    }))
  }

  function removeExcludedFromProfile(profileId: string, ingredient: string) {
    setSettings((prev) => ({
      ...prev,
      familyProfiles: prev.familyProfiles.map((p) => {
        if (p.id !== profileId) return p
        return { ...p, excludedIngredients: p.excludedIngredients.filter((i) => i !== ingredient) }
      }),
    }))
  }

  return (
    <div className="animate-in fade-in duration-300 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            Settings
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your profile and goals</p>
        </div>
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
            saved
              ? 'bg-primary text-white'
              : 'bg-foreground text-white hover:bg-foreground/80'
          }`}
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* ── Section 1: Personal Info ─────────────────────────────── */}
      <div className="bg-card-bg border border-border rounded-2xl p-5 mb-4">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2 mb-4">
          <UserCircle className="w-5 h-5 text-primary" />
          Personal Info
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-muted-foreground mb-1">Full Name</label>
            <input
              type="text"
              value={settings.personalInfo.fullName}
              onChange={(e) => updatePersonalInfo('fullName', e.target.value)}
              placeholder="John Doe"
              className="w-full px-3 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Date of Birth</label>
            <input
              type="date"
              value={settings.personalInfo.dateOfBirth}
              onChange={(e) => updatePersonalInfo('dateOfBirth', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Gender</label>
            <select
              value={settings.personalInfo.gender}
              onChange={(e) => updatePersonalInfo('gender', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm bg-card-bg"
            >
              {personalGenderOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-muted-foreground mb-1">Email</label>
            <input
              type="email"
              value={settings.personalInfo.email}
              disabled
              readOnly
              placeholder="your@email.com"
              className="w-full px-3 py-2.5 rounded-xl border border-border outline-none text-sm bg-muted-foreground/10 text-muted-foreground cursor-not-allowed"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-muted-foreground mb-1">Home Location</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={settings.personalInfo.location}
                onChange={(e) => updatePersonalInfo('location', e.target.value)}
                placeholder="Detect or enter your home location"
                className="flex-1 px-3 py-2.5 rounded-xl border border-border outline-none text-sm text-foreground focus:ring-2 focus:ring-primary/30 focus:border-primary bg-card-bg"
              />
              <LocationButton
                onLocated={(lat, lng) => {
                  updatePersonalInfo('latitude', lat)
                  updatePersonalInfo('longitude', lng)
                  updatePersonalInfo('location', `${lat}, ${lng}`)
                }}
              />
            </div>
            {settings.personalInfo.latitude && settings.personalInfo.longitude && (
              <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {settings.personalInfo.latitude}, {settings.personalInfo.longitude}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Section 2: Body Stats ──────────────────────────────────── */}
      <div className="bg-card-bg border border-border rounded-2xl p-5 mb-4">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-primary" />
          Body Stats
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Height (cm)</label>
            <input
              type="number"
              value={settings.bodyStats.height}
              onChange={(e) => updateBodyStats('height', e.target.value)}
              placeholder="170"
              className="w-full px-3 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Weight (kg)</label>
            <input
              type="number"
              value={settings.bodyStats.weight}
              onChange={(e) => updateBodyStats('weight', e.target.value)}
              placeholder="70"
              className="w-full px-3 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Age</label>
            <input
              type="number"
              value={settings.bodyStats.age}
              onChange={(e) => updateBodyStats('age', e.target.value)}
              placeholder="25"
              className="w-full px-3 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-muted-foreground mb-1">Activity Level</label>
            <select
              value={settings.bodyStats.activityLevel}
              onChange={(e) => updateBodyStats('activityLevel', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm bg-card-bg"
            >
              {activityLevels.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Section 3: Daily Goals ─────────────────────────────────── */}
      <div className="bg-card-bg border border-border rounded-2xl p-5 mb-4">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-primary" />
          Daily Goals
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-muted-foreground mb-1">Calorie Goal (kcal)</label>
            <input
              type="number"
              value={settings.dailyGoals.calories}
              onChange={(e) => updateDailyGoals('calories', e.target.value)}
              placeholder="2000"
              className="w-full px-3 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Protein (g)</label>
            <input
              type="number"
              value={settings.dailyGoals.protein}
              onChange={(e) => updateDailyGoals('protein', e.target.value)}
              placeholder="150"
              className="w-full px-3 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Carbs (g)</label>
            <input
              type="number"
              value={settings.dailyGoals.carbs}
              onChange={(e) => updateDailyGoals('carbs', e.target.value)}
              placeholder="250"
              className="w-full px-3 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Fat (g)</label>
            <input
              type="number"
              value={settings.dailyGoals.fat}
              onChange={(e) => updateDailyGoals('fat', e.target.value)}
              placeholder="65"
              className="w-full px-3 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Water (glasses)</label>
            <input
              type="number"
              value={settings.dailyGoals.water}
              onChange={(e) => updateDailyGoals('water', e.target.value)}
              placeholder="8"
              className="w-full px-3 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
            />
          </div>
        </div>
      </div>

      {/* ── Section 4: Family Profiles ────────────────────────────── */}
      <div className="bg-card-bg border border-border rounded-2xl p-5 mb-4">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-primary" />
          Planning Goals
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Weight Goal</label>
            <select
              value={settings.goals.weightGoal}
              onChange={(e) => updateGoals('weightGoal', e.target.value as GoalSettings['weightGoal'])}
              className="w-full px-3 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm bg-card-bg"
            >
              <option value="lose">Lose weight</option>
              <option value="maintain">Maintain weight</option>
              <option value="gain">Gain weight</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Target Weight (kg)</label>
            <input
              type="number"
              value={settings.goals.targetWeight}
              onChange={(e) => updateGoals('targetWeight', e.target.value)}
              placeholder="68"
              className="w-full px-3 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-muted-foreground mb-1">Calorie Recommendation Mode</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => updateGoals('caloriePlanningMode', 'daily')}
                className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                  settings.goals.caloriePlanningMode === 'daily'
                    ? 'bg-primary text-white border-primary'
                    : 'border-border text-foreground hover:bg-primary/10'
                }`}
              >
                Use daily calories
              </button>
              <button
                type="button"
                onClick={() => updateGoals('caloriePlanningMode', 'per-meal')}
                className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                  settings.goals.caloriePlanningMode === 'per-meal'
                    ? 'bg-primary text-white border-primary'
                    : 'border-border text-foreground hover:bg-primary/10'
                }`}
              >
                Set per-meal calories
              </button>
            </div>
          </div>

          {settings.goals.caloriePlanningMode === 'per-meal' && (
            <>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Breakfast (kcal)</label>
                <input
                  type="number"
                  value={settings.goals.mealCalories.breakfast}
                  onChange={(e) => updateMealCalorieGoal('breakfast', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Lunch (kcal)</label>
                <input
                  type="number"
                  value={settings.goals.mealCalories.lunch}
                  onChange={(e) => updateMealCalorieGoal('lunch', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Dinner (kcal)</label>
                <input
                  type="number"
                  value={settings.goals.mealCalories.dinner}
                  onChange={(e) => updateMealCalorieGoal('dinner', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Snack (kcal)</label>
                <input
                  type="number"
                  value={settings.goals.mealCalories.snack}
                  onChange={(e) => updateMealCalorieGoal('snack', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
                />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-card-bg border border-border rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Family Profiles
          </h2>
          <button
            onClick={addProfile}
            disabled={!hasPro || settings.familyProfiles.length >= familyProfileLimit}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-primary bg-primary/10 rounded-xl hover:bg-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" /> Add Profile
          </button>
        </div>

        {!hasPro ? (
          <div className="mb-4">
            <UpgradeNotice
              plan="pro"
              title="Family profiles are part of Pro"
              description="Unlock shared household planning, allergy tracking, and excluded ingredient profiles with Pro."
            />
          </div>
        ) : null}

        {hasPro && !hasPremium && settings.familyProfiles.length >= familyProfileLimit ? (
          <div className="mb-4">
            <UpgradeNotice
              plan="premium"
              title="Premium unlocks unlimited family profiles"
              description="Your Pro plan includes up to 2 family profiles. Upgrade when you need more household members."
            />
          </div>
        ) : null}

        {!hasPro || settings.familyProfiles.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground-foreground">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{hasPro ? 'No family profiles yet' : 'Family profiles locked'}</p>
            <p className="text-xs mt-1">
              {hasPro
                ? 'Add profiles to track allergies and preferences for family members'
                : 'Upgrade to Pro to add household profiles for allergies and ingredient exclusions'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {settings.familyProfiles.map((profile) => {
              const isExpanded = expandedProfile === profile.id
              return (
                <div key={profile.id} className="border border-border rounded-xl overflow-hidden">
                  <div
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-[#F6F6F6] transition-colors"
                    onClick={() => setExpandedProfile(isExpanded ? null : profile.id)}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {profile.name ? profile.name[0].toUpperCase() : '?'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{profile.name || 'New Profile'}</p>
                        {profile.allergies.length > 0 && (
                          <p className="text-xs text-muted-foreground">{profile.allergies.length} allerg{profile.allergies.length === 1 ? 'y' : 'ies'}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeProfile(profile.id)
                        }}
                        className="p-1.5 text-muted-foreground-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground-foreground" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-3 pb-3 border-t border-[#F6F6F6] space-y-4 pt-3">
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Name</label>
                        <input
                          type="text"
                          value={profile.name}
                          onChange={(e) => updateProfile(profile.id, 'name', e.target.value)}
                          placeholder="Family member name"
                          className="w-full px-3 py-2 rounded-xl border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Date of Birth</label>
                        <input
                          type="date"
                          value={profile.dateOfBirth}
                          onChange={(e) => updateProfile(profile.id, 'dateOfBirth', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
                        />
                      </div>

                      {/* Allergies */}
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-2">Allergies</label>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {commonAllergies.map((allergy) => {
                            const isActive = profile.allergies.includes(allergy)
                            return (
                              <button
                                key={allergy}
                                onClick={() =>
                                  isActive
                                    ? removeAllergyFromProfile(profile.id, allergy)
                                    : addAllergyToProfile(profile.id, allergy)
                                }
                                className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                                  isActive
                                    ? 'bg-red-100 text-red-700 font-medium'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                              >
                                {allergy}
                              </button>
                            )
                          })}
                        </div>
                        {/* Custom allergy input */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newAllergyInput[profile.id] || ''}
                            onChange={(e) => setNewAllergyInput((prev) => ({ ...prev, [profile.id]: e.target.value }))}
                            placeholder="Add custom allergy..."
                            className="flex-1 px-3 py-1.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-xs"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                const val = newAllergyInput[profile.id]?.trim()
                                if (val) {
                                  addAllergyToProfile(profile.id, val)
                                  setNewAllergyInput((prev) => ({ ...prev, [profile.id]: '' }))
                                }
                              }
                            }}
                          />
                        </div>
                      </div>

                      {/* Excluded Ingredients */}
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-2">Excluded Ingredients</label>
                        {profile.excludedIngredients.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {profile.excludedIngredients.map((ing) => (
                              <span
                                key={ing}
                                className="flex items-center gap-1 px-2 py-1 text-xs bg-orange-50 text-orange-700 rounded-full"
                              >
                                {ing}
                                <button
                                  onClick={() => removeExcludedFromProfile(profile.id, ing)}
                                  className="hover:text-red-600"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newExcludedInput[profile.id] || ''}
                            onChange={(e) => setNewExcludedInput((prev) => ({ ...prev, [profile.id]: e.target.value }))}
                            placeholder="Add excluded ingredient..."
                            className="flex-1 px-3 py-1.5 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-xs"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                const val = newExcludedInput[profile.id]?.trim()
                                if (val) {
                                  addExcludedToProfile(profile.id, val)
                                  setNewExcludedInput((prev) => ({ ...prev, [profile.id]: '' }))
                                }
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
