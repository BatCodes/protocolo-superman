import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import type { Plan, ReadinessResult, DecisionResult, InjuryResult, BloodResult, PredictionResult, HealthData, WorkoutLog, ScannedMeal } from '../lib/types'
import type { MealPlan } from '../lib/profile'
import { SUPPLEMENTS } from '../lib/constants'
import { Ring } from '../components/ui/Ring'
import { Chart } from '../components/ui/Chart'
import { computeSupplementHistory, generateStackSummary, type SupplementHistory } from '../engines/supplementTracker'
import { computeStrain, computeEnergyBank } from '../engines/strain'
import { MuscleHeatmap } from '../components/ui/MuscleHeatmap'
import { HealthJournal } from '../components/ui/HealthJournal'
import { generateInsights } from '../engines/digitalTwin'
import type { HealthScoreBreakdown } from '../engines/healthScore'
import { TrendingUp, TrendingDown, Minus, Zap, Activity, Footprints } from 'lucide-react'

interface DashboardProps {
  plan: Plan
  readiness: ReadinessResult
  decision: DecisionResult
  injury: InjuryResult
  blood: BloodResult
  predictions: PredictionResult
  hd: HealthData
  briefing: string | null
  briefingLoading: boolean
  wkLog: WorkoutLog
  checks: Record<string, boolean>
  toggle: (id: string) => void
  scannedMeals: ScannedMeal[]
  mealPlan: MealPlan[]
  macros: { kcal: number; protein: number; carbs: number; fat: number; water: number }
  healthScore: HealthScoreBreakdown
}

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
}

function getCurrentMealIndex(mealPlan: MealPlan[]): number {
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  for (let i = mealPlan.length - 1; i >= 0; i--) {
    const [h, m] = mealPlan[i].time.split(':').map(Number)
    if (currentMinutes >= h * 60 + m) return i
  }
  return 0
}

function scoreColor(score: number, max: number): string {
  const pct = score / max
  if (pct >= 0.8) return '#4ade80'
  if (pct >= 0.6) return '#a3e635'
  if (pct >= 0.4) return '#fbbf24'
  if (pct >= 0.2) return '#f97316'
  return '#ef4444'
}

function insightColor(type: string): string {
  switch (type) {
    case 'warning': return '#ef4444'
    case 'positive': return '#4ade80'
    case 'action': return '#fbbf24'
    case 'info': return '#60a5fa'
    default: return '#60a5fa'
  }
}

function TrendIcon({ direction }: { direction: 'up' | 'down' | 'stable' }) {
  if (direction === 'up') return <TrendingUp size={14} className="text-emerald-400" />
  if (direction === 'down') return <TrendingDown size={14} className="text-red-400" />
  return <Minus size={14} className="text-zinc-500" />
}

