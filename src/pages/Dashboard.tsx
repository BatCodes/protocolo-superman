import { motion } from 'framer-motion'
import type { Plan, ReadinessResult, DecisionResult, InjuryResult, BloodResult, PredictionResult, HealthData, WorkoutLog, ScannedMeal } from '../lib/types'
import { SUPPLEMENTS } from '../lib/constants'
import { Ring } from '../components/ui/Ring'
import { Badge } from '../components/ui/Badge'
import { GlassCard } from '../components/ui/GlassCard'
import { Section } from '../components/ui/Section'

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
  PUSH: '#16a34a', NORMAL: '#c9a227', REDUCE: '#ea580c',
  RECOVER: '#8b5cf6', DELOAD: '#06b6d4', PROTECT: '#dc2626',
}
const injColors: Record<string, string> = {
  LOW: '#16a34a', MODERATE: '#ea580c', HIGH: '#dc2626',
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export function Dashboard({
  plan, readiness, decision, injury, blood, predictions,
  briefing, briefingLoading, checks, toggle,
}: DashboardProps) {
  const mc = modeColors[decision.mode] || '#c9a227'
  const ic = injColors[injury.level] || '#16a34a'
  const readyColor = readiness.score >= 70 ? '#16a34a' : readiness.score >= 50 ? '#ea580c' : '#dc2626'

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="pb-28 space-y-3"
    >
      {/* SITREP BAR */}
      <motion.div variants={fadeUp}>
        <GlassCard className="p-3.5">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-[8px] text-zinc-600 font-mono tracking-[0.3em] uppercase">
                DÍA {plan.day}/{plan.totalDays} · SEM {plan.week}
              </div>
              <div className="text-sm font-black font-mono" style={{ color: '#c9a227' }}>
                {plan.phaseName} · {plan.split}
              </div>
            </div>
            <div className="w-24 ml-3">
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: '#c9a227' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${plan.pct}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
              <div className="text-[7px] text-zinc-600 font-mono text-right mt-0.5">{plan.pct}%</div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* READINESS + DECISION */}
      <motion.div variants={fadeUp}>
        <GlassCard className="p-4" glowColor={mc}>
          <div className="flex gap-4 items-center mb-3">
            <Ring pct={readiness.score} size={76} strokeWidth={5} color={readyColor}>
              <div className="text-center">
                <div className="text-[22px] font-black font-mono text-zinc-100">{readiness.score}</div>
                <div className="text-[6px] font-mono text-zinc-500 tracking-widest">READY</div>
              </div>
            </Ring>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-extrabold leading-tight mb-1" style={{ color: mc }}>
                {decision.action}
              </div>
              <div className="text-[11px] text-zinc-500 leading-relaxed">
                {decision.details}
              </div>
            </div>
          </div>

          {/* Modification badges */}
          <div className="flex gap-1.5 flex-wrap mb-3">
            {decision.mods.map((m, i) => (
              <span
                key={i}
                className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md"
                style={{
                  background: mc + '15',
                  border: `1px solid ${mc}25`,
                  color: mc,
                }}
              >
                {m}
              </span>
            ))}
          </div>

          {/* WHY — Explainable AI */}
          {decision.reasons.length > 0 && (
            <div className="bg-black/40 rounded-lg p-3 border border-white/[0.04]">
              <div className="text-[8px] text-zinc-600 font-mono tracking-[0.15em] mb-1.5">POR QUÉ</div>
              {decision.reasons.map((r, i) => (
                <div key={i} className="text-[10px] text-zinc-400 leading-relaxed">• {r}</div>
              ))}
            </div>
          )}
        </GlassCard>
      </motion.div>

      {/* Readiness Components */}
      <motion.div variants={fadeUp} className="grid grid-cols-5 gap-1.5">
        {[
          { l: 'HRV', v: readiness.hrvScore, c: '#06b6d4' },
          { l: 'SUEÑO', v: readiness.sleepScore, c: '#8b5cf6' },
          { l: 'WAKE', v: readiness.wakeScore, c: '#c9a227' },
          { l: 'FC', v: readiness.rhrScore, c: '#dc2626' },
          { l: 'ACWR', v: readiness.acwrScore, c: '#ea580c' },
        ].map((m, i) => (
          <GlassCard key={i} className="p-2 text-center">
            <div
              className="text-[15px] font-extrabold font-mono"
              style={{ color: m.v >= 70 ? '#16a34a' : m.v >= 50 ? '#ea580c' : '#dc2626' }}
            >
              {m.v}
            </div>
            <div className="text-[7px] font-mono text-zinc-500">{m.l}</div>
          </GlassCard>
        ))}
      </motion.div>

      {/* ACWR + Injury Risk */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 gap-2">
        <GlassCard className="p-3.5" glowColor={readiness.acwr > 1.3 ? '#ea580c' : undefined}>
          <div className="text-[8px] text-zinc-500 font-mono tracking-wider">ACWR</div>
          <div
            className="text-[22px] font-black font-mono"
            style={{
              color: readiness.acwr >= 0.8 && readiness.acwr <= 1.3 ? '#16a34a'
                : readiness.acwr > 1.5 ? '#dc2626' : '#ea580c',
            }}
          >
            {readiness.acwr.toFixed(2)}
          </div>
          <div className="text-[8px] text-zinc-600 font-mono">Óptimo: 0.8-1.3</div>
          <div className="mt-2 h-1.5 bg-white/5 rounded-full relative overflow-hidden">
            <div className="absolute left-[40%] w-[25%] h-full bg-green-500/20 rounded-full" />
            <motion.div
              className="absolute h-2 w-1 rounded-full -top-[1px]"
              style={{
                background: readiness.acwr >= 0.8 && readiness.acwr <= 1.3 ? '#16a34a' : '#dc2626',
              }}
              initial={{ left: '0%' }}
              animate={{ left: `${Math.min(readiness.acwr / 2 * 100, 100)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </GlassCard>

        <GlassCard className="p-3.5" glowColor={ic}>
          <div className="text-[8px] text-zinc-500 font-mono tracking-wider">RIESGO LESIÓN</div>
          <div className="text-[22px] font-black font-mono" style={{ color: ic }}>
            {injury.risk}%
          </div>
          <div className="text-[8px] font-mono font-bold" style={{ color: ic }}>
            {injury.level}
          </div>
          {injury.factors.length > 0 && (
            <div className="text-[8px] text-zinc-600 mt-1.5 leading-relaxed">{injury.factors[0]}</div>
          )}
        </GlassCard>
      </motion.div>

      {/* Recovery Autopilot */}
      <motion.div variants={fadeUp}>
        <Section title="RECOVERY AUTOPILOT" color="#06b6d4" />
        <GlassCard className="p-3.5">
          {decision.recovery.map((r, i) => (
            <div
              key={i}
              className="text-[11px] text-zinc-200 py-1.5"
              style={{ borderBottom: i < decision.recovery.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
            >
              {r}
            </div>
          ))}
        </GlassCard>
      </motion.div>

      {/* Blood Work */}
      <motion.div variants={fadeUp}>
        <GlassCard
          className="p-3.5"
          glowColor={blood.overdue ? '#dc2626' : undefined}
        >
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold font-mono text-zinc-200">🧬 NEXT BLOOD WORK</span>
            <Badge
              text={blood.overdue ? '⚠ OVERDUE' : `${blood.weeksUntil} sem`}
              color={blood.overdue ? '#dc2626' : '#c9a227'}
            />
          </div>
          <div className="text-[10px] text-zinc-400 mt-1.5">{blood.next.label}</div>
          <div className="text-[8px] text-zinc-600 font-mono mt-1">PEDIR: {blood.next.markers}</div>
        </GlassCard>
      </motion.div>

      {/* Performance Prediction */}
      {predictions.weightTrend && (
        <motion.div variants={fadeUp}>
          <GlassCard className="p-3.5">
            <div className="text-[8px] text-zinc-500 font-mono tracking-wider mb-1.5">PREDICCIÓN</div>
            <div className="text-[11px] text-zinc-200">
              Peso actual: <strong>{predictions.weightTrend.current.toFixed(1)}kg</strong> · Cambio semanal:{' '}
              <strong style={{ color: predictions.weightTrend.weeklyChange > 0 ? '#16a34a' : '#dc2626' }}>
                {predictions.weightTrend.weeklyChange > 0 ? '+' : ''}
                {predictions.weightTrend.weeklyChange.toFixed(2)}kg
              </strong>
            </div>
            <div className="text-[11px] font-mono mt-1" style={{ color: '#c9a227' }}>
              → Proyección 4 sem: {predictions.weightTrend.projected4w}kg
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* AI BRIEFING */}
      <motion.div variants={fadeUp}>
        <Section title="BRIEFING IA" color="#c9a227" right="AUTO" />
        <GlassCard className="p-3.5" glowColor="#c9a22720">
          {briefingLoading ? (
            <div className="text-[11px] font-mono text-center py-4 animate-pulse" style={{ color: '#c9a227' }}>
              GENERANDO BRIEFING...
            </div>
          ) : briefing ? (
            <div className="text-[11px] text-zinc-200 leading-relaxed whitespace-pre-wrap">{briefing}</div>
          ) : (
            <div className="text-[10px] text-zinc-600 text-center py-4">
              Configura tu API key y registra datos para activar el briefing automático
            </div>
          )}
        </GlassCard>
      </motion.div>

      {/* Supplements */}
      <motion.div variants={fadeUp}>
        <Section title="STACK" right={`F${plan.phase}`} />
        <GlassCard className="overflow-hidden">
          {SUPPLEMENTS.filter(s => s.ph <= plan.phase).map((s, i) => {
            const checked = checks[`s-${i}`]
            return (
              <button
                key={i}
                onClick={() => toggle(`s-${i}`)}
                className="w-full px-3.5 py-2.5 flex justify-between items-center transition-colors"
                style={{
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  background: checked ? 'rgba(22,163,74,0.05)' : 'transparent',
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-4 h-4 rounded flex items-center justify-center transition-all"
                    style={{
                      border: checked ? '2px solid #16a34a' : '2px solid #333',
                      background: checked ? 'rgba(22,163,74,0.15)' : 'transparent',
                    }}
                  >
                    {checked && <span className="text-[8px] font-black text-green-500">✓</span>}
                  </div>
                  <span className={`text-[11px] ${checked ? 'text-zinc-500' : 'text-zinc-200'}`}>{s.n}</span>
                  <span className="text-[8px] text-zinc-600 font-mono">{s.d}</span>
                </div>
                <div className="flex gap-1">
                  <Badge text={s.ev} color={s.ev === 'A' ? '#16a34a' : s.ev === 'B' ? '#c9a227' : '#dc2626'} />
                  {s.tb && <Badge text="T" color="#c9a227" />}
                </div>
              </button>
            )
          })}
        </GlassCard>
      </motion.div>
    </motion.div>
  )
}
