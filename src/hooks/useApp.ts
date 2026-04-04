import { useState, useEffect, useCallback, useMemo } from 'react'
import type { HealthData, WorkoutLog, ScannedMeal, MedReport, TabId } from '../lib/types'
import { load, save } from '../lib/storage'
import { getPlan } from '../engines/plan'
import { computeReadiness } from '../engines/readiness'
import { computeInjuryRisk } from '../engines/injury'
import { computeDecision } from '../engines/decision'
import { computePredictions } from '../engines/predictions'
import { getBloodWork } from '../engines/blood'
import { callClaude, hasApiKey } from '../lib/api'
import { AI_SYSTEM_PROMPT, DAILY_MEALS } from '../lib/constants'
import type { UserProfile } from '../lib/profile'
import { computeMacros, generateMealPlan, buildAIPrompt, type MacroTargets, type MealPlan } from '../lib/profile'

const TODAY = new Date().toISOString().slice(0, 10)

const DEFAULT_MACROS: MacroTargets = { kcal: 3000, protein: 180, carbs: 350, fat: 70, water: 3.2 }

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
  const [profile, setProfile] = useState<UserProfile | null>(null)

  // Load all data on mount
  useEffect(() => {
    (async () => {
      const [sd, ch, h, wk, s, m, p] = await Promise.all([
        load<string | null>('start-date', null),
        load<Record<string, boolean>>(`ck-${TODAY}`, {}),
        load<HealthData>('health-data', {}),
        load<WorkoutLog>('wk-log', {}),
        load<ScannedMeal[]>('scanned-meals', []),
        load<MedReport[]>('med-reports', []),
        load<UserProfile | null>('user-profile', null),
      ])
      setStartDate(sd)
      setChecks(ch)
      setHd(h)
      setWkLog(wk)
      setScannedMeals(s)
      setMedReports(m)
      setProfile(p)
      if (!sd || !p) setSetup(true)
      setLoaded(true)
    })()
  }, [])

  // Computed values
  const plan = getPlan(startDate)
  const isTrainingDay = plan.split !== 'REST'
  const readiness = computeReadiness(hd, wkLog)
  const injury = computeInjuryRisk(readiness, hd, wkLog, plan)
  const decision = computeDecision(readiness, injury, plan)
  const predictions = computePredictions(wkLog, hd, plan)
  const blood = getBloodWork(plan.week, medReports.length > 0 ? medReports[medReports.length - 1].date : null)

  // Dynamic macros and meal plan
  const macros: MacroTargets = useMemo(() => {
    if (!profile) return DEFAULT_MACROS
    return computeMacros(profile, plan.phase, isTrainingDay)
  }, [profile, plan.phase, isTrainingDay])

  const mealPlan: MealPlan[] = useMemo(() => {
    if (!profile) return DAILY_MEALS as unknown as MealPlan[]
    return generateMealPlan(profile, macros, isTrainingDay)
  }, [profile, macros, isTrainingDay])

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

  // Save profile and set start date from profile
  const saveProfile = useCallback(async (p: UserProfile) => {
    await save('user-profile', p)
    setProfile(p)
    await save('start-date', p.startDate)
    setStartDate(p.startDate)
    setSetup(false)
  }, [])

  // Auto-briefing
  useEffect(() => {
    if (!loaded || !startDate || !hasApiKey()) return
    ;(async () => {
      const cached = await load<string | null>(`br-${TODAY}`, null)
      if (cached) { setBriefing(cached); return }
      setBriefingLoading(true)
      const systemPrompt = profile ? buildAIPrompt(profile) : AI_SYSTEM_PROMPT
      try {
        const text = await callClaude(
          [{
            role: 'user',
            content: `BRIEFING AUTOM\u00c1TICO.\nD\u00eda ${plan.day}, Sem ${plan.week}, ${plan.phaseName}, ${plan.split}.\nReadiness: ${readiness.score}. ACWR: ${readiness.acwr.toFixed(2)}. Injury Risk: ${injury.risk}%.\nDecision Engine: ${decision.mode} \u2014 ${decision.action}\nReasons: ${readiness.reasons.join('; ')}\nBlood work: ${blood.overdue ? 'OVERDUE' : blood.weeksUntil + ' sem'}\n\nBriefing 150 palabras max. 1) Estado. 2) Lo que va bien/mal. 3) Acci\u00f3n hoy. 4) Si missed days: recovery. 5) Si blood overdue: recordar.`,
          }],
          systemPrompt,
          500
        )
        setBriefing(text)
        await save(`br-${TODAY}`, text)
      } catch {
        setBriefing('\u26a0 Error generando briefing. Verifica tu API key.')
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
    profile,
    // Computed
    plan, readiness, injury, decision, predictions, blood,
    macros, mealPlan,
    // Actions
    toggle, startProtocol, saveProfile,
  }
}
