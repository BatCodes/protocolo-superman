import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import type { Plan, ReadinessResult, DecisionResult, InjuryResult, ChatMessage } from '../lib/types'
import { AI_SYSTEM_PROMPT, QUICK_PROMPTS } from '../lib/constants'
import { callClaude, hasApiKey } from '../lib/api'
import { load, save } from '../lib/storage'
import { buildAIPrompt } from '../lib/profile'

interface IntelProps {
  plan: Plan
  readiness: ReadinessResult
  decision: DecisionResult
  injury: InjuryResult
  profile: import('../lib/profile').UserProfile | null
}

export function Intel({ plan, readiness, decision, injury, profile }: IntelProps) {
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

    const ctx = `\nSITREP: Dia ${plan.day}, Sem ${plan.week}, ${plan.phaseName}, ${plan.split}. Readiness: ${readiness.score}/100. ACWR: ${readiness.acwr?.toFixed(2) ?? 'N/A'}. Injury Risk: ${injury.risk}%. Decision: ${decision.mode}. Reasons: ${readiness.reasons.join('; ')}`
    const sysPrompt = profile ? buildAIPrompt(profile) : AI_SYSTEM_PROMPT

    try {
      const reply = await callClaude(
        updated.slice(-20).map(m => ({ role: m.role, content: m.content })),
        sysPrompt + ctx,
      )
      const final = [...updated, { role: 'assistant' as const, content: reply }]
      setMsgs(final)
      await save('chat-v5', final.slice(-40))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      setMsgs(prev => [...prev, { role: 'assistant', content: `⚠ ${msg}` }])
    }
    setLoading(false)
  }

  return (
    <div className="pb-28 flex flex-col" style={{ height: 'calc(100vh - 110px)' }}>
      {/* Empty state */}
      {msgs.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="text-3xl mb-3">🎖️</div>
          <div className="text-[15px] text-zinc-500 text-center mb-6 leading-relaxed">
            Intel con readiness, ACWR, riesgo de lesion,<br />y contexto total de tu protocolo.
          </div>

          {!hasApiKey() && (
            <div className="glass-card p-4 mb-5 w-full text-center">
              <div className="text-[13px] text-zinc-500">
                Configura tu API key en ajustes para usar Intel
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 w-full">
            {QUICK_PROMPTS.map((q, i) => (
              <button
                key={i}
                onClick={() => send(q)}
                className="press text-left text-[13px] text-zinc-400 glass-card p-3 rounded-xl active:scale-[0.97] transition-transform"
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
              className={`max-w-[88%] px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-[#4ade80]/10 text-white rounded-[20px] rounded-br-md'
                  : 'glass-card text-zinc-300 rounded-[20px] rounded-bl-md'
              }`}
            >
              {m.content}
            </div>
          </motion.div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="glass-card rounded-[20px] rounded-bl-md px-4 py-3">
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
          className="flex-1 glass-card text-white px-4 py-3 text-[15px] rounded-full outline-none"
        />
        <button
          onClick={() => send()}
          disabled={loading || !input.trim()}
          className="press px-5 py-3 rounded-full text-[15px] font-bold transition-all active:scale-95 disabled:opacity-30"
          style={{ background: 'linear-gradient(135deg, #4ade80, #22c55e)', color: '#000' }}
        >
          ↑
        </button>
      </div>
    </div>
  )
}
