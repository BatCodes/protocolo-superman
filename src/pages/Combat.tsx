import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Plan, WorkoutLog, DecisionResult } from '../lib/types'
import { WORKOUTS, SPLITS, DAY_LABELS } from '../lib/constants'
import { save } from '../lib/storage'

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
    <div className="pb-28 space-y-4">
      {/* Decision Warning */}
      {showWarning && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-[#1c1c1e] rounded-2xl p-4">
            <div className="text-[13px] font-semibold" style={{ color: '#ff9f0a' }}>
              {decision.action}
            </div>
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {decision.mods.map((m, i) => (
                <span
                  key={i}
                  className="text-[11px] mono px-2.5 py-1 rounded-lg"
                  style={{ background: 'rgba(255,159,10,0.12)', color: '#ff9f0a' }}
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
            onClick={() => setSelectedDay(i)}
            className="press py-2 text-center rounded-xl transition-all duration-200"
            style={{
              background: selectedDay === i ? '#ffd60a' : '#1c1c1e',
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
        <div className="bg-[#1c1c1e] rounded-2xl p-8 text-center">
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
          <div className="bg-[#1c1c1e] rounded-2xl overflow-hidden">
            {exercises.map((ex, i) => {
              const key = `${TODAY}-${split}-${i}`
              const sets = wkLog[key] || []
              const isLast = i === exercises.length - 1

              return (
                <motion.div
                  key={`${split}-${i}`}
                  variants={{ hidden: { opacity: 0, x: -12 }, show: { opacity: 1, x: 0 } }}
                  className="px-4 py-3"
                  style={!isLast ? { borderBottom: '0.33px solid rgba(255,255,255,0.08)' } : undefined}
                >
                  {/* Exercise header */}
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-semibold text-white">{ex.n}</span>
                      {ex.t && (
                        <span
                          className="text-[10px] mono px-2 py-0.5 rounded-md"
                          style={{
                            background: ex.t === 'T-DRIVER' ? 'rgba(255,214,10,0.15)' : 'rgba(255,69,58,0.15)',
                            color: ex.t === 'T-DRIVER' ? '#ffd60a' : '#ff453a',
                          }}
                        >
                          {ex.t}
                        </span>
                      )}
                    </div>
                    <span className="text-[13px] mono" style={{ color: '#ffd60a' }}>
                      {ex.s}x{ex.r}
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
                      className="w-16 bg-[#2c2c2e] text-white px-2.5 py-2 text-[13px] mono rounded-xl outline-none"
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
                      className="w-16 bg-[#2c2c2e] text-white px-2.5 py-2 text-[13px] mono rounded-xl outline-none"
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
                      className="press px-4 py-2 rounded-2xl text-[12px] font-bold mono transition-all active:scale-95"
                      style={{ background: 'linear-gradient(135deg, #ffd60a, #ff9f0a)', color: '#000' }}
                    >
                      + SET
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )}
    </div>
  )
}
