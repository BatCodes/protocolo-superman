import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Chart } from '../components/ui/Chart'
import type { HealthData, MedReport } from '../lib/types'
import { HEALTH_CATEGORY_GROUPS, HEALTH_CATEGORIES, AI_SYSTEM_PROMPT } from '../lib/constants'
import { callClaude, fileToBase64, hasApiKey } from '../lib/api'
import { save } from '../lib/storage'

interface ReconProps {
  hd: HealthData
  setHd: React.Dispatch<React.SetStateAction<HealthData>>
  medReports: MedReport[]
  setMedReports: React.Dispatch<React.SetStateAction<MedReport[]>>
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const w = 48
  const h = 20
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * h
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={w} height={h} className="flex-shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Recon({ hd, setHd, medReports, setMedReports }: ReconProps) {
  const TODAY_LOCAL = new Date().toLocaleDateString('sv')
  const isMountedRef = useRef(true)

  useEffect(() => {
    return () => { isMountedRef.current = false }
  }, [])

  const [healthBriefing, setHealthBriefing] = useState<string | null>(null)
  const [hbLoading, setHbLoading] = useState(false)

  useEffect(() => {
    if (!hasApiKey() || healthBriefing) return
    setHbLoading(true)
    const filledMetrics = Object.keys(hd).filter(k => (hd[k] || []).length > 0)
    const lastWeight = (hd.weight || []).slice(-1)[0]?.v
    const lastSleep = (hd.sleep || []).slice(-1)[0]?.v
    const lastHRV = (hd.hrv || []).slice(-1)[0]?.v
    callClaude(
      [{ role: 'user', content: `BRIEFING DE SALUD. Métricas activas: ${filledMetrics.join(', ')}. Último peso: ${lastWeight || 'N/A'}kg. Último sueño: ${lastSleep || 'N/A'}h. Último HRV: ${lastHRV || 'N/A'}ms. Identifica qué métricas faltan por registrar y qué priorizar. 60 palabras máx.` }],
      'Eres un médico deportivo. Briefing ultra-conciso de métricas de salud.',
      250
    ).then(t => { if (isMountedRef.current) { setHealthBriefing(t); setHbLoading(false) } })
      .catch(() => { if (isMountedRef.current) setHbLoading(false) })
  }, [])

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
    const lastEntry = updated[id][updated[id].length - 1]
    if (lastEntry && lastEntry.d === TODAY_LOCAL) {
      updated[id] = [...updated[id].slice(0, -1), { d: TODAY_LOCAL, v }]
    } else {
      updated[id] = [...updated[id], { d: TODAY_LOCAL, v }]
    }
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
            { type: 'text', text: 'Analiza analitica. Rangos OPTIMOS deportivos. Briefing militar.' },
          ] as any,
        }],
        AI_SYSTEM_PROMPT,
      )
      if (!isMountedRef.current) return
      setPdfResult(text)
      const newReport = { date: TODAY_LOCAL, filename: file.name, analysis: text }
      const lastReport = medReports[medReports.length - 1]
      const updatedReports = lastReport && lastReport.date === TODAY_LOCAL
        ? [...medReports.slice(0, -1), newReport]
        : [...medReports, newReport]
      setMedReports(updatedReports)
      await save('med-reports', updatedReports)
    } catch {
      setPdfResult('Error analizando PDF. Verifica tu API key.')
    }
    setPdfLoading(false)
  }

  const filledCount = Object.keys(hd).filter(k => (hd[k] || []).length > 0).length
  const totalMetrics = HEALTH_CATEGORIES.length

  return (
    <div className="pb-28 space-y-4">
      {/* AI Health Briefing */}
      {(healthBriefing || hbLoading) && (
        <div className="glass-card p-4 mb-4">
          <div className="text-[13px] text-zinc-500 mb-2">IA · Análisis de Salud</div>
          {hbLoading ? (
            <div className="text-[13px] text-zinc-600 animate-pulse">Analizando métricas...</div>
          ) : (
            <div className="text-[14px] text-zinc-300 leading-relaxed whitespace-pre-wrap">{healthBriefing}</div>
          )}
        </div>
      )}

      {/* Health summary */}
      <div className="glass-card px-4 py-3 flex justify-between items-center">
        <div>
          <div className="text-[15px] font-semibold text-white">Metricas de Salud</div>
          <div className="text-[13px] text-zinc-500">Entrada manual · {filledCount}/{totalMetrics} activas</div>
        </div>
        <div
          className="px-3 py-1.5 rounded-xl text-[11px] font-semibold mono"
          style={{ background: 'rgba(48,209,88,0.15)', color: '#30d158' }}
        >
          MANUAL
        </div>
      </div>

      {/* Grouped metrics */}
      {HEALTH_CATEGORY_GROUPS.map((group) => (
        <div key={group.group}>
          {/* Group header */}
          <p className="text-[20px] font-bold text-white px-4 mb-2 mt-4">
            {group.group}
          </p>

          {/* iOS grouped list card */}
          <div className="glass-card overflow-hidden">
            {group.categories.map((m, idx) => {
              const entries = hd[m.id] || []
              const lastValue = entries.length > 0 ? entries[entries.length - 1].v : null
              const trend = entries.slice(-14).map(e => e.v)
              const isEditing = editingId === m.id
              const isLast = idx === group.categories.length - 1

              return (
                <div key={m.id}>
                  <div
                    className="press px-4 py-3 flex items-center justify-between"
                    style={!isLast || isEditing ? { borderBottom: '0.5px solid rgba(255,255,255,0.06)' } : undefined}
                    onClick={() => {
                      setEditingId(isEditing ? null : m.id)
                      setInputValue(lastValue ? String(lastValue) : '')
                    }}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: m.c }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-[15px] text-white">{m.l}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MiniSparkline data={trend} color={m.c} />
                      <div className="text-right">
                        {lastValue !== null ? (
                          <span className="text-[15px] mono" style={{ color: m.c }}>
                            {lastValue}<span className="text-[11px] text-zinc-500 ml-0.5">{m.u}</span>
                          </span>
                        ) : (
                          <span className="text-[13px] text-zinc-600">--</span>
                        )}
                      </div>
                      <span className="text-zinc-600 text-[13px]">{isEditing ? '▾' : '›'}</span>
                    </div>
                  </div>

                  {isEditing && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 py-3" style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
                        {/* Historical chart */}
                        {entries.length >= 2 && (
                          <div className="mb-3">
                            <Chart
                              data={entries.slice(-30).map(e => ({ date: e.d, value: e.v }))}
                              color={m.c}
                              height={100}
                              unit={m.u}
                            />
                            {/* Stats row */}
                            <div className="flex justify-between mt-2">
                              <div className="text-center">
                                <div className="text-[11px] text-zinc-600">Min</div>
                                <div className="text-[13px] mono text-zinc-400">
                                  {Math.min(...entries.slice(-30).map(e => e.v)).toFixed(1)}
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="text-[11px] text-zinc-600">Media</div>
                                <div className="text-[13px] mono text-zinc-400">
                                  {(entries.slice(-30).reduce((a, e) => a + e.v, 0) / entries.slice(-30).length).toFixed(1)}
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="text-[11px] text-zinc-600">Max</div>
                                <div className="text-[13px] mono text-zinc-400">
                                  {Math.max(...entries.slice(-30).map(e => e.v)).toFixed(1)}
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="text-[11px] text-zinc-600">Entradas</div>
                                <div className="text-[13px] mono text-zinc-400">{entries.length}</div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Input field */}
                        <div className="flex gap-2">
                          <input
                            type="number"
                            step="any"
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            autoFocus
                            onKeyDown={e => e.key === 'Enter' && logMetric(m.id)}
                            placeholder={m.u}
                            className="flex-1 bg-white/[0.04] text-white px-3 py-2.5 text-[15px] mono rounded-xl outline-none"
                          />
                          <button
                            onClick={() => logMetric(m.id)}
                            className="press px-5 py-2.5 rounded-2xl text-[13px] font-semibold mono"
                            style={{ background: m.c, color: '#000' }}
                          >
                            Log
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Blood work PDF analyzer */}
      <p className="text-[13px] font-semibold text-zinc-400 uppercase tracking-wider px-4 mb-2">
        Laboratorio
      </p>
      <input ref={pdfRef} type="file" accept="application/pdf" onChange={handlePDF} className="hidden" />

      <button
        className="press w-full glass-card p-4 text-center active:scale-[0.98] transition-transform"
        onClick={() => pdfRef.current?.click()}
      >
        <div className="text-[15px] font-semibold" style={{ color: '#ff453a' }}>
          {pdfLoading ? 'Analizando...' : 'Subir Analitica PDF'}
        </div>
        {pdfLoading && (
          <div className="text-[13px] text-zinc-500 mt-1 animate-pulse">
            Procesando con IA...
          </div>
        )}
      </button>

      {pdfResult && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="glass-card p-4">
            <div className="text-[14px] text-white leading-relaxed whitespace-pre-wrap">{pdfResult}</div>
          </div>
        </motion.div>
      )}

      {/* Previous reports */}
      {medReports.length > 0 && (
        <>
          <p className="text-[13px] font-semibold text-zinc-400 uppercase tracking-wider px-4 mb-2">
            Historial — {medReports.length} reportes
          </p>
          <div className="glass-card overflow-hidden">
            {medReports.slice(-3).reverse().map((r, i) => (
              <div
                key={r.date + r.filename}
                className="px-4 py-3 flex justify-between items-center"
                style={i < Math.min(medReports.length, 3) - 1 ? { borderBottom: '0.5px solid rgba(255,255,255,0.06)' } : undefined}
              >
                <span className="text-[15px] text-white mono">{r.date}</span>
                <span className="text-[13px] text-zinc-600">{r.filename}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
