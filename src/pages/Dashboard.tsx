import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { Plan, ReadinessResult, DecisionResult, InjuryResult, BloodResult, PredictionResult, HealthData, WorkoutLog, ScannedMeal } from '../lib/types'
import type { MealPlan } from '../lib/profile'
import { SUPPLEMENTS, WORKOUTS } from '../lib/constants'
import { Ring } from '../components/ui/Ring'
import { Chart } from '../components/ui/Chart'

import { computeSupplementHistory, generateStackSummary, type SupplementHistory } from '../engines/supplementTracker'
import { computeStrain, computeEnergyBank } from '../engines/strain'
import { MuscleHeatmap } from '../components/ui/MuscleHeatmap'
import { HealthJournal } from '../components/ui/HealthJournal'

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

/* ─── Concentric Activity Rings (Apple Fitness style) ─── */
function ActivityRings({
  workoutPct,
  nutritionPct,
  readinessPct,
}: {
  workoutPct: number
  nutritionPct: number
  readinessPct: number
}) {
  const outerSize = 160
  const middleSize = 124
  const innerSize = 88
  const sw = 14

  const ENTRENO = '#ff9f0a'
  const NUTRICION = '#30d158'
  const READINESS = '#64d2ff'

  return (
    <div className="relative" style={{ width: outerSize, height: outerSize }}>
      {/* Outer — Entreno */}
      <div className="absolute inset-0">
        <Ring pct={workoutPct} size={outerSize} strokeWidth={sw} color={ENTRENO} />
      </div>
      {/* Middle — Nutrición */}
      <div
        className="absolute"
        style={{
          top: (outerSize - middleSize) / 2,
          left: (outerSize - middleSize) / 2,
        }}
      >
        <Ring pct={nutritionPct} size={middleSize} strokeWidth={sw} color={NUTRICION} />
      </div>
      {/* Inner — Readiness */}
      <div
        className="absolute"
        style={{
          top: (outerSize - innerSize) / 2,
          left: (outerSize - innerSize) / 2,
        }}
      >
        <Ring pct={readinessPct} size={innerSize} strokeWidth={sw} color={READINESS} />
      </div>
      {/* Center label */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[22px] font-black text-white mono">S</span>
      </div>
    </div>
  )
}

export function Dashboard({
  plan, readiness, decision, injury, blood,
  hd, briefing, briefingLoading, wkLog, checks, toggle, scannedMeals, mealPlan, macros,
}: DashboardProps) {
  // ── Workout completion ──
  const TODAY_LOCAL = new Date().toLocaleDateString('sv')
  const todaySets = Object.entries(wkLog)
    .filter(([key]) => key.startsWith(TODAY_LOCAL))
    .reduce((sum, [, sets]) => sum + sets.length, 0)
  const targetSets = plan.split === 'REST' ? 0 : (WORKOUTS[plan.split] || []).reduce((sum, ex) => sum + ex.s, 0)
  const workoutPct = targetSets > 0 ? Math.min(100, Math.round(todaySets / targetSets * 100)) : 100

  // ── Nutrition completion ──
  const totalMeals = mealPlan.filter(m => m.type === 'meal').length || 1
  const mealsChecked = mealPlan.filter((m, i) => m.type === 'meal' && checks[`meal-${i}`]).length
  const nutritionPct = Math.min(100, Math.round(mealsChecked / totalMeals * 100))

  // ── Consumed kcal (scanned + checked meals) ──
  const todayScanned = scannedMeals.filter(m => m.date === TODAY_LOCAL)
  const consumedKcal = todayScanned.reduce((a, m) => a + m.kcal, 0) + (mealsChecked * Math.round(macros.kcal / totalMeals))

  // ── Readiness ──
  const readinessPct = Math.min(100, Math.max(0, readiness.score))

  // ── Chart data ──
  const readinessData = (hd.hrv || []).slice(-14).map(e => ({ date: e.d, value: e.v }))
  const weightData = (hd.weight || []).slice(-14).map(e => ({ date: e.d, value: e.v }))

  const currentMeal = getCurrentMealIndex(mealPlan)
  const mc = ({ PUSH: '#30d158', NORMAL: '#ffd60a', REDUCE: '#ff9f0a', RECOVER: '#bf5af2', DELOAD: '#64d2ff', PROTECT: '#ff453a' } as Record<string, string>)[decision.mode] || '#ffd60a'

  // Strain + Energy
  const strain = computeStrain(hd, wkLog)
  const energy = computeEnergyBank(readiness.score, hd, strain)

  // Supplement history (automatic, not button-based)
  const [suppHistory, setSuppHistory] = useState<SupplementHistory[]>([])
  const [stackSummary, setStackSummary] = useState('')

  const suppCheckKey = SUPPLEMENTS.filter(s => s.ph <= plan.phase).map((_, i) => checks[`s-${i}`] ? '1' : '0').join('')
  useEffect(() => {
    computeSupplementHistory(plan, checks).then(history => {
      setSuppHistory(history)
      setStackSummary(generateStackSummary(history))
    })
  }, [plan.day, plan.phase, suppCheckKey])

  return (
    <div className="pb-28 bg-black min-h-screen">

      {/* ═══════════════════════════════════════════════
          1. ACTIVITY RINGS HERO
          ═══════════════════════════════════════════════ */}
      <motion.div
        custom={0} variants={fadeIn} initial="hidden" animate="show"
        className="flex flex-col items-center pt-6 pb-2"
      >
        <ActivityRings
          workoutPct={workoutPct}
          nutritionPct={nutritionPct}
          readinessPct={readinessPct}
        />

        {/* Metrics row */}
        <div className="mt-5 flex items-center gap-1.5 flex-wrap justify-center px-4">
          <span className="text-[13px] font-semibold" style={{ color: '#ff9f0a' }}>
            Entreno
          </span>
          <span className="text-[13px] text-zinc-400 mono">
            {todaySets}/{targetSets} sets
          </span>
          <span className="text-[13px] text-zinc-700 mx-1">·</span>
          <span className="text-[13px] font-semibold" style={{ color: '#30d158' }}>
            Nutrición
          </span>
          <span className="text-[13px] text-zinc-400 mono">
            {consumedKcal}/{macros.kcal} kcal
          </span>
          <span className="text-[13px] text-zinc-700 mx-1">·</span>
          <span className="text-[13px] font-semibold" style={{ color: '#64d2ff' }}>
            Ready
          </span>
          <span className="text-[13px] text-zinc-400 mono">
            {readiness.score}/100
          </span>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════
          2. AI INSIGHT CARD
          ═══════════════════════════════════════════════ */}
      <motion.div custom={1} variants={fadeIn} initial="hidden" animate="show" className="mt-8 px-4">
        <div className="text-[20px] font-bold text-white mb-3">Briefing IA</div>
        <div
          className="bg-[#1c1c1e] rounded-2xl p-4 relative overflow-hidden"
        >
          {/* Accent gradient bar */}
          <div
            className="absolute top-0 left-0 right-0 h-[3px]"
            style={{ background: 'linear-gradient(90deg, #ff9f0a, #30d158, #64d2ff)' }}
          />
          {briefingLoading ? (
            <div className="py-6 flex flex-col items-center gap-3">
              <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full"
                    style={{ background: '#ff9f0a' }}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
              <span className="text-[14px] text-zinc-500">Generando briefing...</span>
            </div>
          ) : briefing ? (
            <div className="text-[14px] text-zinc-300 leading-relaxed whitespace-pre-wrap pt-1">
              {briefing}
            </div>
          ) : (
            <div className="text-[14px] text-zinc-500 text-center py-6">
              Configura tu API key en ajustes para activar el briefing diario
            </div>
          )}
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════
          3. HOY (TODAY SUMMARY)
          ═══════════════════════════════════════════════ */}
      <motion.div custom={2} variants={fadeIn} initial="hidden" animate="show" className="mt-8 px-4">
        <div className="text-[20px] font-bold text-white mb-3">Hoy</div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Día del protocolo', value: `${plan.day}`, sub: `Semana ${plan.week}` },
            { label: 'Fase actual', value: plan.phaseName, sub: `Fase ${plan.phase}` },
            { label: 'Split de hoy', value: plan.split, sub: plan.split === 'REST' ? 'Descanso activo' : 'Entrenamiento' },
            {
              label: 'ACWR',
              value: readiness.acwr.toFixed(2),
              sub: readiness.acwr >= 0.8 && readiness.acwr <= 1.3 ? 'Zona óptima' : readiness.acwr > 1.5 ? 'Riesgo alto' : 'Fuera de rango',
              color: readiness.acwr >= 0.8 && readiness.acwr <= 1.3 ? '#30d158' : readiness.acwr > 1.5 ? '#ff453a' : '#ff9f0a',
            },
          ].map((item, i) => (
            <div key={i} className="bg-[#1c1c1e] rounded-2xl p-4">
              <div className="text-[13px] text-zinc-500 mb-1">{item.label}</div>
              <div
                className="text-[22px] font-bold mono"
                style={{ color: (item as { color?: string }).color || '#ffffff' }}
              >
                {item.value}
              </div>
              <div className="text-[12px] text-zinc-600 mt-0.5">{item.sub}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Strain + Energy ── */}
      <motion.div custom={2.5} variants={fadeIn} initial="hidden" animate="show" className="mt-4 px-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#1c1c1e] rounded-2xl p-4">
            <div className="text-[13px] text-zinc-500 mb-1">Strain</div>
            <div className="text-[28px] font-black mono" style={{ color: strain.level === 'overreaching' ? '#ff453a' : strain.level === 'high' ? '#ff9f0a' : '#30d158' }}>
              {strain.score.toFixed(1)}
            </div>
            <div className="text-[11px] text-zinc-600">/21 · {strain.level}</div>
          </div>
          <div className="bg-[#1c1c1e] rounded-2xl p-4">
            <div className="text-[13px] text-zinc-500 mb-1">Energía</div>
            <div className="text-[28px] font-black mono" style={{ color: energy.color }}>
              {energy.level}%
            </div>
            <div className="text-[11px] text-zinc-600">{energy.status}</div>
          </div>
        </div>
        <div className="text-[12px] text-zinc-500 mt-2 px-1">{energy.recommendation}</div>
      </motion.div>

      {/* ═══════════════════════════════════════════════
          4. COMIDAS DE HOY
          ═══════════════════════════════════════════════ */}
      <motion.div custom={3} variants={fadeIn} initial="hidden" animate="show" className="mt-8 px-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[20px] font-bold text-white">Comidas de Hoy</div>
          <div className="text-[13px] text-zinc-500 mono">{mealsChecked}/{mealPlan.length}</div>
        </div>
        <div className="bg-[#1c1c1e] rounded-2xl overflow-hidden">
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
                  borderBottom: i < mealPlan.length - 1 ? '0.33px solid rgba(255,255,255,0.08)' : 'none',
                  background: isCurrent && !checked ? 'rgba(255, 214, 10, 0.04)' : 'transparent',
                }}
              >
                <div
                  className="w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                  style={{
                    border: checked ? 'none' : '2px solid rgba(255,255,255,0.15)',
                    background: checked
                      ? meal.type === 'meal' ? '#30d158' : '#64d2ff'
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
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#ffd60a' }} />
                )}
              </button>
            )
          })}
        </div>

        {/* Macro summary below meals */}
        <div className="mt-3 flex justify-center">
          <span className="text-[12px] text-zinc-500 mono">
            {macros.kcal} kcal · {macros.protein}P · {macros.carbs}C · {macros.fat}G · {macros.water}L
          </span>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════
          5. TENDENCIAS (TREND CHARTS)
          ═══════════════════════════════════════════════ */}
      <motion.div custom={4} variants={fadeIn} initial="hidden" animate="show" className="mt-8 px-4">
        <div className="text-[20px] font-bold text-white mb-3">Tendencias</div>
        <div className="grid grid-cols-2 gap-3">
          {/* HRV / Readiness trend */}
          <div className="bg-[#1c1c1e] rounded-2xl p-3">
            <div className="text-[13px] text-zinc-500 mb-2">HRV (14d)</div>
            <Chart
              data={readinessData}
              color="#64d2ff"
              height={80}
              showArea
              showDots={false}
              showLabels
              unit=" ms"
            />
          </div>
          {/* Weight trend */}
          <div className="bg-[#1c1c1e] rounded-2xl p-3">
            <div className="text-[13px] text-zinc-500 mb-2">Peso (14d)</div>
            <Chart
              data={weightData}
              color="#ff9f0a"
              height={80}
              showArea
              showDots={false}
              showLabels
              unit=" kg"
            />
          </div>
        </div>
      </motion.div>

      {/* ── Muscle Progress Heatmap ── */}
      <motion.div custom={5.5} variants={fadeIn} initial="hidden" animate="show" className="mt-8 px-4">
        <div className="text-[20px] font-bold text-white mb-3">Desarrollo Muscular</div>
        <div className="bg-[#1c1c1e] rounded-2xl p-4">
          <MuscleHeatmap wkLog={wkLog} size={140} />
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════
          6. DECISION DEL MOTOR
          ═══════════════════════════════════════════════ */}
      <motion.div custom={5} variants={fadeIn} initial="hidden" animate="show" className="mt-8 px-4">
        <div className="text-[20px] font-bold text-white mb-3">Decisión del Motor</div>
        <div className="bg-[#1c1c1e] rounded-2xl p-4">
          {/* Action */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: mc }} />
            <span className="text-[16px] font-semibold text-white">{decision.action}</span>
            <span
              className="text-[12px] font-semibold px-2.5 py-0.5 rounded-full ml-auto"
              style={{ background: mc + '1a', color: mc }}
            >
              {decision.mode}
            </span>
          </div>

          {/* Details */}
          <div className="text-[14px] text-zinc-400 leading-relaxed mb-3">
            {decision.details}
          </div>

          {/* Mods */}
          {decision.mods.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-3">
              {decision.mods.map((m, i) => (
                <span
                  key={i}
                  className="text-[11px] font-medium px-3 py-1 rounded-full"
                  style={{ background: mc + '1a', color: mc }}
                >
                  {m}
                </span>
              ))}
            </div>
          )}

          {/* Recovery */}
          {decision.recovery.length > 0 && (
            <>
              <div
                className="pt-3 mb-2"
                style={{ borderTop: '0.33px solid rgba(255,255,255,0.08)' }}
              >
                <span className="text-[13px] text-zinc-500">Recuperación</span>
              </div>
              {decision.recovery.map((r, i) => (
                <div key={i} className="flex items-center gap-2.5 py-1.5">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#64d2ff' }} />
                  <span className="text-[14px] text-zinc-300">{r}</span>
                </div>
              ))}
            </>
          )}

          {/* Reasons */}
          {decision.reasons.length > 0 && (
            <>
              <div
                className="pt-3 mt-2 mb-2"
                style={{ borderTop: '0.33px solid rgba(255,255,255,0.08)' }}
              >
                <span className="text-[13px] text-zinc-500">Factores</span>
              </div>
              {decision.reasons.map((r, i) => (
                <div key={i} className="flex items-center gap-2.5 py-1.5">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-zinc-500" />
                  <span className="text-[14px] text-zinc-400">{r}</span>
                </div>
              ))}
            </>
          )}

          {/* Injury risk */}
          {injury.level !== 'LOW' && (
            <>
              <div
                className="pt-3 mt-2 mb-2"
                style={{ borderTop: '0.33px solid rgba(255,255,255,0.08)' }}
              >
                <span className="text-[13px]" style={{ color: injury.level === 'HIGH' ? '#ff453a' : '#ff9f0a' }}>
                  Riesgo de lesión: {injury.level} ({injury.risk}%)
                </span>
              </div>
              {injury.factors.map((f, i) => (
                <div key={i} className="flex items-center gap-2.5 py-1.5">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: injury.level === 'HIGH' ? '#ff453a' : '#ff9f0a' }} />
                  <span className="text-[14px] text-zinc-400">{f}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════
          7. ANALITICA (BLOOD WORK)
          ═══════════════════════════════════════════════ */}
      <motion.div custom={6} variants={fadeIn} initial="hidden" animate="show" className="mt-8 px-4">
        <div className="text-[20px] font-bold text-white mb-3">Analítica</div>
        <div className="bg-[#1c1c1e] rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-semibold text-white">{blood.next.label}</span>
            <span
              className="text-[12px] font-semibold mono px-2.5 py-0.5 rounded-full"
              style={{
                background: blood.overdue ? '#ff453a1a' : '#30d1581a',
                color: blood.overdue ? '#ff453a' : '#30d158',
              }}
            >
              {blood.overdue ? 'Pendiente' : `${blood.weeksUntil} sem`}
            </span>
          </div>
          <div className="text-[13px] text-zinc-500 mt-2 leading-relaxed">{blood.next.markers}</div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════
          8. SUPLEMENTOS
          ═══════════════════════════════════════════════ */}
      <motion.div custom={7} variants={fadeIn} initial="hidden" animate="show" className="mt-8 px-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[20px] font-bold text-white">Suplementos</div>
          <div className="text-[13px] text-zinc-500">Fase {plan.phase}</div>
        </div>
        <div className="bg-[#1c1c1e] rounded-2xl overflow-hidden">
          {SUPPLEMENTS.filter(s => s.ph <= plan.phase).map((s, i, arr) => {
            const checked = checks[`s-${i}`]
            return (
              <button
                key={i}
                onClick={() => toggle(`s-${i}`)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                style={{
                  borderBottom: i < arr.length - 1 ? '0.33px solid rgba(255,255,255,0.08)' : 'none',
                }}
              >
                <div
                  className="w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    border: checked ? 'none' : '2px solid rgba(255,255,255,0.15)',
                    background: checked ? '#30d158' : 'transparent',
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
                      background: (s.ev === 'A' ? '#30d158' : s.ev === 'B' ? '#ffd60a' : '#ff453a') + '1a',
                      color: s.ev === 'A' ? '#30d158' : s.ev === 'B' ? '#ffd60a' : '#ff453a',
                    }}
                  >
                    {s.ev}
                  </span>
                  {s.tb && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#ffd60a1a', color: '#ffd60a' }}>
                      T
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </motion.div>

      {/* ── Supplement Accumulation Analysis (automatic) ── */}
      <motion.div custom={7} variants={fadeIn} initial="hidden" animate="show" className="mt-8 px-4">
        <div className="text-[20px] font-bold text-white mb-3">Stack · Acumulado</div>
        <div className="text-[13px] text-zinc-500 mb-3 whitespace-pre-wrap">{stackSummary}</div>
        <div className="bg-[#1c1c1e] rounded-2xl overflow-hidden">
          {suppHistory.map((supp, i, arr) => (
            <div key={i} className="px-4 py-3" style={{ borderBottom: i < arr.length - 1 ? '0.33px solid rgba(255,255,255,0.08)' : 'none' }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[15px] text-white font-medium">{supp.name} <span className="text-zinc-500 text-[13px]">{supp.dosage}</span></span>
                <span className="text-[11px] px-2 py-0.5 rounded-full mono" style={{
                  background: supp.currentPhase === 'saturated' ? '#30d15815' : supp.currentPhase === 'cycling-needed' ? '#ff453a15' : '#ffd60a15',
                  color: supp.currentPhase === 'saturated' ? '#30d158' : supp.currentPhase === 'cycling-needed' ? '#ff453a' : '#ffd60a',
                }}>
                  {supp.currentPhase === 'saturated' ? 'Saturado' : supp.currentPhase === 'cycling-needed' ? 'Ciclar' : supp.currentPhase === 'building' ? 'Cargando' : 'Inicio'}
                </span>
              </div>
              {/* Progress to saturation */}
              <div className="h-1 bg-white/5 rounded-full overflow-hidden mb-1.5">
                <div className="h-full rounded-full transition-all" style={{
                  width: `${Math.min(100, (supp.daysTaken / supp.saturationDays) * 100)}%`,
                  background: supp.isSaturated ? '#30d158' : '#ffd60a',
                }} />
              </div>
              <div className="text-[11px] text-zinc-600 mono mb-1">{supp.daysTaken}d / {supp.saturationDays}d saturación · {supp.adherence}% adherencia</div>
              {/* Latest effect */}
              {supp.effects.length > 0 && (
                <div className="text-[12px] text-zinc-400 leading-snug">{supp.effects[supp.effects.length - 1]}</div>
              )}
              {/* Warnings */}
              {supp.warnings.filter(w => w.startsWith('⚠')).map((w, wi) => (
                <div key={wi} className="text-[11px] mt-1" style={{ color: '#ff453a' }}>{w}</div>
              ))}
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Health Journal ── */}
      <motion.div custom={8.5} variants={fadeIn} initial="hidden" animate="show" className="mt-8 px-4">
        <HealthJournal />
      </motion.div>

      {/* ═══════════════════════════════════════════════
          PROTOCOL PROGRESS (compact footer)
          ═══════════════════════════════════════════════ */}
      <motion.div custom={8} variants={fadeIn} initial="hidden" animate="show" className="mt-8 px-4">
        <div className="bg-[#1c1c1e] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] text-zinc-500">Progreso del protocolo</span>
            <span className="text-[13px] mono text-zinc-400">
              Día {plan.day} / {plan.totalDays}
            </span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #ff9f0a, #30d158)' }}
              initial={{ width: 0 }}
              animate={{ width: `${plan.pct}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[13px] text-zinc-500">{plan.phaseName}</span>
            <span className="text-[13px] mono font-semibold" style={{ color: '#30d158' }}>
              {plan.pct}%
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
