// ═══════════════════════════════════════════════════════════
// COMPLIANCE ENGINE — Tracks adherence & auto-adjusts plan
// If compliance < 90%: adjusts next days to compensate
// If compliance > 90%: shows projected results
// ═══════════════════════════════════════════════════════════

import type { HealthData, WorkoutLog, HealthEntry } from '../lib/types'
import type { Plan } from '../lib/types'
import type { MacroTargets } from '../lib/profile'
import type { DiaryEntry } from '../lib/fooddb'

function last(arr: HealthEntry[] | undefined, days: number): HealthEntry[] {
  const now = new Date()
  return (arr || []).filter(e => (now.getTime() - new Date(e.d).getTime()) / 864e5 <= days)
}

// ─── Compliance Breakdown ───
export interface ComplianceResult {
  overall: number           // 0-100
  training: ComplianceArea
  nutrition: ComplianceArea
  supplements: ComplianceArea
  sleep: ComplianceArea
  hydration: ComplianceArea
  tracking: ComplianceArea  // data logging consistency
  showResults: boolean      // true if overall >= 90%
  adjustments: Adjustment[]
  projections: Projection[]
}

export interface ComplianceArea {
  score: number        // 0-100
  label: string
  detail: string
  status: 'excellent' | 'good' | 'needs-work' | 'critical'
  color: string
}

export interface Adjustment {
  area: string
  type: 'increase' | 'decrease' | 'maintain' | 'add' | 'skip'
  message: string
  priority: number
}

export interface Projection {
  metric: string
  current: string
  projected4w: string
  projected12w: string
  confidence: 'high' | 'medium' | 'low'
}

function areaStatus(score: number): { status: ComplianceArea['status']; color: string } {
  if (score >= 90) return { status: 'excellent', color: '#30d158' }
  if (score >= 75) return { status: 'good', color: '#ffd60a' }
  if (score >= 50) return { status: 'needs-work', color: '#ff9f0a' }
  return { status: 'critical', color: '#ff453a' }
}

// ─── Training Compliance ───
function computeTrainingCompliance(wkLog: WorkoutLog, plan: Plan): ComplianceArea {
  // Count training days in last 7 days
  const now = new Date()
  const trainDates = new Set<string>()
  Object.keys(wkLog).forEach(key => {
    const date = key.split('-').slice(0, 3).join('-')
    const d = new Date(date)
    if ((now.getTime() - d.getTime()) / 864e5 <= 7) trainDates.add(date)
  })

  const target = plan.split === 'REST' ? 5 : 6 // 6 train days per week target
  const actual = trainDates.size
  const score = Math.min(100, Math.round((actual / target) * 100))
  const { status, color } = areaStatus(score)

  return {
    score,
    label: 'Entrenamiento',
    detail: `${actual}/${target} sesiones esta semana`,
    status,
    color,
  }
}

// ─── Nutrition Compliance ───
function computeNutritionCompliance(
  checks: Record<string, boolean>,
  mealCount: number,
  diary: DiaryEntry[],
  macros: MacroTargets
): ComplianceArea {
  // Meal plan compliance (checked meals)
  const mealKeys = Array.from({ length: mealCount }, (_, i) => `meal-${i}`)
  const mealsChecked = mealKeys.filter(k => checks[k]).length
  const mealScore = mealCount > 0 ? Math.round((mealsChecked / mealCount) * 100) : 0

  // Food diary logging (did they log actual food?)
  const today = new Date().toISOString().slice(0, 10)
  const todayEntries = diary.filter(e => e.date === today)
  const todayKcal = todayEntries.reduce((a, e) => a + e.food.kcal * e.servings, 0)
  const kcalScore = macros.kcal > 0 ? Math.min(100, Math.round((todayKcal / macros.kcal) * 100)) : mealScore

  // Combine
  const score = Math.round(mealScore * 0.6 + kcalScore * 0.4)
  const { status, color } = areaStatus(score)

  return {
    score,
    label: 'Nutrición',
    detail: `${mealsChecked}/${mealCount} comidas · ${todayKcal}/${macros.kcal} kcal`,
    status,
    color,
  }
}