export function Dashboard({
  plan, readiness, decision: _decision, injury: _injury, blood: _blood,
  hd, briefing: _briefing, briefingLoading: _briefingLoading, wkLog, checks, toggle, scannedMeals, mealPlan, macros,
  healthScore,
}: DashboardProps) {
  const TODAY_LOCAL = new Date().toLocaleDateString('sv')

  // -- Workout completion --
  // Workout completion (used for metrics display)
  const _todaySets = Object.entries(wkLog)
    .filter(([key]) => key.startsWith(TODAY_LOCAL))
    .reduce((sum, [, sets]) => sum + sets.length, 0)
  void _todaySets

  // -- Nutrition completion --
  const totalMeals = mealPlan.filter(m => m.type === 'meal').length || 1
  const mealsChecked = mealPlan.filter((m, i) => m.type === 'meal' && checks[`meal-${i}`]).length

  // -- Consumed kcal --
  const todayScanned = scannedMeals.filter(m => m.date === TODAY_LOCAL)
  const consumedKcal = todayScanned.reduce((a, m) => a + m.kcal, 0) + (mealsChecked * Math.round(macros.kcal / totalMeals))

  // -- Strain + Energy --
  const strain = computeStrain(hd, wkLog)
  const energy = computeEnergyBank(readiness.score, hd, strain)

  // -- Chart data --
  const readinessData = (hd.hrv || []).slice(-14).map(e => ({ date: e.d, value: e.v }))
  const weightData = (hd.weight || []).slice(-14).map(e => ({ date: e.d, value: e.v }))

  // -- Current meal index --
  const currentMeal = getCurrentMealIndex(mealPlan)

  // -- AI Insights --
  const topInsights = useMemo(() =>
    generateInsights(hd, wkLog, healthScore, readiness, plan),
    [hd, wkLog, healthScore.total, readiness.score, plan.day]
  )

  // -- Steps trend --
  const steps14 = (hd.steps || []).slice(-14)
  const todaySteps = steps14.length > 0 ? steps14[steps14.length - 1].v : 0
  const stepsAvg = steps14.length > 0 ? Math.round(steps14.reduce((a, e) => a + e.v, 0) / steps14.length) : 0
  const stepsTrend: 'up' | 'down' | 'stable' = todaySteps > stepsAvg * 1.05 ? 'up' : todaySteps < stepsAvg * 0.95 ? 'down' : 'stable'

  // -- Readiness trend --
  const readinessTrend: 'up' | 'down' | 'stable' = readiness.score >= 75 ? 'up' : readiness.score < 50 ? 'down' : 'stable'

  // -- ACWR trend --
  const acwrTrend: 'up' | 'down' | 'stable' = readiness.acwr >= 0.8 && readiness.acwr <= 1.3 ? 'up' : readiness.acwr > 1.5 ? 'down' : 'stable'

  // -- Strain trend --
  const strainTrend: 'up' | 'down' | 'stable' = strain.level === 'overreaching' ? 'down' : strain.level === 'high' ? 'stable' : 'up'

  // -- Supplement history --
  const [suppHistory, setSuppHistory] = useState<SupplementHistory[]>([])
  const [stackSummary, setStackSummary] = useState('')

  const suppCheckKey = SUPPLEMENTS.filter(s => s.ph <= plan.phase).map((_, i) => checks[`s-${i}`] ? '1' : '0').join('')
  useEffect(() => {
    computeSupplementHistory(plan, checks).then(history => {
      setSuppHistory(history)
      setStackSummary(generateStackSummary(history))
    })
  }, [plan.day, plan.phase, suppCheckKey])

  // -- Health score categories for bars --
  const healthCategories = [
    { label: 'Composicion', score: healthScore.composition, color: scoreColor(healthScore.composition, 100) },
    { label: 'Cardiovascular', score: healthScore.cardiovascular, color: scoreColor(healthScore.cardiovascular, 100) },
    { label: 'Sueno', score: healthScore.sleep, color: scoreColor(healthScore.sleep, 100) },
    { label: 'Recovery', score: healthScore.recovery, color: scoreColor(healthScore.recovery, 100) },
    { label: 'Actividad', score: healthScore.activity, color: scoreColor(healthScore.activity, 100) },
    { label: 'Nutricion', score: healthScore.nutrition, color: scoreColor(healthScore.nutrition, 100) },
    { label: 'Consistencia', score: healthScore.consistency, color: scoreColor(healthScore.consistency, 100) },
  ]

  const totalScoreColor = scoreColor(healthScore.total, 900)

  return (
    <div className="pb-28 min-h-screen">

      {/* ─── 1. ENERGY BANK ─── */}
      <motion.div custom={0} variants={fadeIn} initial="hidden" animate="show" className="px-4 pt-6">
        <div className="glass-card p-5">
          <div className="flex items-center gap-4">
            <div className="relative">
              {/* Battery body */}
              <div className="w-14 h-24 rounded-xl border-2 relative overflow-hidden" style={{ borderColor: energy.color + '60' }}>
                {/* Battery cap */}
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-6 h-2 rounded-t" style={{ background: energy.color + '40' }} />
                {/* Fill */}
                <motion.div
                  className="absolute bottom-0 left-0 right-0 rounded-b-lg"
                  style={{ background: `linear-gradient(to top, ${energy.color}, ${energy.color}80)` }}
                  initial={{ height: 0 }}
                  animate={{ height: `${energy.level}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="text-[13px] text-zinc-500 mb-1">Energy Bank</div>
              <div className="text-[32px] font-bold text-white leading-none">
                {energy.level}<span className="text-[18px] text-zinc-500">%</span>
              </div>
              <div className="text-[13px] font-medium mt-1" style={{ color: energy.color }}>
                {energy.status === 'peak' ? 'Energia maxima' : energy.status === 'charged' ? 'Cargado' : energy.status === 'moderate' ? 'Moderado' : energy.status === 'low' ? 'Bajo' : 'Depleted'}
              </div>
              <div className="text-[12px] text-zinc-600 mt-1">{energy.recommendation}</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── 2. HEALTH SCORE ─── */}
      <motion.div custom={1} variants={fadeIn} initial="hidden" animate="show" className="mt-6 px-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-5">
            {/* Ring */}
            <div className="relative flex-shrink-0">
              <Ring pct={Math.round((healthScore.total / 900) * 100)} size={100} strokeWidth={8} color={totalScoreColor} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[26px] font-bold text-white leading-none">{healthScore.total}</span>
                <span className="text-[11px] text-zinc-500">/900</span>
              </div>
            </div>
            {/* Category bars */}
            <div className="flex-1 space-y-2">
              {healthCategories.map((cat) => (
                <div key={cat.label} className="flex items-center gap-2">
                  <span className="text-[11px] text-zinc-500 w-[72px] truncate">{cat.label}</span>
                  <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: cat.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${cat.score}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                  <span className="text-[11px] mono text-zinc-400 w-7 text-right">{cat.score}</span>
                </div>
              ))}
            </div>
          </div>
          {healthScore.metabolicAge !== null && (
            <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <span className="text-[12px] text-zinc-500">Edad metabolica estimada: </span>
              <span className="text-[12px] font-medium" style={{ color: totalScoreColor }}>{healthScore.metabolicAge} anos</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* ─── 3. AI INSIGHTS ─── */}
      {topInsights.length > 0 && (
        <motion.div custom={2} variants={fadeIn} initial="hidden" animate="show" className="mt-6 px-4">
          <div className="text-[17px] font-semibold text-white mb-3">Insights</div>
          <div className="space-y-2">
            {topInsights.slice(0, 3).map((insight, i) => (
              <div key={i} className="glass-card p-4 flex gap-3" style={{ borderLeft: `3px solid ${insightColor(insight.type)}` }}>
                <div className="flex-1">
                  <div className="text-[14px] font-medium text-white">{insight.title}</div>
                  <div className="text-[13px] text-zinc-400 mt-1 leading-relaxed">{insight.body}</div>
                  {insight.metric && <div className="text-[12px] mono mt-2" style={{ color: insightColor(insight.type) }}>{insight.metric}</div>}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ─── 4. TODAY'S METRICS ─── */}
      <motion.div custom={3} variants={fadeIn} initial="hidden" animate="show" className="mt-6 px-4">
        <div className="text-[17px] font-semibold text-white mb-3">Metricas de hoy</div>
        <div className="grid grid-cols-4 gap-2">
          {/* Strain */}
          <div className="glass-card p-3 text-center">
            <Zap size={16} className="mx-auto mb-1 text-zinc-500" />
            <div className="text-[18px] font-bold mono" style={{ color: strain.level === 'overreaching' ? '#ef4444' : strain.level === 'high' ? '#f97316' : '#4ade80' }}>
              {strain.score.toFixed(1)}
            </div>
            <div className="text-[10px] text-zinc-600 mt-0.5">Strain</div>
            <div className="flex justify-center mt-1"><TrendIcon direction={strainTrend} /></div>
          </div>
          {/* Readiness */}
          <div className="glass-card p-3 text-center">
            <Activity size={16} className="mx-auto mb-1 text-zinc-500" />
            <div className="text-[18px] font-bold mono" style={{ color: scoreColor(readiness.score, 100) }}>
              {readiness.score}
            </div>
            <div className="text-[10px] text-zinc-600 mt-0.5">Ready</div>
            <div className="flex justify-center mt-1"><TrendIcon direction={readinessTrend} /></div>
          </div>
          {/* ACWR */}
          <div className="glass-card p-3 text-center">
            <Activity size={16} className="mx-auto mb-1 text-zinc-500" />
            <div className="text-[18px] font-bold mono" style={{ color: readiness.acwr >= 0.8 && readiness.acwr <= 1.3 ? '#4ade80' : readiness.acwr > 1.5 ? '#ef4444' : '#f97316' }}>
              {readiness.acwr.toFixed(2)}
            </div>
            <div className="text-[10px] text-zinc-600 mt-0.5">ACWR</div>
            <div className="flex justify-center mt-1"><TrendIcon direction={acwrTrend} /></div>
          </div>
          {/* Steps */}
          <div className="glass-card p-3 text-center">
            <Footprints size={16} className="mx-auto mb-1 text-zinc-500" />
            <div className="text-[18px] font-bold mono text-white">
              {todaySteps >= 1000 ? `${(todaySteps / 1000).toFixed(1)}k` : todaySteps}
            </div>
            <div className="text-[10px] text-zinc-600 mt-0.5">Pasos</div>
            <div className="flex justify-center mt-1"><TrendIcon direction={stepsTrend} /></div>
          </div>
        </div>
      </motion.div>

      {/* ─── 5. TRENDS ─── */}
      <motion.div custom={4} variants={fadeIn} initial="hidden" animate="show" className="mt-6 px-4">
        <div className="text-[17px] font-semibold text-white mb-3">Tendencias</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card p-3">
            <div className="text-[13px] text-zinc-500 mb-2">HRV (14d)</div>
            <Chart
              data={readinessData}
              color="#4ade80"
              height={80}
              showArea
              showDots={false}
              showLabels
              unit=" ms"
            />
          </div>
          <div className="glass-card p-3">
            <div className="text-[13px] text-zinc-500 mb-2">Peso (14d)</div>
            <Chart
              data={weightData}
              color="#fbbf24"
              height={80}
              showArea
              showDots={false}
              showLabels
              unit=" kg"
            />
          </div>
        </div>
      </motion.div>

      {/* ─── 6. COMIDAS DE HOY ─── */}
      <motion.div custom={5} variants={fadeIn} initial="hidden" animate="show" className="mt-6 px-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[17px] font-semibold text-white">Comidas de hoy</div>
          <div className="text-[13px] text-zinc-500 mono">{consumedKcal}/{macros.kcal} kcal</div>
        </div>
        <div className="glass-card overflow-hidden">
          {mealPlan.map((meal, i) => {
            const checked = checks[`meal-${i}`]
            const isPast = i < currentMeal
            const isCurrent = i === currentMeal

            return (
              <button
                key={i}
                onClick={() => toggle(`meal-${i}`)}
                className="w-full flex items-center gap-3.5 px-4 py-3 text-left transition-colors"
                style={{
                  borderBottom: i < mealPlan.length - 1 ? '0.33px solid rgba(255,255,255,0.05)' : 'none',
                  background: isCurrent && !checked ? 'rgba(74, 222, 128, 0.03)' : 'transparent',
                }}
              >
                <div
                  className="w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                  style={{
                    border: checked ? 'none' : '2px solid rgba(255,255,255,0.1)',
                    background: checked
                      ? meal.type === 'meal' ? '#4ade80' : '#60a5fa'
                      : 'transparent',
                  }}
                >
                  {checked && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <div className="w-11 flex-shrink-0">
                  <span className={`text-[13px] mono ${checked ? 'text-zinc-700' : isPast ? 'text-zinc-600' : 'text-zinc-400'}`}>
                    {meal.time}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-[15px] flex items-center gap-1.5 ${checked ? 'text-zinc-600 line-through' : 'text-white'}`}>
                    <span>{meal.icon}</span>
                    <span className="font-medium">{meal.title}</span>
                  </div>
                  <div className={`text-[13px] mt-0.5 leading-snug ${checked ? 'text-zinc-700' : 'text-zinc-500'}`}>
                    {meal.desc}
                  </div>
                </div>
                {isCurrent && !checked && (
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#4ade80' }} />
                )}
              </button>
            )
          })}
        </div>
        <div className="mt-3 flex justify-center">
          <span className="text-[12px] text-zinc-500 mono">
            {macros.kcal} kcal  {macros.protein}P  {macros.carbs}C  {macros.fat}G  {macros.water}L
          </span>
        </div>
      </motion.div>

      {/* ─── 7. MUSCLE MAP ─── */}
      <motion.div custom={6} variants={fadeIn} initial="hidden" animate="show" className="mt-6 px-4">
        <div className="text-[17px] font-semibold text-white mb-3">Desarrollo muscular</div>
        <div className="glass-card p-4">
          <MuscleHeatmap wkLog={wkLog} size={140} />
        </div>
      </motion.div>

      {/* ─── 8. SUPPLEMENT STACK ─── */}
      <motion.div custom={7} variants={fadeIn} initial="hidden" animate="show" className="mt-6 px-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[17px] font-semibold text-white">Suplementos</div>
          <div className="text-[13px] text-zinc-500">Fase {plan.phase}</div>
        </div>

        {/* Checklist */}
        <div className="glass-card overflow-hidden">
          {SUPPLEMENTS.filter(s => s.ph <= plan.phase).map((s, i, arr) => {
            const checked = checks[`s-${i}`]
            return (
              <button
                key={i}
                onClick={() => toggle(`s-${i}`)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                style={{
                  borderBottom: i < arr.length - 1 ? '0.33px solid rgba(255,255,255,0.05)' : 'none',
                }}
              >
                <div
                  className="w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    border: checked ? 'none' : '2px solid rgba(255,255,255,0.1)',
                    background: checked ? '#4ade80' : 'transparent',
                  }}
                >
                  {checked && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <span className={`text-[15px] ${checked ? 'text-zinc-600 line-through' : 'text-white'}`}>
                    {s.n}
                  </span>
                  <span className={`text-[13px] ml-2 ${checked ? 'text-zinc-700' : 'text-zinc-500'}`}>
                    {s.d}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  <span
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: (s.ev === 'A' ? '#4ade80' : s.ev === 'B' ? '#fbbf24' : '#ef4444') + '1a',
                      color: s.ev === 'A' ? '#4ade80' : s.ev === 'B' ? '#fbbf24' : '#ef4444',
                    }}
                  >
                    {s.ev}
                  </span>
                  {s.tb && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#fbbf241a', color: '#fbbf24' }}>
                      T
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Stack accumulation analysis */}
        {suppHistory.length > 0 && (
          <div className="mt-3">
            <div className="text-[13px] text-zinc-500 mb-2">{stackSummary}</div>
            <div className="glass-card overflow-hidden">
              {suppHistory.map((supp, i, arr) => (
                <div key={i} className="px-4 py-3" style={{ borderBottom: i < arr.length - 1 ? '0.33px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[14px] text-white font-medium">
                      {supp.name} <span className="text-zinc-500 text-[12px]">{supp.dosage}</span>
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full mono" style={{
                      background: supp.currentPhase === 'saturated' ? '#4ade8015' : supp.currentPhase === 'cycling-needed' ? '#ef444415' : '#fbbf2415',
                      color: supp.currentPhase === 'saturated' ? '#4ade80' : supp.currentPhase === 'cycling-needed' ? '#ef4444' : '#fbbf24',
                    }}>
                      {supp.currentPhase === 'saturated' ? 'Saturado' : supp.currentPhase === 'cycling-needed' ? 'Ciclar' : supp.currentPhase === 'building' ? 'Cargando' : 'Inicio'}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden mb-1.5">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, (supp.daysTaken / supp.saturationDays) * 100)}%`,
                        background: supp.isSaturated ? '#4ade80' : '#fbbf24',
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (supp.daysTaken / supp.saturationDays) * 100)}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                  <div className="text-[11px] text-zinc-600 mono mb-1">
                    {supp.daysTaken}d / {supp.saturationDays}d saturacion  {supp.adherence}% adherencia
                  </div>
                  {supp.effects.length > 0 && (
                    <div className="text-[12px] text-zinc-400 leading-snug">{supp.effects[supp.effects.length - 1]}</div>
                  )}
                  {supp.warnings.filter(w => w.startsWith('\u26a0')).map((w, wi) => (
                    <div key={wi} className="text-[11px] mt-1" style={{ color: '#ef4444' }}>{w}</div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* ─── 9. HEALTH JOURNAL ─── */}
      <motion.div custom={8} variants={fadeIn} initial="hidden" animate="show" className="mt-6 px-4">
        <HealthJournal />
      </motion.div>

      {/* ─── PROTOCOL PROGRESS (footer) ─── */}
      <motion.div custom={9} variants={fadeIn} initial="hidden" animate="show" className="mt-6 px-4">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] text-zinc-500">Progreso del protocolo</span>
            <span className="text-[13px] mono text-zinc-400">
              Dia {plan.day} / {plan.totalDays}
            </span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, #22c55e, #4ade80)` }}
              initial={{ width: 0 }}
              animate={{ width: `${plan.pct}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[13px] text-zinc-500">{plan.phaseName} · Semana {plan.week}</span>
            <span className="text-[13px] mono font-semibold" style={{ color: '#4ade80' }}>
              {plan.pct}%
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
