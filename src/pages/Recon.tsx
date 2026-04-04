import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import type { HealthData, MedReport } from '../lib/types'
import { HEALTH_CATEGORIES, AI_SYSTEM_PROMPT } from '../lib/constants'
import { callClaude, fileToBase64, hasApiKey } from '../lib/api'
import { save } from '../lib/storage'
import { GlassCard } from '../components/ui/GlassCard'
import { MetricCard } from '../components/ui/MetricCard'
import { Section } from '../components/ui/Section'

interface ReconProps {
  hd: HealthData
  setHd: React.Dispatch<React.SetStateAction<HealthData>>
  medReports: MedReport[]
  setMedReports: React.Dispatch<React.SetStateAction<MedReport[]>>
}

const TODAY = new Date().toISOString().slice(0, 10)

export function Recon({ hd, setHd, medReports, setMedReports }: ReconProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfResult, setPdfResult] = useState<string | null>(null)
  const pdfRef = useRef<HTMLInputElement>(null)

  const logMetric = async (id: string) => {
    const v = parseFloat(inputValue)
    if (isNaN(v)) return

    const updated = { ...hd }
    if (!updated[id]) updated[id] = []
    updated[id] = [...updated[id], { d: TODAY, v }]
    setHd(updated)
    await save('health-data', updated)
    setEditingId(null)
    setInputValue('')
  }

  const handlePDF = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !hasApiKey()) return
    setPdfLoading(true)
    setPdfResult(null)

    const b64 = await fileToBase64(file)
    try {
      const text = await callClaude(
        [{
          role: 'user',
          content: [
            { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: b64 } },
            { type: 'text', text: 'Analiza analítica. Rangos ÓPTIMOS deportivos. Briefing militar.' },
          ] as any,
        }],
        AI_SYSTEM_PROMPT,
      )
      setPdfResult(text)
      const updatedReports = [...medReports, { date: TODAY, filename: file.name, analysis: text }]
      setMedReports(updatedReports)
      await save('med-reports', updatedReports)
    } catch {
      setPdfResult('⚠ Error analizando PDF. Verifica tu API key.')
    }
    setPdfLoading(false)
  }

  const filledCount = Object.keys(hd).filter(k => (hd[k] || []).length > 0).length

  return (
    <div className="pb-28 space-y-3">
      {/* Health source indicator */}
      <GlassCard className="p-3.5 flex justify-between items-center">
        <div>
          <div className="text-[12px] font-bold text-zinc-200">Métricas de Salud</div>
          <div className="text-[9px] text-zinc-500">Entrada manual · {filledCount}/{HEALTH_CATEGORIES.length} activas</div>
        </div>
        <div
          className="px-2.5 py-1 rounded-lg text-[8px] font-black font-mono"
          style={{ background: 'rgba(22,163,74,0.15)', color: '#16a34a' }}
        >
          MANUAL
        </div>
      </GlassCard>

      {/* Metrics grid */}
      <Section title="MÉTRICAS" right={`${filledCount}/${HEALTH_CATEGORIES.length}`} />
      <div className="grid grid-cols-2 gap-2">
        {HEALTH_CATEGORIES.map(m => {
          const entries = hd[m.id] || []
          const lastValue = entries.length > 0 ? entries[entries.length - 1].v : null
          const trend = entries.slice(-14).map(e => e.v)
          const isEditing = editingId === m.id

          return (
            <div key={m.id}>
              <MetricCard
                label={m.l}
                value={lastValue}
                unit={m.u}
                color={m.c}
                trend={trend}
                isEditing={isEditing}
                onToggleEdit={() => {
                  setEditingId(isEditing ? null : m.id)
                  setInputValue(lastValue ? String(lastValue) : '')
                }}
              />
              {isEditing && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex gap-1.5 mt-1"
                >
                  <input
                    type="number"
                    step="any"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && logMetric(m.id)}
                    placeholder={m.u}
                    className="flex-1 bg-[#0d0d0d] border border-white/10 text-zinc-200 px-2.5 py-2 text-[11px] font-mono rounded-lg outline-none"
                    style={{ borderColor: m.c + '40' }}
                  />
                  <button
                    onClick={() => logMetric(m.id)}
                    className="px-3.5 py-2 rounded-lg text-[9px] font-black font-mono"
                    style={{ background: m.c, color: '#000' }}
                  >
                    LOG
                  </button>
                </motion.div>
              )}
            </div>
          )
        })}
      </div>

      {/* Blood work PDF analyzer */}
      <Section title="LABORATORIO" color="#dc2626" />
      <input ref={pdfRef} type="file" accept="application/pdf" onChange={handlePDF} className="hidden" />

      <GlassCard
        className="p-4 text-center"
        glowColor="#dc2626"
        onClick={() => pdfRef.current?.click()}
      >
        <div className="text-[11px] font-bold font-mono" style={{ color: '#dc2626' }}>
          {pdfLoading ? 'ANALIZANDO...' : '🧬 SUBIR ANALÍTICA PDF'}
        </div>
        {pdfLoading && (
          <div className="text-[9px] text-zinc-500 mt-1 animate-pulse">
            Procesando con IA...
          </div>
        )}
      </GlassCard>

      {pdfResult && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <GlassCard className="p-3.5" glowColor="#dc262620">
            <div className="text-[11px] text-zinc-200 leading-relaxed whitespace-pre-wrap">{pdfResult}</div>
          </GlassCard>
        </motion.div>
      )}

      {/* Previous reports */}
      {medReports.length > 0 && (
        <>
          <Section title="HISTORIAL" color="#dc2626" right={`${medReports.length} reportes`} />
          {medReports.slice(-3).reverse().map((r, i) => (
            <GlassCard key={i} className="p-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-zinc-400 font-mono">{r.date}</span>
                <span className="text-[9px] text-zinc-600 font-mono">{r.filename}</span>
              </div>
            </GlassCard>
          ))}
        </>
      )}
    </div>
  )
}
