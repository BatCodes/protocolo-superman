import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Plan, WorkoutLog, DecisionResult } from '../lib/types'
import { WORKOUTS, SPLITS, DAY_LABELS } from '../lib/constants'
import { save } from '../lib/storage'
import { getExerciseHistory, getProgressionSuggestion, getWarmupSets } from '../lib/exercises'
import { getGuide } from '../lib/exerciseGuide'
import { MuscleMap } from '../components/ui/MuscleMap'
import { ExerciseAnimation } from '../components/ui/ExerciseAnimation'
import { PlateCalculator } from '../components/ui/PlateCalculator'
import { callClaude, hasApiKey } from '../lib/api'
import { Info } from 'lucide-react'

interface CombatProps {
  plan: Plan
  wkLog: WorkoutLog
  setWkLog: React.Dispatch<React.SetStateAction<WorkoutLog>>
  decision: DecisionResult
}

const EXERCISE_VIDEOS: Record<string, string> = {
  'Bench Press': 'rT7DgCr-3pg',
  'OHP': 'QAQ64hK4Xxs',
  'Incline DB Press': '8iPEnn-ltC8',
  'Weighted Dips': '2z8JmcrW-As',
  'Lateral Raise': '3VcKaXpzqRo',
  'Tricep Ext': '2-LAMcpzODU',
  'Chest Fly': 'eozdVDA78K0',
  'Deadlift': 'op9kVnSso6Q',
  'Barbell Row': 'FWJR5Ve8bnQ',
  'Weighted Pull-ups': 'eGo4IYlbE5g',
  'Face Pulls': 'rep-qVOkqgk',
  'Heavy Shrugs': 'cJRVVxmYR8w',
  'BB Curl': 'kwG2ipFRgFo',
  'Hammer Curl': 'zC3nLlEvin4',
  'Back Squat': 'bEv6CCg2BC8',
  'RDL': 'jEy_czb3RKA',
  'Leg Press': 'IZxyjW7MPJQ',
  'Lunges': 'D7KaRcUTQeE',
  'Leg Curl': '1Tq3QdYUuHs',
  'Calf Raise': '-M4-G8p8fmc',
  'Hanging Leg Raise': 'hdng3Nm1x_E',
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function Combat({ plan, wkLog, setWkLog, decision }: CombatProps) {
  const TODAY = new Date().toLocaleDateString('sv')
  const [selectedDay, setSelectedDay] = useState(Math.max(0, Math.min(6, plan.dayIdx)))
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [restTimer, setRestTimer] = useState(0)
  const [restTotal, setRestTotal] = useState(0)
  const [sessionElapsed, setSessionElapsed] = useState(0)
  const [expandedWarmups, setExpandedWarmups] = useState<Record<number, boolean>>({})
  const [openGuide, setOpenGuide] = useState<number | null>(null)
  const [combatBriefing, setCombatBriefing] = useState<string | null>(null)
  const [cbLoading, setCbLoading] = useState(false)

  const sessionStartRef = useRef<number | null>(null)
  const sessionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const restIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const split = SPLITS[selectedDay]
  const exercises = WORKOUTS[split] || []

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (sessionIntervalRef.current) clearInterval(sessionIntervalRef.current)
      if (restIntervalRef.current) clearInterval(restIntervalRef.current)
    }
  }, [])

  // Rest timer countdown
  useEffect(() => {
    if (restTimer > 0 && !restIntervalRef.current) {
      restIntervalRef.current = setInterval(() => {
        setRestTimer(prev => {
          if (prev <= 1) {
            if (restIntervalRef.current) clearInterval(restIntervalRef.current)
            restIntervalRef.current = null
            try { navigator.vibrate?.([200, 100, 200, 100, 200]) } catch {}
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
  }, [restTimer])

  useEffect(() => {
    if (!hasApiKey() || combatBriefing || cbLoading) return
    setCbLoading(true)
    const todaySetsCount = Object.entries(wkLog).filter(([k]) => k.startsWith(TODAY)).reduce((sum, [, s]) => sum + s.length, 0)
    callClaude(
      [{ role: 'user', content: `BRIEFING DE ENTRENO. Split: ${split}. Decision engine: ${decision.mode} — ${decision.action}. Mods: ${decision.mods.join(', ')}. Sets completados hoy: ${todaySetsCount}. Dame 3-4 bullets de qué priorizar en esta sesión. Máximo 80 palabras.` }],
      'Eres un coach de fuerza élite. Briefing pre-sesión ultra-conciso.',
      300
    ).then(t => { setCombatBriefing(t); setCbLoading(false) })
      .catch(() => setCbLoading(false))
  }, [split, decision.mode]) // only re-run when split or decision changes

  const startRestTimer = useCallback((isCompound: boolean) => {
    if (restIntervalRef.current) {
      clearInterval(restIntervalRef.current)
      restIntervalRef.current = null
    }
    const duration = isCompound ? 90 : 60
    setRestTotal(duration)
    setRestTimer(duration)
  }, [])

  const skipRest = useCallback(() => {
    if (restIntervalRef.current) {
      clearInterval(restIntervalRef.current)
      restIntervalRef.current = null
    }
    setRestTimer(0)
  }, [])

  const logSet = async (exerciseIdx: number, data: { w: number; r: number }, isCompound: boolean) => {
    // Start session timer on first set
    if (!sessionStartRef.current) {
      sessionStartRef.current = Date.now()
      sessionIntervalRef.current = setInterval(() => {
        setSessionElapsed(Date.now() - (sessionStartRef.current || Date.now()))
      }, 1000)
    }

    const key = `${TODAY}-${split}-${exerciseIdx}`
    const updated = { ...wkLog, [key]: [...(wkLog[key] || []), data] }
    setWkLog(updated)
    await save('wk-log', updated)

    // Start rest timer
    startRestTimer(isCompound)
  }

  const showWarning = decision.mode !== 'NORMAL' && decision.mode !== 'PUSH'

  const restProgress = restTotal > 0 ? restTimer / restTotal : 0

  return (
    <div className="pb-28 space-y-4">
      {/* Session Duration */}
      {sessionStartRef.current && (
        <div className="flex items-center justify-center gap-2 py-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[13px] mono text-zinc-400">Sesion activa</span>
          <span className="text-[15px] mono font-bold text-white">{formatDuration(sessionElapsed)}</span>
        </div>
      )}

      {/* AI Combat Briefing */}
      {(combatBriefing || cbLoading) && (
        <div className="glass-card p-4 mb-4">
          <div className="text-[13px] text-zinc-500 mb-2">IA · Briefing de Sesión</div>
          {cbLoading ? (
            <div className="text-[13px] text-zinc-600 animate-pulse">Generando briefing...</div>
          ) : (
            <div className="text-[14px] text-zinc-300 leading-relaxed whitespace-pre-wrap">{combatBriefing}</div>
          )}
        </div>
      )}

      {/* Decision Warning */}
      {showWarning && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="glass-card p-4">
            <div className="text-[13px] font-semibold" style={{ color: '#22c55e' }}>
              {decision.action}
            </div>
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {decision.mods.map((m, i) => (
                <span
                  key={i}
                  className="text-[11px] mono px-2.5 py-1 rounded-lg"
                  style={{ background: 'rgba(74,222,128,0.12)', color: '#4ade80' }}
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Day Selector */}
      <div className="grid grid-cols-7 gap-1.5">
        {DAY_LABELS.map((d, i) => (
          <button
            key={i}
            onClick={() => setSelectedDay(Math.max(0, Math.min(6, i)))}
            className="press py-2 text-center rounded-xl transition-all duration-200"
            style={{
              background: selectedDay === i ? '#4ade80' : '#1c1c1e',
              color: selectedDay === i ? '#000' : '#8e8e93',
            }}
          >
            <div className="text-[10px] font-bold mono">{d}</div>
            <div className="text-[7px] mono mt-0.5" style={{ opacity: 0.7 }}>{SPLITS[i]}</div>
          </button>
        ))}
      </div>

      {/* REST Day */}
      {split === 'REST' ? (
        <div className="glass-card p-8 text-center">
          <div className="text-2xl mb-2">🔄</div>
          <div className="text-[15px] font-semibold text-white">Descanso</div>
          <div className="text-[13px] text-zinc-500 mt-1">Recuperacion activa. Movilidad. Caminar.</div>
        </div>
      ) : (
        /* Exercise Cards */
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.04 } } }}
        >
          <p className="text-[13px] font-semibold text-zinc-400 uppercase tracking-wider px-4 mb-2">
            {split}
          </p>
          <div className="glass-card overflow-hidden">
            {exercises.map((ex, i) => {
              const key = `${TODAY}-${split}-${i}`
              const sets = wkLog[key] || []
              const isLast = i === exercises.length - 1
              const isCompound = ex.t === 'T-DRIVER'

              // Exercise history
              const history = getExerciseHistory(wkLog, split, i)
              const lastSession = history.length > 0 ? history[history.length - 1] : null
              const lastSessionText = lastSession
                ? lastSession.sets.map(s => `${s.w}kg×${s.r}`).join(', ')
                : null

              // Progressive overload suggestion
              const suggestion = getProgressionSuggestion(history)

              // Warm-up sets for compounds
              const lastWeight = lastSession
                ? Math.max(...lastSession.sets.map(s => s.w))
                : 0
              const warmupSets = isCompound && lastWeight > 0
                ? getWarmupSets(lastWeight, [40, 60, 80])
                : []

              const guide = getGuide(ex.n)

              return (
                <motion.div
                  key={`${split}-${i}`}
                  variants={{ hidden: { opacity: 0, x: -12 }, show: { opacity: 1, x: 0 } }}
                  className="px-4 py-3"
                  style={!isLast ? { borderBottom: '0.5px solid rgba(255,255,255,0.06)' } : undefined}
                >
                  {/* Exercise header */}
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-semibold text-white">{ex.n}</span>
                      {ex.t && (
                        <span
                          className="text-[10px] mono px-2 py-0.5 rounded-md"
                          style={{
                            background: ex.t === 'T-DRIVER' ? 'rgba(74,222,128,0.15)' : 'rgba(255,69,58,0.15)',
                            color: ex.t === 'T-DRIVER' ? '#4ade80' : '#ff453a',
                          }}
                        >
                          {ex.t}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); setOpenGuide(openGuide === i ? null : i) }}
                        className="press w-7 h-7 rounded-full flex items-center justify-center"
                        style={{ background: openGuide === i ? '#4ade8020' : 'rgba(255,255,255,0.06)' }}
                      >
                        <Info size={14} color={openGuide === i ? '#4ade80' : '#636366'} />
                      </button>
                      {/* Set counter */}
                      <span className="text-[12px] mono font-medium" style={{ color: sets.length >= ex.s ? '#30d158' : '#8e8e93' }}>
                        {sets.length}/{ex.s} series
                      </span>
                      <span className="text-[13px] mono" style={{ color: '#4ade80' }}>
                        {ex.s}x{ex.r}
                      </span>
                    </div>
                  </div>

                  {/* Exercise Guide (expandable) */}
                  <AnimatePresence>
                    {openGuide === i && guide && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-3 pb-1" style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
                          {/* Animated exercise demo */}
                          <ExerciseAnimation exercise={ex.n} size={100} />

                          {/* Muscle Map */}
                          <div className="flex justify-center mb-3">
                            <MuscleMap muscleIds={guide.muscleIds} color="#30d158" size={100} />
                          </div>

                          {/* Video tutorial */}
                          {EXERCISE_VIDEOS[ex.n] && (
                            <div className="mt-3 rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
                              <iframe
                                src={`https://www.youtube.com/embed/${EXERCISE_VIDEOS[ex.n]}?rel=0&modestbranding=1`}
                                title={`Cómo hacer ${ex.n}`}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="w-full h-full border-0"
                                loading="lazy"
                              />
                            </div>
                          )}

                          {/* Muscles */}
                          <div className="mb-3">
                            <div className="text-[11px] text-zinc-500 mb-1">Músculos principales</div>
                            <div className="flex gap-1.5 flex-wrap">
                              {guide.muscles.map((m, mi) => (
                                <span key={mi} className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: '#30d15820', color: '#30d158' }}>{m}</span>
                              ))}
                              {guide.secondary.map((m, mi) => (
                                <span key={mi} className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: '#8e8e93' }}>{m}</span>
                              ))}
                            </div>
                          </div>

                          {/* Steps */}
                          <div className="mb-3">
                            <div className="text-[11px] text-zinc-500 mb-1.5">Ejecución</div>
                            {guide.steps.map((step, si) => (
                              <div key={si} className="flex gap-2 mb-1.5">
                                <span className="text-[11px] mono w-4 flex-shrink-0" style={{ color: '#4ade80' }}>{si + 1}</span>
                                <span className="text-[13px] text-zinc-300 leading-snug">{step}</span>
                              </div>
                            ))}
                          </div>

                          {/* Tips */}
                          {guide.tips.length > 0 && (
                            <div className="mb-3">
                              <div className="text-[11px] text-zinc-500 mb-1">Consejos</div>
                              {guide.tips.map((tip, ti) => (
                                <div key={ti} className="flex gap-2 mb-1">
                                  <span className="text-[11px]" style={{ color: '#22c55e' }}>•</span>
                                  <span className="text-[13px] text-zinc-400 leading-snug">{tip}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Breathing */}
                          <div className="text-[13px] text-zinc-500">
                            <span style={{ color: '#64d2ff' }}>Respiración:</span> {guide.breathe}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Last session history */}
                  {lastSessionText && (
                    <div className="text-[11px] text-zinc-500 mb-1.5">
                      Ultima: <span className="mono">{lastSessionText}</span>
                    </div>
                  )}

                  {/* Progressive overload suggestion */}
                  {suggestion && (
                    <div className="mb-2">
                      <span
                        className="inline-block text-[11px] mono font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: 'rgba(74,222,128,0.15)', color: '#4ade80' }}
                      >
                        {suggestion.message}
                      </span>
                    </div>
                  )}

                  {/* Warm-up sets (collapsible) */}
                  {warmupSets.length > 0 && (
                    <div className="mb-2">
                      <button
                        onClick={() => setExpandedWarmups(prev => ({ ...prev, [i]: !prev[i] }))}
                        className="press text-[11px] font-medium text-zinc-500 flex items-center gap-1"
                      >
                        <span style={{ transform: expandedWarmups[i] ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', display: 'inline-block' }}>
                          ▶
                        </span>
                        Calentamiento ({warmupSets.length} series)
                      </button>
                      <AnimatePresence>
                        {expandedWarmups[i] && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="flex gap-1.5 flex-wrap mt-1.5">
                              {warmupSets.map((ws, wi) => (
                                <span
                                  key={wi}
                                  className="text-[10px] mono px-2 py-0.5 rounded-md"
                                  style={{ background: 'rgba(255,255,255,0.06)', color: '#8e8e93' }}
                                >
                                  {ws.w}kg × {ws.r}
                                </span>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Logged sets */}
                  {sets.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap mb-3">
                      {sets.map((s, si) => (
                        <motion.div
                          key={si}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-[11px] mono font-semibold px-2.5 py-1 rounded-lg"
                          style={{
                            background: 'rgba(48,209,88,0.12)',
                            color: '#30d158',
                          }}
                        >
                          {s.w}kg x {s.r}
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Input row */}
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="kg"
                      value={inputs[`${i}w`] || ''}
                      onChange={e => setInputs({ ...inputs, [`${i}w`]: e.target.value })}
                      className="w-16 bg-white/[0.04] text-white px-2.5 py-2 text-[13px] mono rounded-xl outline-none"
                    />
                    <input
                      type="number"
                      placeholder="reps"
                      value={inputs[`${i}r`] || ''}
                      onChange={e => setInputs({ ...inputs, [`${i}r`]: e.target.value })}
                      // inputs state is already updated by onChange before Enter fires, so reading from state here is safe
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          const w = parseFloat(inputs[`${i}w`])
                          const r = parseInt(inputs[`${i}r`])
                          if (!isNaN(w) && !isNaN(r)) {
                            logSet(i, { w, r }, isCompound)
                            setInputs({ ...inputs, [`${i}w`]: '', [`${i}r`]: '' })
                          }
                        }
                      }}
                      className="w-16 bg-white/[0.04] text-white px-2.5 py-2 text-[13px] mono rounded-xl outline-none"
                    />
                    <button
                      onClick={() => {
                        const w = parseFloat(inputs[`${i}w`])
                        const r = parseInt(inputs[`${i}r`])
                        if (!isNaN(w) && !isNaN(r)) {
                          logSet(i, { w, r }, isCompound)
                          setInputs({ ...inputs, [`${i}w`]: '', [`${i}r`]: '' })
                        }
                      }}
                      className="press px-4 py-2 rounded-2xl text-[12px] font-bold mono transition-all active:scale-95"
                      style={{ background: 'linear-gradient(135deg, #4ade80, #22c55e)', color: '#000' }}
                    >
                      + SET
                    </button>
                  </div>

                  {/* Plate Calculator for compound exercises */}
                  {ex.t === 'T-DRIVER' && sets.length > 0 && (
                    <div className="mt-3" style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
                      <div className="pt-3">
                        <PlateCalculator weight={sets[sets.length - 1].w} />
                      </div>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Rest Timer Overlay */}
      <AnimatePresence>
        {restTimer > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-20 left-4 right-4 z-40 glass-card p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              {/* Circular progress */}
              <div className="relative w-12 h-12">
                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                  <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                  <circle
                    cx="24" cy="24" r="20" fill="none"
                    stroke={restTimer <= 10 ? '#ff453a' : '#4ade80'}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 20}
                    strokeDashoffset={2 * Math.PI * 20 * (1 - restProgress)}
                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[11px] mono font-bold text-white">{restTimer}</span>
                </div>
              </div>
              <div>
                <div className="text-[13px] text-zinc-500">Descanso</div>
                <div className="text-[28px] font-black mono text-white leading-none">{formatTime(restTimer)}</div>
              </div>
            </div>
            <button onClick={skipRest} className="press px-4 py-2 rounded-xl text-[13px] font-semibold" style={{ background: '#4ade80', color: '#000' }}>
              Saltar
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