// ─── Supplement Compliance ───
function computeSupplementCompliance(checks: Record<string, boolean>, activeCount: number): ComplianceArea {
  const suppKeys = Array.from({ length: activeCount }, (_, i) => `s-${i}`)
  const taken = suppKeys.filter(k => checks[k]).length
  const score = activeCount > 0 ? Math.round((taken / activeCount) * 100) : 0
  const { status, color } = areaStatus(score)

  return {
    score,
    label: 'Suplementos',
    detail: `${taken}/${activeCount} tomados hoy`,
    status,
    color,
  }
}

// ─── Sleep Compliance ───
function computeSleepCompliance(hd: HealthData): ComplianceArea {
  const sleep7 = last(hd.sleep, 7)
  if (sleep7.length === 0) {
    return { score: 0, label: 'Sueño', detail: 'Sin datos registrados', ...areaStatus(0) }
  }

  const goodNights = sleep7.filter(e => e.v >= 7).length
  const score = Math.round((goodNights / sleep7.length) * 100)
  const avg = sleep7.reduce((a, e) => a + e.v, 0) / sleep7.length
  const { status, color } = areaStatus(score)

  return {
    score,
    label: 'Sueño',
    detail: `${goodNights}/${sleep7.length} noches ≥7h · media ${avg.toFixed(1)}h`,
    status,
    color,
  }
}

// ─── Hydration Compliance ───
function computeHydrationCompliance(checks: Record<string, boolean>, waterTarget: number): ComplianceArea {
  // Count water glasses checked today
  const waterKeys = Array.from({ length: 8 }, (_, i) => `water-${i}`)
  const filled = waterKeys.filter(k => checks[k]).length
  const consumed = (filled / 8) * waterTarget
  const score = Math.min(100, Math.round((consumed / waterTarget) * 100))
  const { status, color } = areaStatus(score)

  return {
    score,
    label: 'Hidratación',
    detail: `${consumed.toFixed(1)}L / ${waterTarget}L`,
    status,
    color,
  }
}

// ─── Tracking Compliance ───
function computeTrackingCompliance(hd: HealthData): ComplianceArea {
  const keyMetrics = ['weight', 'sleep', 'rhr', 'hrv', 'steps']
  const recent = keyMetrics.filter(k => {
    const entries = last(hd[k], 3)
    return entries.length > 0
  })
  const score = Math.round((recent.length / keyMetrics.length) * 100)
  const { status, color } = areaStatus(score)

  return {
    score,
    label: 'Seguimiento',
    detail: `${recent.length}/${keyMetrics.length} métricas actualizadas (3d)`,
    status,
    color,
  }
}

// ─── Auto-Adjustments ───
function generateAdjustments(
  training: ComplianceArea,
  nutrition: ComplianceArea,
  supplements: ComplianceArea,
  sleep: ComplianceArea,
  plan: Plan,
  macros: MacroTargets
): Adjustment[] {
  const adjustments: Adjustment[] = []

  // Training adjustments
  if (training.score < 70) {
    adjustments.push({
      area: 'Entrenamiento',
      type: 'increase',
      message: `Sesiones perdidas esta semana. Los próximos días añade 1 serie extra por ejercicio para compensar volumen.`,
      priority: 1,
    })
  }
  if (training.score < 50) {
    adjustments.push({
      area: 'Entrenamiento',
      type: 'add',
      message: 'Considera añadir una sesión extra el fin de semana para recuperar la frecuencia.',
      priority: 1,
    })
  }

  // Nutrition adjustments
  if (nutrition.score < 70) {
    const extraKcal = Math.round(macros.kcal * 0.15)
    adjustments.push({
      area: 'Nutrición',
      type: 'increase',
      message: `Déficit en comidas registradas. Añade +${extraKcal}kcal los próximos 2 días para compensar.`,
      priority: 1,
    })
  }
  if (nutrition.score >= 90 && plan.phase <= 3) {
    adjustments.push({
      area: 'Nutrición',
      type: 'maintain',
      message: 'Excelente adherencia nutricional. Mantén el surplus — los resultados llegarán.',
      priority: 3,
    })
  }

  // Supplement adjustments
  if (supplements.score < 80) {
    adjustments.push({
      area: 'Suplementos',
      type: 'add',
      message: 'Suplementos inconsistentes. La creatina requiere toma diaria para saturar. Pon alarma.',
      priority: 2,
    })
  }

  // Sleep adjustments
  if (sleep.score < 70) {
    adjustments.push({
      area: 'Sueño',
      type: 'increase',
      message: 'Deuda de sueño detectada. Adelanta 30min la hora de acostarte los próximos 3 días. Reduce carga de entreno si persiste.',
      priority: 1,
    })
    adjustments.push({
      area: 'Entrenamiento',
      type: 'decrease',
      message: 'AUTO-AJUSTE: Volumen reducido -20% hasta normalizar sueño (≥7h × 3 noches).',
      priority: 1,
    })
  }

  return adjustments.sort((a, b) => a.priority - b.priority)
}

