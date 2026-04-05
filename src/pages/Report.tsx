import { useState } from 'react'
import { motion } from 'framer-motion'
import type { HealthScoreBreakdown } from '../engines/healthScore'
import type { Insight, WeeklyReport as WeeklyReportData } from '../engines/digitalTwin'
import type { UserProfile } from '../lib/profile'
import type { HealthData } from '../lib/types'
import type { Plan } from '../lib/types'
import { Ring } from '../components/ui/Ring'
import { callClaude, hasApiKey } from '../lib/api'
import { buildWeeklyReportPrompt } from '../engines/digitalTwin'
import { Share2, ChevronLeft, TrendingUp, TrendingDown, Minus, Brain, Check, Loader2 } from 'lucide-react'

interface ReportProps {
  onClose: () => void
  healthScore: HealthScoreBreakdown
  report: WeeklyReportData
  insights: Insight[]
  profile: UserProfile | null
  hd: HealthData
  plan: Plan
}

const CATEGORIES: { key: keyof Pick<HealthScoreBreakdown, 'composition' | 'cardiovascular' | 'sleep' | 'recovery' | 'activity' | 'nutrition' | 'consistency'>; label: string; color: string }[] = [
  { key: 'composition', label: 'Composicion', color: '#22c55e' },
  { key: 'cardiovascular', label: 'Cardiovascular', color: '#ff375f' },
  { key: 'sleep', label: 'Sueno', color: '#bf5af2' },
  { key: 'recovery', label: 'Recovery', color: '#30d158' },
  { key: 'activity', label: 'Actividad', color: '#4ade80' },
  { key: 'nutrition', label: 'Nutricion', color: '#4ade80' },
  { key: 'consistency', label: 'Consistencia', color: '#64d2ff' },
]

const INSIGHT_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  warning:  { bg: 'bg-red-500/8',    border: 'border-red-500/20',    text: 'text-red-400',    dot: 'bg-red-500' },
  positive: { bg: 'bg-green-500/8',   border: 'border-green-500/20',  text: 'text-green-400',  dot: 'bg-green-500' },
  action:   { bg: 'bg-yellow-500/8',  border: 'border-yellow-500/20', text: 'text-yellow-400', dot: 'bg-yellow-500' },
  info:     { bg: 'bg-blue-500/8',    border: 'border-blue-500/20',   text: 'text-blue-400',   dot: 'bg-blue-500' },
}

function scoreColor(score: number): string {
  if (score > 600) return '#30d158'
  if (score > 400) return '#4ade80'
  return '#ff375f'
}

function barColor(value: number): string {
  if (value >= 75) return '#30d158'
  if (value >= 50) return '#4ade80'
  if (value >= 25) return '#22c55e'
  return '#ff375f'
}

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  if (trend === 'up') return <TrendingUp size={14} className="text-green-400" />
  if (trend === 'down') return <TrendingDown size={14} className="text-red-400" />
  return <Minus size={14} className="text-zinc-500" />
}

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
}

