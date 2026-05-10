'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Loader2, Sparkles } from 'lucide-react'

const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary (little/no exercise)' },
  { value: 'light', label: 'Light (1-3 days/week)' },
  { value: 'moderate', label: 'Moderate (3-5 days/week)' },
  { value: 'active', label: 'Active (6-7 days/week)' },
  { value: 'very_active', label: 'Very Active (intense daily)' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const { status } = useSession()
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState('')

  const [fullName, setFullName] = useState('')
  const [dob, setDob] = useState('')
  const [gender, setGender] = useState('')
  const [location, setLocation] = useState('')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [activity, setActivity] = useState('moderate')

  // Redirect if not authed; skip onboarding if already done
  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.replace('/login')
      return
    }
    fetch('/api/profile')
      .then((r) => r.json())
      .then((d) => {
        if (d.profile?.onboarded_at) {
          router.replace('/dashboard')
        } else {
          setChecking(false)
        }
      })
      .catch(() => setChecking(false))
  }, [status, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const age = dob ? Math.floor((Date.now() - new Date(dob).getTime()) / 31557600000) : null

    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: fullName.trim(),
        date_of_birth: dob,
        gender,
        location: location.trim() || null,
        height_cm: Number(height),
        weight_kg: Number(weight),
        age,
        activity_level: activity,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Failed to save profile')
      setLoading(false)
      return
    }
    router.replace('/dashboard')
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6] py-12 px-4">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-6 h-6 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Welcome to Posha</h1>
        </div>
        <p className="text-muted-foreground mb-8">
          A few quick details help personalize Posha. You can skip this and start using the app right away.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5 bg-card-bg rounded-2xl border border-border p-6">
          <Field label="Full name">
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input"
              placeholder="Jane Doe"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Date of birth">
              <input required type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="input" />
            </Field>
            <Field label="Gender">
              <select required value={gender} onChange={(e) => setGender(e.target.value)} className="input">
                <option value="">Select</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="non_binary">Non-binary</option>
                <option value="prefer_not_say">Prefer not to say</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Height (cm)">
              <input
                required
                type="number"
                min={50}
                max={300}
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="input"
                placeholder="170"
              />
            </Field>
            <Field label="Weight (kg)">
              <input
                required
                type="number"
                min={20}
                max={400}
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="input"
                placeholder="68"
              />
            </Field>
          </div>

          <Field label="Activity level">
            <select value={activity} onChange={(e) => setActivity(e.target.value)} className="input">
              {ACTIVITY_LEVELS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Location (city)">
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="input"
              placeholder="Sydney, AU"
            />
          </Field>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Continue to Posha
            </button>
            <button
              type="button"
              onClick={() => router.replace('/dashboard')}
              className="flex-1 px-6 py-3 rounded-xl border border-border text-foreground font-semibold hover:bg-white transition-colors"
            >
              Skip for now
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          padding: 0.625rem 0.875rem;
          border-radius: 0.75rem;
          border: 1px solid var(--color-border, #e5e0d8);
          background: white;
          font-size: 0.95rem;
          outline: none;
          transition: border-color 0.15s;
        }
        :global(.input:focus) {
          border-color: var(--color-primary, #1e3f20);
        }
      `}</style>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-foreground mb-1.5">{label}</span>
      {children}
    </label>
  )
}
