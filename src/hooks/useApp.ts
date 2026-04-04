import { useState, useEffect, useCallback } from 'react'
import type { HealthData, WorkoutLog, ScannedMeal, MedReport, TabId } from '../lib/types'
import { load, save } from '../lib/storage'
import { getPlan } from '../engines/plan'
import { computeReadiness } from '../engines/readiness'
import { computeInjuryRisk } from '../engines/injury'
import { computeDecision } from '../engines/decision'
import { computePredictions } from '../engines/predictions'
import { getBloodWork } from '../engines/blood'
import { callClaude, hasApiKey } from '../lib/api'
import { AI_SYSTEM_PROMPT } from '../lib/constants'

const TODAY = new Date().toISOString().slice(0, 10)

export function useApp() {
  const [tab, setTab] = useState<TabId>('cmd')
  const [startDate, setStartDate] = useState<string | null>(null)
  const [checks, setChecks] = useState<Record<string, boolean>>({})
  const [hd, setHd] = useState<HealthData>({})
  const [wkLog, setWkLog] = useState<WorkoutLog>({})
  const [scannedMeals, setScannedMeals] = useState<ScannedMeal[]>([])
  const [medReports, setMedReports] = useState<MedReport[]>([])
  const [briefing, setBriefing] = useState<string | null>(null)
  const [briefingLoading, setBriefingLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [setup, setSetup] = useState(false)

  // Load all data on mount
  useEffect(() => {
    (async () => {
      const [sd, ch, h, wk, s, m] = await Promise.all([
        load<string | null>('start-date', null),
        load<Record<string, boolean>>(`ck-${TODAY}`, {}),
        load<HealthData>('health-data', {}),
        load<WorkoutLog>('wk-log', {}),
        load<ScannedMeal[]>('scanned-meals', []),
        load<MedReport[]>('med-reports', []),
      ])
      setStartDate(sd)
      setChecks(ch)
      setHd(h)
      setWkLog(wk)
      setScannedMeals(s)
      setMedReports(m)
      if (!sd) setSetup(true)
      setLoaded(true)
    })()
  }, [])

  // Computed values
  const plan = getPlan(startDate)
  const readiness = computeReadiness(hd, wkLog)
  const injury = computeInjuryRisk(readiness, hd, wkLog, plan)
  const decision = computeDecision(readiness, injury, plan)
  const predictions = computePredictions(wkLog, hd, plan)
  const blood = getBloodWork(plan.week, medReports.length > 0 ? medReports[medReports.length - 1].date : null)

  // Toggle check
  const toggle = useCallback(async (id: string) => {
    setChecks(prev => {
      const updated = { ...prev, [id]: !prev[id] }
      save(`ck-${TODAY}`, updated)
      return updated
    })
  }, [])

  // Start protocol
  const startProtocol = useCallback(async (date: string) => {
    await save('start-date', date)
    setStartDate(date)
    setSetup(false)
  }, [])

  // Auto-briefing
  useEffect(() => {
    if (!loaded || !startDate || !hasApiKey()) return
    ;(async () => {
      const cached = await load<string | null>(`br-${TODAY}`, null)
      if (cached) { setBriefing(cached); return }
      setBriefingLoading(true)
      try {
        const text = await callClaude(
          [{
            role: 'user',
            content: `BRIEFING AUTOMÁTICO.\nDía ${plan.day}, Sem ${plan.week}, ${plan.phaseName}, ${plan.split}.\nReadiness: ${readiness.score}. ACWR: ${readiness.acwr.toFixed(2)}. Injury Risk: ${injury.risk}%.\nDecision Engine: ${decision.mode} — ${decision.action}\nReasons: ${readiness.reasons.join('; ')}\nBlood work: ${blood.overdue ? 'OVERDUE' : blood.weeksUntil + ' sem'}\n\nBriefing 150 palabras max. 1) Estado. 2) Lo que va bien/mal. 3) Acción hoy. 4) Si missed days: recovery. 5) Si blood overdue: recordar.`,
          }],
          AI_SYSTEM_PROMPT,
          500
        )
        setBriefing(text)
        await save(`br-${TODAY}`, text)
      } catch {
        setBriefing('⚠ Error generando briefing. Verifica tu API key.')
      }
      setBriefingLoading(false)
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, startDate])

  return {
    // State
    tab, setTab,
    startDate,
    checks,
    hd, setHd,
    wkLog, setWkLog,
    scannedMeals, setScannedMeals,
    medReports, setMedReports,
    briefing, briefingLoading,
    loaded, setup,
    // Computed
    plan, readiness, injury, decision, predictions, blood,
    // Actions
    toggle, startProtocol,
  }
}