export default function Report({ onClose, healthScore, report, insights, profile, hd: _hd, plan: _plan }: ReportProps) {
  const [aiReport, setAiReport] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const heroColor = scoreColor(healthScore.total)

  const generateAIReport = async () => {
    if (!hasApiKey()) return
    setAiLoading(true)
    try {
      const prompt = buildWeeklyReportPrompt(report, profile, healthScore, insights)
      const result = await callClaude(
        [{ role: 'user', content: prompt }],
        'Eres un medico deportivo y nutricionista experto. Genera informes de salud profesionales, detallados y accionables.',
        1500
      )
      setAiReport(result)
    } catch {
      setAiReport('Error generando analisis.')
    }
    setAiLoading(false)
  }

  const shareReport = async () => {
    const text = `INFORME SEMANAL -- Protocolo Superman
Semana ${report.weekNumber} -- ${report.dateRange}

HEALTH SCORE: ${healthScore.total}/900

Composicion: ${healthScore.composition}/100
Cardiovascular: ${healthScore.cardiovascular}/100
Sueno: ${healthScore.sleep}/100
Recovery: ${healthScore.recovery}/100
Actividad: ${healthScore.activity}/100
Nutricion: ${healthScore.nutrition}/100
Consistencia: ${healthScore.consistency}/100
${healthScore.metabolicAge ? `Edad metabolica: ${healthScore.metabolicAge} anos` : ''}

${report.summary.join('\n')}

${insights.map(i => `[${i.type.toUpperCase()}] ${i.title}`).join('\n')}
${aiReport || ''}
`

    try {
      if (navigator.share) {
        await navigator.share({ title: 'Informe Semanal', text })
      } else {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch {
      // User cancelled share or clipboard failed
      try {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch {
        // Silently fail
      }
    }
  }

  return (
    <div className="min-h-screen text-white pb-12">
      {/* ── Header ── */}
      <motion.div
        className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-[#4ade80] text-[15px] font-medium active:opacity-60 transition-opacity"
          >
            <ChevronLeft size={20} />
            <span>Volver</span>
          </button>
          <h1 className="text-[17px] font-semibold">Informe Semanal</h1>
          <button
            onClick={shareReport}
            className="p-2 rounded-full hover:bg-white/5 active:bg-white/10 transition-colors"
          >
            {copied ? <Check size={20} className="text-green-400" /> : <Share2 size={20} className="text-[#4ade80]" />}
          </button>
        </div>
      </motion.div>

      <div className="max-w-lg mx-auto px-4 space-y-4 mt-4">
        {/* ── Health Score Hero ── */}
        <motion.div
          className="glass-card p-8 flex flex-col items-center"
          {...fadeUp}
        >
          <Ring pct={(healthScore.total / 900) * 100} size={180} strokeWidth={10} color={heroColor}>
            <div className="flex flex-col items-center">
              <motion.span
                className="text-[56px] font-bold leading-none tabular-nums"
                style={{ color: heroColor }}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
              >
                {healthScore.total}
              </motion.span>
              <span className="text-[13px] text-zinc-500 mt-1">/ 900</span>
            </div>
          </Ring>

          <p className="text-zinc-400 text-[14px] mt-4">
            Semana {report.weekNumber} &middot; {report.dateRange}
          </p>

          {/* Delta vs previous week */}
          {report.healthScoreDelta !== 0 && (
            <div className="flex items-center gap-1.5 mt-2">
              {report.healthScoreDelta > 0 ? (
                <TrendingUp size={16} className="text-green-400" />
              ) : (
                <TrendingDown size={16} className="text-red-400" />
              )}
              <span className={`text-[14px] font-medium ${report.healthScoreDelta > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {report.healthScoreDelta > 0 ? '+' : ''}{report.healthScoreDelta} vs semana anterior
              </span>
            </div>
          )}
        </motion.div>

        {/* ── Score Breakdown ── */}
        <motion.div
          className="glass-card p-5"
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.1 }}
        >
          <h2 className="text-[15px] font-semibold text-zinc-300 mb-4">Desglose</h2>
          <div className="space-y-3">
            {CATEGORIES.map(({ key, label }) => {
              const value = healthScore[key] as number
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[13px] text-zinc-400">{label}</span>
                    <span className="text-[13px] font-semibold tabular-nums" style={{ color: barColor(value) }}>
                      {value}<span className="text-zinc-600">/100</span>
                    </span>
                  </div>
                  <div className="h-[6px] bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: barColor(value) }}
                      initial={{ width: 0 }}
                      animate={{ width: `${value}%` }}
                      transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* ── Metabolic Age ── */}
        {healthScore.metabolicAge !== null && profile && (
          <motion.div
            className="glass-card p-5"
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.15 }}
          >
            <h2 className="text-[15px] font-semibold text-zinc-300 mb-3">Edad Metabolica</h2>
            <div className="flex items-end gap-6">
              <div>
                <span
                  className="text-[40px] font-bold leading-none tabular-nums"
                  style={{ color: healthScore.metabolicAge! <= profile.age ? '#30d158' : '#ff375f' }}
                >
                  {healthScore.metabolicAge}
                </span>
                <span className="text-[15px] text-zinc-500 ml-1">anos</span>
              </div>
              <div className="pb-2">
                <span className="text-[13px] text-zinc-500">vs edad real </span>
                <span className="text-[15px] font-semibold text-zinc-300">{profile.age} anos</span>
              </div>
              {healthScore.metabolicAge! < profile.age && (
                <div className="pb-2 ml-auto">
                  <span className="text-[13px] font-medium text-green-400">
                    -{profile.age - healthScore.metabolicAge!} anos
                  </span>
                </div>
              )}
              {healthScore.metabolicAge! > profile.age && (
                <div className="pb-2 ml-auto">
                  <span className="text-[13px] font-medium text-red-400">
                    +{healthScore.metabolicAge! - profile.age} anos
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Body Composition ── */}
        {report.bodyComposition.length > 0 && (
          <motion.div
            className="glass-card p-5"
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.2 }}
          >
            <h2 className="text-[15px] font-semibold text-zinc-300 mb-3">Composicion Corporal</h2>
            <div className="space-y-3">
              {report.bodyComposition.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                >
                  <span className="text-[14px] text-zinc-400">{item.metric}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-semibold text-white tabular-nums">{item.value}</span>
                    <TrendIcon trend={item.trend} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Weekly Summary ── */}
        {report.summary.length > 0 && (
          <motion.div
            className="glass-card p-5"
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.25 }}
          >
            <h2 className="text-[15px] font-semibold text-zinc-300 mb-3">Resumen</h2>
            <ul className="space-y-2">
              {report.summary.map((line, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] mt-1.5 shrink-0" />
                  <span className="text-[14px] text-zinc-300 leading-relaxed">{line}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* ── Insights ── */}
        {insights.length > 0 && (
          <motion.div
            className="glass-card p-5"
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.3 }}
          >
            <h2 className="text-[15px] font-semibold text-zinc-300 mb-3">Insights</h2>
            <div className="space-y-2.5">
              {insights.map((insight, idx) => {
                const colors = INSIGHT_COLORS[insight.type] || INSIGHT_COLORS.info
                return (
                  <motion.div
                    key={insight.id || idx}
                    className={`${colors.bg} border ${colors.border} rounded-xl p-3.5`}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + idx * 0.05, duration: 0.3 }}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className={`w-2 h-2 rounded-full ${colors.dot} mt-1.5 shrink-0`} />
                      <div className="min-w-0">
                        <p className={`text-[14px] font-semibold ${colors.text}`}>{insight.title}</p>
                        <p className="text-[13px] text-zinc-400 mt-1 leading-relaxed">{insight.body}</p>
                        {insight.metric && (
                          <p className="text-[12px] text-zinc-500 mt-1.5 font-mono">{insight.metric}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* ── AI Analysis ── */}
        <motion.div
          className="glass-card p-5"
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.35 }}
        >
          <h2 className="text-[15px] font-semibold text-zinc-300 mb-3 flex items-center gap-2">
            <Brain size={16} className="text-[#bf5af2]" />
            Analisis con IA
          </h2>

          {!aiReport && !aiLoading && (
            <button
              onClick={generateAIReport}
              disabled={!hasApiKey()}
              className={`w-full py-3 rounded-xl text-[14px] font-semibold transition-all ${
                hasApiKey()
                  ? 'bg-[#bf5af2]/15 text-[#bf5af2] border border-[#bf5af2]/30 hover:bg-[#bf5af2]/25 active:scale-[0.98]'
                  : 'bg-white/5 text-zinc-600 cursor-not-allowed'
              }`}
            >
              {hasApiKey() ? 'Generar analisis con IA' : 'Configura tu API key en Ajustes'}
            </button>
          )}

          {aiLoading && (
            <div className="flex items-center justify-center gap-3 py-6">
              <Loader2 size={20} className="text-[#bf5af2] animate-spin" />
              <span className="text-[14px] text-zinc-400">Generando informe...</span>
            </div>
          )}

          {aiReport && !aiLoading && (
            <motion.div
              className="bg-black/40 rounded-xl p-4 border border-[#bf5af2]/20"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-[14px] text-zinc-300 leading-relaxed whitespace-pre-wrap">
                {aiReport}
              </div>
              <button
                onClick={generateAIReport}
                className="mt-3 text-[13px] text-[#bf5af2] font-medium hover:underline"
              >
                Regenerar
              </button>
            </motion.div>
          )}
        </motion.div>

        {/* ── Export / Share Footer ── */}
        <motion.div
          className="pt-2 pb-4"
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.4 }}
        >
          <button
            onClick={shareReport}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-[#4ade80] rounded-2xl text-[15px] font-semibold text-white active:scale-[0.98] transition-transform"
          >
            {copied ? (
              <>
                <Check size={18} />
                Copiado al portapapeles
              </>
            ) : (
              <>
                <Share2 size={18} />
                Compartir informe
              </>
            )}
          </button>
        </motion.div>
      </div>
    </div>
  )
}
