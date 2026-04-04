import { motion } from 'framer-motion'
import type { Plan, ReadinessResult, DecisionResult, InjuryResult, BloodResult, PredictionResult, HealthData, WorkoutLog, ScannedMeal } from '../lib/types'
import { SUPPLEMENTS, DAILY_MEALS } from '../lib/constants'
import { Ring } from '../components/ui/Ring'

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
}

const modeColors: Record<string, string> = {
  PUSH: '#30d158', NORMAL: '#ffd60a', REDUCE: '#ff9f0a',
  RECOVER: '#bf5af2', DELOAD: '#64d2ff', PROTECT: '#ff453a',
}

const fadeIn = {
  hidden: { opacity: 0, y: 10 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
}

// Determine which meals should be "current" based on time
function getCurrentMealIndex(): number {
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  for (let i = DAILY_MEALS.length - 1; i >= 0; i--) {
    const [h, m] = DAILY_MEALS[i].time.split(':').map(Number)
    if (currentMinutes >= h * 60 + m) return i
  }
  return 0
}

export function Dashboard({
  plan, readiness, decision, injury, blood, predictions,
  briefing, briefingLoading, checks, toggle,
}: DashboardProps) {
  const mc = modeColors[decision.mode] || '#ffd60a'
  const readyColor = readiness.score >= 70 ? '#30d158' : readiness.score >= 50 ? '#ff9f0a' : '#ff453a'
  const currentMeal = getCurrentMealIndex()

  // Count checked meals today
  const mealsChecked = DAILY_MEALS.filter((_, i) => checks[`meal-${i}`]).length

  return (
    <div className="pb-28">
      {/* ── Hero: Readiness Ring ── */}
      <motion.div
        custom={0} variants={fadeIn} initial="hidden" animate="show"
        className="flex flex-col items-center pt-4 pb-6"
      >
        <Ring pct={readiness.score} size={120} strokeWidth={8} color={readyColor}>
          <div className="text-center">
            <div className="text-[36px] font-black text-white mono">{readiness.score}</div>
            <div className="text-[11px] font-medium text-zinc-500">Readiness</div>
          </div>
        </Ring>

        <div className="mt-4 text-center">
          <div className="text-[15px] font-semibold" style={{ color: mc }}>
            {decision.action}
          </div>
          <div className="text-[13px] text-zinc-500 mt-1 max-w-[300px] leading-relaxed">
            {decision.details}
          </div>
        </div>

        {/* Modification pills */}
        <div className="flex gap-2 flex-wrap justify-center mt-3">
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
      </motion.div>

      {/* ── Readiness Breakdown ── */}
      <motion.div custom={1} variants={fadeIn} initial="hidden" animate="show">
        <div className="text-[13px] font-semibold text-zinc-400 uppercase tracking-wider px-4 mb-2">
          Componentes
        </div>
        <div className="bg-[#1c1c1e] rounded-2xl overflow-hidden mx-1">
          {[
            { l: 'HRV', v: readiness.hrvScore, c: '#64d2ff' },
            { l: 'Sueño', v: readiness.sleepScore, c: '#bf5af2' },
            { l: 'Consistencia', v: readiness.wakeScore, c: '#ffd60a' },
            { l: 'FC Reposo', v: readiness.rhrScore, c: '#ff453a' },
            { l: 'Carga (ACWR)', v: readiness.acwrScore, c: '#ff9f0a' },
          ].map((m, i, arr) => (
            <div
              key={i}
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: i < arr.length - 1 ? '0.33px solid rgba(255,255,255,0.08)' : 'none' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ background: m.c }} />
                <span className="text-[15px] text-white">{m.l}</span>
              </div>
              <span
                className="text-[15px] font-semibold mono"
                style={{ color: m.v >= 70 ? '#30d158' : m.v >= 50 ? '#ff9f0a' : '#ff453a' }}
              >
                {m.v}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── ACWR & Injury ── */}
      <motion.div custom={2} variants={fadeIn} initial="hidden" animate="show" className="mt-4">
        <div className="grid grid-cols-2 gap-3 mx-1">
          <div className="bg-[#1c1c1e] rounded-2xl p-4">
            <div className="text-[13px] text-zinc-500 mb-1">ACWR</div>
            <div
              className="text-[28px] font-black mono"
              style={{
                color: readiness.acwr >= 0.8 && readiness.acwr <= 1.3 ? '#30d158'
                  : readiness.acwr > 1.5 ? '#ff453a' : '#ff9f0a',
              }}
            >
              {readiness.acwr.toFixed(2)}
            </div>
            <div className="text-[11px] text-zinc-600 mt-1">Óptimo: 0.8 – 1.3</div>
            {/* Progress bar */}
            <div className="mt-3 h-1.5 bg-white/5 rounded-full relative overflow-hidden">
              <div className="absolute left-[40%] w-[25%] h-full rounded-full" style={{ background: '#30d15830' }} />
              <motion.div
                className="absolute h-1.5 w-1.5 rounded-full top-0"
                style={{ background: readiness.acwr >= 0.8 && readiness.acwr <= 1.3 ? '#30d158' : '#ff453a' }}
                initial={{ left: '0%' }}
                animate={{ left: `${Math.min(readiness.acwr / 2 * 100, 100)}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </div>
          <div className="bg-[#1c1c1e] rounded-2xl p-4">
            <div className="text-[13px] text-zinc-500 mb-1">Riesgo Lesión</div>
            <div
              className="text-[28px] font-black mono"
              style={{ color: injury.level === 'LOW' ? '#30d158' : injury.level === 'MODERATE' ? '#ff9f0a' : '#ff453a' }}
            >
              {injury.risk}%
            </div>
            <div
              className="text-[11px] font-semibold mt-1"
              style={{ color: injury.level === 'LOW' ? '#30d158' : injury.level === 'MODERATE' ? '#ff9f0a' : '#ff453a' }}
            >
              {injury.level === 'LOW' ? 'Bajo' : injury.level === 'MODERATE' ? 'Moderado' : 'Alto'}
            </div>
            {injury.factors.length > 0 && (
              <div className="text-[11px] text-zinc-600 mt-2 leading-relaxed">{injury.factors[0]}</div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Comidas de Hoy ── */}
      <motion.div custom={3} variants={fadeIn} initial="hidden" animate="show" className="mt-6">
        <div className="flex items-center justify-between px-4 mb-2">
          <div className="text-[13px] font-semibold text-zinc-400 uppercase tracking-wider">
            Comidas de Hoy
          </div>
          <div className="text-[13px] text-zinc-600 mono">
            {mealsChecked}/{DAILY_MEALS.length}
          </div>
        </div>
        <div className="bg-[#1c1c1e] rounded-2xl overflow-hidden mx-1">
          {DAILY_MEALS.map((meal, i) => {
            const checked = checks[`meal-${i}`]
            const isPast = i < currentMeal
            const isCurrent = i === currentMeal

            return (
              <button
                key={i}
                onClick={() => toggle(`meal-${i}`)}
                className="w-full flex items-center gap-3.5 px-4 py-3 text-left transition-colors"
                style={{
                  borderBottom: i < DAILY_MEALS.length - 1 ? '0.33px solid rgba(255,255,255,0.08)' : 'none',
                  background: isCurrent && !checked ? 'rgba(255, 214, 10, 0.04)' : 'transparent',
                }}
              >
                {/* Check circle */}
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

                {/* Time */}
                <div className="w-11 flex-shrink-0">
                  <span className={`text-[13px] mono ${checked ? 'text-zinc-700' : isPast ? 'text-zinc-600' : 'text-zinc-400'}`}>
                    {meal.time}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className={`text-[15px] flex items-center gap-1.5 ${checked ? 'text-zinc-600 line-through' : 'text-white'}`}>
                    <span>{meal.icon}</span>
                    <span className="font-medium">{meal.title}</span>
                  </div>
                  <div className={`text-[13px] mt-0.5 leading-snug ${checked ? 'text-zinc-700' : 'text-zinc-500'}`}>
                    {meal.desc}
                  </div>
                </div>

                {/* Current indicator */}
                {isCurrent && !checked && (
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#ffd60a' }} />
                )}
              </button>
            )
          })}
        </div>
      </motion.div>

      {/* ── Recovery ── */}
      <motion.div custom={4} variants={fadeIn} initial="hidden" animate="show" className="mt-6">
        <div className="text-[13px] font-semibold text-zinc-400 uppercase tracking-wider px-4 mb-2">
          Recovery
        </div>
        <div className="bg-[#1c1c1e] rounded-2xl overflow-hidden mx-1">
          {decision.recovery.map((r, i, arr) => (
            <div
              key={i}
              className="flex items-center px-4 py-3"
              style={{ borderBottom: i < arr.length - 1 ? '0.33px solid rgba(255,255,255,0.08)' : 'none' }}
            >
              <span className="text-[15px] text-white">{r}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Why (Reasons) ── */}
      {decision.reasons.length > 0 && (
        <motion.div custom={5} variants={fadeIn} initial="hidden" animate="show" className="mt-6">
          <div className="text-[13px] font-semibold text-zinc-400 uppercase tracking-wider px-4 mb-2">
            Factores
          </div>
          <div className="bg-[#1c1c1e] rounded-2xl overflow-hidden mx-1">
            {decision.reasons.map((r, i, arr) => (
              <div
                key={i}
                className="flex items-center gap-2.5 px-4 py-3"
                style={{ borderBottom: i < arr.length - 1 ? '0.33px solid rgba(255,255,255,0.08)' : 'none' }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 flex-shrink-0" />
                <span className="text-[14px] text-zinc-300">{r}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Blood Work ── */}
      <motion.div custom={6} variants={fadeIn} initial="hidden" animate="show" className="mt-6">
        <div className="text-[13px] font-semibold text-zinc-400 uppercase tracking-wider px-4 mb-2">
          Analítica
        </div>
        <div className="bg-[#1c1c1e] rounded-2xl p-4 mx-1">
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-semibold text-white">{blood.next.label}</span>
            <span
              className="text-[13px] font-semibold mono px-2.5 py-0.5 rounded-full"
              style={{
                background: blood.overdue ? '#ff453a1a' : '#ffd60a1a',
                color: blood.overdue ? '#ff453a' : '#ffd60a',
              }}
            >
              {blood.overdue ? 'Pendiente' : `${blood.weeksUntil} sem`}
            </span>
          </div>
          <div className="text-[13px] text-zinc-500 mt-2 leading-relaxed">{blood.next.markers}</div>
        </div>
      </motion.div>

      {/* ── Prediction ── */}
      {predictions.weightTrend && (
        <motion.div custom={7} variants={fadeIn} initial="hidden" animate="show" className="mt-6">
          <div className="text-[13px] font-semibold text-zinc-400 uppercase tracking-wider px-4 mb-2">
            Predicción
          </div>
          <div className="bg-[#1c1c1e] rounded-2xl p-4 mx-1">
            <div className="flex items-baseline justify-between">
              <span className="text-[13px] text-zinc-500">Peso actual</span>
              <span className="text-[17px] font-bold text-white mono">{predictions.weightTrend.current.toFixed(1)} kg</span>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-[13px] text-zinc-500">Cambio semanal</span>
              <span
                className="text-[17px] font-bold mono"
                style={{ color: predictions.weightTrend.weeklyChange > 0 ? '#30d158' : '#ff453a' }}
              >
                {predictions.weightTrend.weeklyChange > 0 ? '+' : ''}{predictions.weightTrend.weeklyChange.toFixed(2)} kg
              </span>
            </div>
            <div
              className="mt-3 pt-3 flex items-baseline justify-between"
              style={{ borderTop: '0.33px solid rgba(255,255,255,0.08)' }}
            >
              <span className="text-[13px] text-zinc-500">Proyección 4 sem</span>
              <span className="text-[17px] font-bold mono" style={{ color: '#ffd60a' }}>
                {predictions.weightTrend.projected4w} kg
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Briefing IA ── */}
      <motion.div custom={8} variants={fadeIn} initial="hidden" animate="show" className="mt-6">
        <div className="text-[13px] font-semibold text-zinc-400 uppercase tracking-wider px-4 mb-2">
          Briefing IA
        </div>
        <div className="bg-[#1c1c1e] rounded-2xl p-4 mx-1">
          {briefingLoading ? (
            <div className="text-[14px] text-center py-6 animate-pulse" style={{ color: '#ffd60a' }}>
              Generando briefing...
            </div>
          ) : briefing ? (
            <div className="text-[14px] text-zinc-300 leading-relaxed whitespace-pre-wrap">{briefing}</div>
          ) : (
            <div className="text-[14px] text-zinc-600 text-center py-6">
              Configura tu API key en ajustes para activar el briefing automático
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Suplementos ── */}
      <motion.div custom={9} variants={fadeIn} initial="hidden" animate="show" className="mt-6">
        <div className="flex items-center justify-between px-4 mb-2">
          <div className="text-[13px] font-semibold text-zinc-400 uppercase tracking-wider">
            Suplementos
          </div>
          <div className="text-[13px] text-zinc-600">Fase {plan.phase}</div>
        </div>
        <div className="bg-[#1c1c1e] rounded-2xl overflow-hidden mx-1">
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

      {/* ── Progress Bar ── */}
      <motion.div custom={10} variants={fadeIn} initial="hidden" animate="show" className="mt-6 mx-1">
        <div className="bg-[#1c1c1e] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] text-zinc-500">Progreso total</span>
            <span className="text-[13px] mono text-zinc-400">
              Día {plan.day} de {plan.totalDays}
            </span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #ffd60a, #ff9f0a)' }}
              initial={{ width: 0 }}
              animate={{ width: `${plan.pct}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[13px] text-zinc-500">{plan.phaseName}</span>
            <span className="text-[13px] mono font-semibold" style={{ color: '#ffd60a' }}>
              {plan.pct}%
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