// ─── Projections (only shown when compliance >= 90%) ───
function generateProjections(
  hd: HealthData,
  plan: Plan,
  compliance: number
): Projection[] {
  if (compliance < 90) return []

  const projections: Projection[] = []
  const weight = last(hd.weight, 30)

  if (weight.length >= 4) {
    const recent = weight.slice(-4).map(e => e.v)
    const earlier = weight.slice(-8, -4).map(e => e.v)
    if (earlier.length > 0) {
      const avgRecent = recent.reduce((a, b) => a + b, 0) / recent.length
      const avgEarlier = earlier.reduce((a, b) => a + b, 0) / earlier.length
      const weeklyChange = (avgRecent - avgEarlier) / 4 * 7

      projections.push({
        metric: 'Peso',
        current: `${avgRecent.toFixed(1)}kg`,
        projected4w: `${(avgRecent + weeklyChange * 4).toFixed(1)}kg`,
        projected12w: `${(avgRecent + weeklyChange * 12).toFixed(1)}kg`,
        confidence: compliance >= 95 ? 'high' : 'medium',
      })
    }
  }

  const bf = last(hd.bf, 30)
  if (bf.length >= 2) {
    const current = bf[bf.length - 1].v
    const change = plan.phase <= 3 ? 0.2 : -0.5 // slight increase during mass, decrease during cut
    projections.push({
      metric: 'Grasa corporal',
      current: `${current}%`,
      projected4w: `${(current + change * 4).toFixed(1)}%`,
      projected12w: `${(current + change * 12).toFixed(1)}%`,
      confidence: 'medium',
    })
  }

  // Strength projection based on training phase
  if (plan.phase <= 3) {
    projections.push({
      metric: 'Fuerza (e1RM)',
      current: 'Actual',
      projected4w: '+5-8% si mantienes adherencia',
      projected12w: '+15-20% proyectado',
      confidence: compliance >= 95 ? 'high' : 'medium',
    })
  }

  return projections
}

// ─── Main Compliance Computation ───
export function computeCompliance(
  hd: HealthData,
  wkLog: WorkoutLog,
  checks: Record<string, boolean>,
  plan: Plan,
  macros: MacroTargets,
  mealCount: number,
  activeSupplementCount: number,
  diary: DiaryEntry[]
): ComplianceResult {
  const training = computeTrainingCompliance(wkLog, plan)
  const nutrition = computeNutritionCompliance(checks, mealCount, diary, macros)
  const supplements = computeSupplementCompliance(checks, activeSupplementCount)
  const sleep = computeSleepCompliance(hd)
  const hydration = computeHydrationCompliance(checks, macros.water)
  const tracking = computeTrackingCompliance(hd)

  const overall = Math.round(
    training.score * 0.25 +
    nutrition.score * 0.25 +
    supplements.score * 0.10 +
    sleep.score * 0.20 +
    hydration.score * 0.10 +
    tracking.score * 0.10
  )

  const adjustments = generateAdjustments(training, nutrition, supplements, sleep, plan, macros)
  const projections = generateProjections(hd, plan, overall)

  return {
    overall,
    training,
    nutrition,
    supplements,
    sleep,
    hydration,
    tracking,
    showResults: overall >= 90,
    adjustments,
    projections,
  }
}
