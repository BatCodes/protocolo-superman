import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Plan, WorkoutLog, DecisionResult } from '../lib/types'
import { WORKOUTS, SPLITS, DAY_LABELS } from '../lib/constants'
import { save } from '../lib/storage'
import { GlassCard } from '../components/ui/GlassCard'
import { Badge } from '../components/ui/Badge'

interface CombatProps {
  plan: Plan
  wkLog: WorkoutLog
  setWkLog: React.Dispatch<React.SetStateAction<WorkoutLog>>
  decision: DecisionResult
}

const TODAY = new Date().toISOString().slice(0, 10)

export function Combat({ plan, wkLog, setWkLog, decision }: CombatProps) {
  const [selectedDay, setSelectedDay] = useState(plan.dayIdx)
  const [inputs, setInputs] = useState<Record<string, string>>({})

  const split = SPLITS[selectedDay]
  const exercises = WORKOUTS[split] || []

  const logSet = async (exerciseIdx: number, data: { w: number; r: number }) => {
    const key = `${TODAY}-${split}-${exerciseIdx}`
    const updated = { ...wkLog, [key]: [...(wkLog[key] || []), data] }
    setWkLog(updated)
    await save('wk-log', updated)
  }

  const showWarning = decision.mode !== 'NORMAL' && decision.mode !== 'PUSH'

  return (
    <div className="pb-28 space-y-3">
      {/* Decision Warning */}
      {showWarning && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard className="p-3.5" glowColor="#ea580c">
            <div className="text-[10px] font-bold font-mono" style={{ color: '#ea580c' }}>
              {decision.action}
            </div>
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {decision.mods.map((m, i) => (
                <span
                  key={i}
                  className="text-[9px] font-mono px-2 py-0.5 rounded"
                  style={{ background: '#ea580c15', color: '#ea580c' }}
                >
                  {m}
                </span>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Day Selector */}
      <div className="grid grid-cols-7 gap-1.5">
        {DAY_LABELS.map((d, i) => (
          <button
            key={i}
            onClick={() => setSelectedDay(i)}
            className="py-2 text-center rounded-xl transition-all duration-200"
            style={{
              border: selectedDay === i ? '2px solid #c9a227' : '1px solid rgba(255,255,255,0.06)',
              background: selectedDay === i ? '#c9a22715' : '#0d0d0d80',
              color: selectedDay === i ? '#c9a227' : '#71717a',
            }}
          >
            <div className="text-[10px] font-black font-mono">{d}</div>
            <div className="text-[6px] font-mono mt-0.5">{SPLITS[i]}</div>
          </button>
        ))}
      </div>

      {/* REST Day */}
      {split === 'REST' ? (
        <GlassCard className="p-8 text-center">
          <div className="text-2xl mb-2">🔄</div>
          <div className="text-sm font-extrabold font-mono text-zinc-200">DESCANSO</div>
          <div className="text-[10px] text-zinc-500 mt-1">Recuperación activa. Movilidad. Caminar.</div>
        </GlassCard>
      ) : (
        /* Exercise Cards */
        <motion.div
          className="space-y-2"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.04 } } }}
        >
          {exercises.map((ex, i) => {
            const key = `${TODAY}-${split}-${i}`
            const sets = wkLog[key] || []

            return (
              <motion.div
                key={`${split}-${i}`}
                variants={{ hidden: { opacity: 0, x: -12 }, show: { opacity: 1, x: 0 } }}
              >
                <GlassCard className="p-3.5">
                  {/* Exercise header */}
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-bold text-zinc-200">{ex.n}</span>
                      {ex.t && (
                        <Badge text={ex.t} color={ex.t === 'T-DRIVER' ? '#c9a227' : '#dc2626'} />
                      )}
                    </div>
                    <span className="text-[11px] font-mono" style={{ color: '#c9a227' }}>
                      {ex.s}×{ex.r}
                    </span>
                  </div>

                  {/* Logged sets */}
                  {sets.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap mb-3">
                      {sets.map((s, si) => (
                        <motion.div
                          key={si}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-[9px] font-mono font-bold px-2.5 py-1 rounded-lg"
                          style={{
                            background: 'rgba(22,163,74,0.12)',
                            border: '1px solid rgba(22,163,74,0.25)',
                            color: '#16a34a',
                          }}
                        >
                          {s.w}kg × {s.r}
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
                      className="w-16 bg-[#111] border border-white/[0.06] text-zinc-200 px-2.5 py-2 text-[11px] font-mono rounded-lg outline-none focus:border-[#c9a227]/40 transition-colors"
                    />
                    <input
                      type="number"
                      placeholder="reps"
                      value={inputs[`${i}r`] || ''}
                      onChange={e => setInputs({ ...inputs, [`${i}r`]: e.target.value })}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          const w = parseFloat(inputs[`${i}w`])
                          const r = parseInt(inputs[`${i}r`])
                          if (!isNaN(w) && !isNaN(r)) {
                            logSet(i, { w, r })
                            setInputs({ ...inputs, [`${i}w`]: '', [`${i}r`]: '' })
                          }
                        }
                      }}
                      className="w-16 bg-[#111] border border-white/[0.06] text-zinc-200 px-2.5 py-2 text-[11px] font-mono rounded-lg outline-none focus:border-[#c9a227]/40 transition-colors"
                    />
                    <button
                      onClick={() => {
                        const w = parseFloat(inputs[`${i}w`])
                        const r = parseInt(inputs[`${i}r`])
                        if (!isNaN(w) && !isNaN(r)) {
                          logSet(i, { w, r })
                          setInputs({ ...inputs, [`${i}w`]: '', [`${i}r`]: '' })
                        }
                      }}
                      className="px-4 py-2 rounded-lg text-[10px] font-black font-mono transition-all active:scale-95"
                      style={{ background: '#c9a227', color: '#000' }}
                    >
                      + SET
                    </button>
                  </div>
                </GlassCard>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}
