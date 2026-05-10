'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { UpgradeNotice } from '@/components/billing/UpgradeNotice';
import { useBillingAccess } from '@/hooks/useBillingAccess';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  AlertTriangle,
  Beef,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Droplets,
  Flame,
  Heart,
  Scale,
  ShoppingCart,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  UtensilsCrossed,
  Wheat,
  Zap,
} from 'lucide-react';
import {
  buildDecisionSupportSummary,
  buildDailyNutritionSummary,
  buildNutritionInsights,
  buildRecentMeals,
  buildWeeklyCalories,
  type DecisionSupportSummary,
  TRACKER_EVENT,
  type NutritionInsights,
  type RecentMealItem,
  type WeeklyCaloriePoint,
} from '@/lib/nutritionTracker';

const quickActions = [
  { label: 'AI Cookbook', href: '/cookbook', icon: BookOpen, desc: 'AI-powered recipes', color: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600' },
  { label: 'Meal Plan', href: '/meal-plan', icon: CalendarDays, desc: 'Weekly planning', color: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600' },
  { label: 'Shopping', href: '/shopping', icon: ShoppingCart, desc: 'Smart grocery list', color: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600' },
];

const mealTypeBadge: Record<string, string> = {
  Breakfast: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  Lunch: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  Dinner: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  Snack: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
};

const progressStats = [
  { label: 'Current Weight', value: '80.3', unit: 'kg', change: '-0.5 kg', dir: 'down', suffix: '', icon: Scale, color: '#3B82F6' },
  { label: 'Goal Weight', value: '75', unit: 'kg', change: '5.3 kg', dir: 'up', suffix: 'to go', icon: Target, color: '#F59E0B' },
  { label: 'Day Streak', value: '12', unit: 'days', change: '', dir: 'up', suffix: '', icon: Zap, color: '#A855F7' },
];

function CalorieRing({ size, sw, pct }: { size: number; sw: number; pct: number }) {
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - Math.min(pct / 100, 1) * circ;

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={sw} className="text-border" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#22C55E"
        strokeWidth={sw}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-700 ease-out"
      />
    </svg>
  );
}

function NutritionScoreRing({ score }: { score: number }) {
  const size = 130;
  const sw = 10;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 70 ? '#22C55E' : score >= 40 ? '#F59E0B' : '#EF4444';

  return (
    <div className="relative flex-shrink-0">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={sw} className="text-border" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={sw}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-foreground">{score}</span>
        <span className="text-[10px] text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

function getNutrientStyle(pct: number) {
  if (pct >= 70) return { badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', bar: 'bg-emerald-500' };
  if (pct >= 40) return { badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', bar: 'bg-amber-500' };
  return { badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', bar: 'bg-red-500' };
}

function getWeekLabel(points: WeeklyCaloriePoint[]) {
  if (!points.length) return '';
  const start = new Date(`${points[0].dateKey}T00:00:00`);
  const end = new Date(`${points[6].dateKey}T00:00:00`);
  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

export default function DashboardPage() {
  const { hasPremium } = useBillingAccess();
  const { data: session } = useSession();
  const [profileName, setProfileName] = useState('');
  const [weekOffset, setWeekOffset] = useState(0);
  const [recentMeals, setRecentMeals] = useState<RecentMealItem[]>([]);
  const [nutritionInsights, setNutritionInsights] = useState<NutritionInsights>(buildNutritionInsights());
  const [dailySummary, setDailySummary] = useState(buildDailyNutritionSummary());
  const [weeklyCalories, setWeeklyCalories] = useState<WeeklyCaloriePoint[]>(buildWeeklyCalories(new Date()));
  const [decisionSupport, setDecisionSupport] = useState<DecisionSupportSummary>(buildDecisionSupportSummary());

  useEffect(() => {
    fetch('/api/profile')
      .then((response) => response.json())
      .then((data) => {
        if (data.profile?.full_name) setProfileName(data.profile.full_name);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const refresh = () => {
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() + weekOffset * 7);
      setDailySummary(buildDailyNutritionSummary());
      setRecentMeals(buildRecentMeals());
      setNutritionInsights(buildNutritionInsights());
      setWeeklyCalories(buildWeeklyCalories(baseDate));
      setDecisionSupport(buildDecisionSupportSummary());
    };

    refresh();
    window.addEventListener('storage', refresh);
    window.addEventListener(TRACKER_EVENT, refresh as EventListener);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener(TRACKER_EVENT, refresh as EventListener);
    };
  }, [weekOffset]);

  const firstName =
    profileName.split(' ')[0] ||
    session?.user?.name?.split(' ')[0] ||
    session?.user?.email?.split('@')[0] ||
    '';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const avgWeeklyCalories = weeklyCalories.some((point) => point.cal > 0)
    ? Math.round(weeklyCalories.reduce((sum, point) => sum + point.cal, 0) / Math.max(weeklyCalories.filter((point) => point.cal > 0).length, 1))
    : 0;
  const maxCal = Math.max(...weeklyCalories.map((point) => point.cal), dailySummary.goal, 1) + 200;

  return (
    <div className="min-h-screen text-foreground pb-24 space-y-6 animate-in fade-in duration-300">
      <Card className="bg-gradient-to-br from-primary/10 via-background to-emerald-50 dark:from-primary/20 dark:via-background dark:to-emerald-900/10 border-primary/20 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative flex-shrink-0">
              <CalorieRing size={130} sw={10} pct={dailySummary.calorieProgress} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Flame className="w-5 h-5 text-primary mb-0.5" />
                <span className="text-2xl font-bold tabular-nums">{dailySummary.consumed}</span>
                <span className="text-[10px] text-muted-foreground">of {dailySummary.goal}</span>
              </div>
            </div>
            <div className="flex-1 text-center sm:text-left space-y-3">
              <div>
                <h1 className="text-2xl font-bold">{greeting}{firstName ? `, ${firstName}` : ''}!</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  <span className="font-semibold text-primary">{dailySummary.consumed} cal</span> consumed ·{' '}
                  <span className="font-semibold text-foreground">{dailySummary.remaining} cal</span> remaining
                </p>
              </div>
              <Progress value={dailySummary.calorieProgress} className="h-2" />
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <Link href="/log" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all">
                  <UtensilsCrossed className="w-4 h-4" /> Log a Meal
                </Link>
                <Link href="/cookbook" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-background font-semibold text-sm hover:bg-muted/50 transition-all">
                  <BookOpen className="w-4 h-4" /> AI Cookbook
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="today" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full max-w-sm">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4 animate-in fade-in duration-200">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Today&apos;s Macros</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {dailySummary.macros.map((macro) => (
                <div key={macro.label} className={`${macro.bg} rounded-2xl p-4 space-y-2`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {macro.label === 'Protein' ? <Beef className={`w-4 h-4 ${macro.text}`} /> : null}
                      {macro.label === 'Carbs' ? <Wheat className={`w-4 h-4 ${macro.text}`} /> : null}
                      {macro.label === 'Fat' ? <Flame className={`w-4 h-4 ${macro.text}`} /> : null}
                      {macro.label === 'Water' ? <Droplets className={`w-4 h-4 ${macro.text}`} /> : null}
                      <span className="text-xs font-semibold text-foreground">{macro.label}</span>
                    </div>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 font-mono tabular-nums">
                      {macro.current}{macro.unit}
                    </Badge>
                  </div>
                  <Progress value={macro.target > 0 ? (macro.current / macro.target) * 100 : 0} className="h-1.5" />
                  <p className="text-[10px] text-muted-foreground">{macro.current} / {macro.target}{macro.unit}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Recent Meals</CardTitle>
              <Link href="/log" className="text-xs text-primary hover:underline font-medium">View all →</Link>
            </CardHeader>
            <CardContent className="p-0">
              {recentMeals.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-muted-foreground">Log your first meal to see live activity here.</div>
              ) : (
                recentMeals.map((meal, index) => (
                  <div key={meal.id} className={`flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors ${index < recentMeals.length - 1 ? 'border-b border-border' : ''}`}>
                    <div>
                      <p className="text-sm font-medium text-foreground leading-tight">{meal.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge className={`text-[10px] px-1.5 py-0 h-4 ${mealTypeBadge[meal.type] || ''}`}>{meal.type}</Badge>
                        <span className="text-[10px] text-muted-foreground">{meal.time}</span>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-primary tabular-nums">{meal.cal} cal</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-3 gap-3">
            {quickActions.map((action) => (
              <Link key={action.label} href={action.href} className="group">
                <Card className="h-full hover:border-primary/40 hover:shadow-md transition-all duration-200">
                  <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                    <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <action.icon className={`w-5 h-5 ${action.text}`} />
                    </div>
                    <span className="text-xs font-semibold text-foreground">{action.label}</span>
                    <span className="text-[10px] text-muted-foreground">{action.desc}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">{getWeekLabel(weeklyCalories)}</Badge>
            <div className="flex gap-1">
              <button onClick={() => setWeekOffset((offset) => offset - 1)} className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted/50 transition-colors">
                <ChevronLeft className="w-4 h-4 text-muted-foreground" />
              </button>
              <button onClick={() => setWeekOffset((offset) => offset + 1)} className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted/50 transition-colors">
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-100/70">
                    <Flame className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-xs text-muted-foreground">Avg. Calories</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold tabular-nums">{avgWeeklyCalories}</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingDown className="w-3 h-3 text-primary" />
                  <span className="text-xs font-medium text-primary">live from logged meals</span>
                </div>
              </CardContent>
            </Card>
            {progressStats.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${stat.color}18` }}>
                      <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                    </div>
                    <span className="text-xs text-muted-foreground">{stat.label}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold tabular-nums">{stat.value}</span>
                    {stat.unit && <span className="text-sm text-muted-foreground">{stat.unit}</span>}
                  </div>
                  {stat.change ? (
                    <div className="flex items-center gap-1">
                      {stat.dir === 'down' ? <TrendingDown className="w-3 h-3 text-primary" /> : <TrendingUp className="w-3 h-3 text-amber-400" />}
                      <span className={`text-xs font-medium ${stat.label === 'Goal Weight' ? 'text-amber-500' : 'text-primary'}`}>{stat.change}</span>
                      {stat.suffix && <span className="text-xs text-muted-foreground">{stat.suffix}</span>}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Weekly Calories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between gap-2" style={{ height: 160 }}>
                {weeklyCalories.map((point) => {
                  const height = (point.cal / maxCal) * 130;
                  const overGoal = point.cal > dailySummary.goal;
                  return (
                    <div key={point.dateKey} className="flex flex-col items-center gap-1 flex-1">
                      <span className="text-[9px] text-muted-foreground font-medium tabular-nums">{point.cal > 0 ? point.cal : ''}</span>
                      <div className="relative w-full flex justify-center" style={{ height: 130 }}>
                        <div className={`w-6 rounded-t-lg transition-all duration-500 ${overGoal ? 'bg-red-400/80' : 'bg-primary/75'}`} style={{ height: height || 2, position: 'absolute', bottom: 0 }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{point.day}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nutrition" className="space-y-4 animate-in fade-in duration-200">
          {!hasPremium ? (
            <UpgradeNotice
              plan="premium"
              title="Nutrition Intelligence is a Premium feature"
              description="Upgrade to Premium for advanced nutrition scoring, nutrient coverage, and AI-guided next steps."
            />
          ) : null}

          {hasPremium ? (
            <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Nutrition Intelligence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                <div className="flex flex-col items-center gap-2 flex-shrink-0">
                  <NutritionScoreRing score={nutritionInsights.nutritionScore} />
                  <p className="text-sm font-semibold text-foreground">Nutrition Score</p>
                  <p className="text-xs text-muted-foreground">Based on your logged meals</p>
                </div>
                <div className="flex-1 w-full space-y-3">
                  <p className="text-sm font-semibold text-foreground">Food Group Balance</p>
                  {nutritionInsights.foodGroups.map((group) => (
                    <div key={group.label}>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="flex items-center gap-1.5 font-medium text-foreground">{group.emoji} {group.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{group.types} types</span>
                          <Badge variant="secondary" className="text-[10px] px-1.5 font-mono">{group.pct}%</Badge>
                        </div>
                      </div>
                      <Progress value={group.pct} className="h-2" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-400" />Nutrient Coverage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {nutritionInsights.nutrients.map((nutrient) => {
                  const style = getNutrientStyle(nutrient.pct);
                  return (
                    <div key={nutrient.label} className={`${style.badge.split(' ').slice(0, 2).join(' ')} rounded-xl p-3 ${nutrient.priority ? 'ring-1 ring-current' : ''}`}>
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-[10px] font-medium truncate">{nutrient.label}</span>
                        {nutrient.priority ? <span className="text-[9px] text-red-500">★</span> : null}
                      </div>
                      <p className="text-xl font-bold">{nutrient.pct}<span className="text-xs font-normal">%</span></p>
                      <div className="h-1 rounded-full bg-white/50 mt-1.5 overflow-hidden">
                        <div className={`h-full rounded-full ${style.bar}`} style={{ width: `${nutrient.pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />Smart Next Step
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-sm font-semibold text-foreground">{decisionSupport.headline}</p>
                <p className="text-xs text-muted-foreground mt-1">{decisionSupport.summary}</p>
              </div>
              <div className="space-y-2">
                {decisionSupport.suggestions.map((suggestion) => (
                  <div key={`${suggestion.mealType}-${suggestion.recipeName}`} className="rounded-xl border border-border px-4 py-3 bg-background/70">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{suggestion.recipeName}</p>
                        <p className="text-[11px] text-muted-foreground mt-1">{suggestion.why}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-primary">{suggestion.calories}</p>
                        <p className="text-[10px] text-muted-foreground">kcal</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />Personalized Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Accordion type="multiple" className="space-y-2">
                {nutritionInsights.recommendations.map((recommendation, index) => (
                  <AccordionItem
                    key={`${recommendation.title}-${index}`}
                    value={`rec-${index}`}
                    className={`rounded-xl border px-4 ${recommendation.type === 'warning' ? 'border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/10' : recommendation.type === 'success' ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-900/10' : 'border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/10'}`}
                  >
                    <AccordionTrigger className="py-3 hover:no-underline">
                      <div className="flex items-center gap-3 text-left">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${recommendation.type === 'warning' ? 'bg-amber-100 dark:bg-amber-900/30' : recommendation.type === 'success' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                          {recommendation.type === 'warning' ? <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> : recommendation.type === 'success' ? <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> : <Sparkles className="w-3.5 h-3.5 text-blue-600" />}
                        </div>
                        <span className={`text-sm font-semibold ${recommendation.type === 'warning' ? 'text-amber-800 dark:text-amber-300' : recommendation.type === 'success' ? 'text-emerald-800 dark:text-emerald-300' : 'text-blue-800 dark:text-blue-300'}`}>{recommendation.title}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className={`text-xs pb-2 ${recommendation.type === 'warning' ? 'text-amber-700 dark:text-amber-400' : recommendation.type === 'success' ? 'text-emerald-700 dark:text-emerald-400' : 'text-blue-700 dark:text-blue-400'}`}>{recommendation.desc}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
            </>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
