import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import type { Plan, HealthData, WorkoutLog, ScannedMeal, ReadinessResult, DecisionResult, InjuryResult, ChatMessage } from '../lib/types'
import { AI_SYSTEM_PROMPT, QUICK_PROMPTS } from '../lib/constants'
import { callClaude, hasApiKey } from '../lib/api'
import { load, save } from '../lib/storage'
import { GlassCard } from '../components/ui/GlassCard'

interface IntelProps {
  plan: Plan
  hd: HealthData
  checks: Record<string, boolean>
  scannedMeals: ScannedMeal[]
  wkLog: WorkoutLog
  readiness: ReadinessResult
  decision: DecisionResult
  injury: InjuryResult
}

export function Intel({ plan, readiness, decision, injury }: IntelProps) {
  const [msgs, setMsgs] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    load<ChatMessage[]>('chat-v5', []).then(setMsgs)
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  const send = async (text?: string) => {
    const message = text || input.trim()
    if (!message || loading || !hasApiKey()) return

    const userMsg: ChatMessage = { role: 'user', content: message }
    const updated = [...msgs, userMsg]
    setMsgs(updated)
    setInput('')
    setLoading(true)

    const ctx = `\nSITREP: Día ${plan.day}, Sem ${plan.week}, ${plan.phaseName}, ${plan.split}. Readiness: ${readiness.score}/100. ACWR: ${readiness.acwr.toFixed(2)}. Injury Risk: ${injury.risk}%. Decision: ${decision.mode}. Reasons: ${readiness.reasons.join('; ')}`

    try {
      const reply = await callClaude(
        updated.slice(-20).map(m => ({ role: m.role, content: m.content })),
        AI_SYSTEM_PROMPT + ctx,
      )
      const final = [...updated, { role: 'assistant' as const, content: reply }]
      setMsgs(final)
      await save('chat-v5', final.slice(-40))
    } catch {
      setMsgs(prev => [...prev, { role: 'assistant', content: '⚠ Error de conexión. Verifica tu API key.' }])
    }
    setLoading(false)
  }

  return (
    <div className="pb-28 flex flex-col" style={{ height: 'calc(100vh - 110px)' }}>
      {/* Empty state */}
      {msgs.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="text-3xl mb-3">🎖️</div>
          <div className="text-[12px] text-zinc-500 text-center mb-4 leading-relaxed">
            Intel con readiness, ACWR, riesgo de lesión,<br />y contexto total de tu protocolo.
          </div>

          {!hasApiKey() && (
            <GlassCard className="p-3 mb-4 w-full text-center">
              <div className="text-[10px] text-zinc-500">
                Configura tu API key en ajustes para usar Intel
              </div>
            </GlassCard>
          )}

          <div className="grid grid-cols-2 gap-2 w-full">
            {QUICK_PROMPTS.map((q, i) => (
              <button
                key={i}
                onClick={() => { setInput(q); send(q) }}
                className="text-left text-[10px] text-zinc-500 bg-[#0d0d0d]/80 border border-white/[0.06] p-2.5 rounded-xl hover:border-white/10 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 px-1">
        {msgs.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[88%] px-3.5 py-2.5 text-[12px] leading-relaxed rounded-2xl whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-[#c9a227]/10 border border-[#c9a227]/20 text-zinc-200 rounded-br-md'
                  : 'bg-[#0d0d0d]/80 border border-white/[0.06] text-zinc-300 rounded-bl-md'
              }`}
            >
              {m.content}
            </div>
          </motion.div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#0d0d0d]/80 border border-white/[0.06] rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-zinc-500"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 mt-3 flex-shrink-0 px-1">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Reporta, consulta..."
          className="flex-1 bg-[#0d0d0d] border border-white/[0.06] text-zinc-200 px-4 py-3 text-[12px] rounded-xl outline-none focus:border-[#c9a227]/30 transition-colors"
        />
        <button
          onClick={() => send()}
          disabled={loading || !input.trim()}
          className="px-5 py-3 rounded-xl text-[12px] font-black font-mono transition-all active:scale-95 disabled:opacity-30"
          style={{ background: '#c9a227', color: '#000' }}
        >
          →
        </button>
      </div>
    </div>
  )
}
