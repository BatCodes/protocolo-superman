// ═══════════════════════════════════════════════════════════
// HEALTH SCORE ENGINE — Composite health metric (0-100)
// Combines: body composition, cardiovascular, sleep, recovery,
// activity, nutrition compliance, and consistency
// ═══════════════════════════════════════════════════════════

import type { HealthData, WorkoutLog, HealthEntry } from '../lib/types'

const NOW = new Date()

function last(arr: HealthEntry[] | undefined, days: number): HealthEntry[] {
  return (arr || []).filter(e => (NOW.getTime() - new Date(e.d).getTime()) / 864e5 <= days)
}

function avg(entries: HealthEntry[]): number {
  if (entries.length === 0) return 0
  return entries.reduce((a, e) => a + e.v, 0) / entries.length
}

export interface HealthScoreBreakdown {
  total: number              // 0-100
  composition: number        // 0-100: body fat, muscle, weight trend
  cardiovascular: number     // 0-100: RHR, HRV, SpO2
  sleep: number              // 0-100: duration, consistency
  recovery: number           // 0-100: readiness, HRV trend
  activity: number           // 0-100: steps, workout consistency
  nutrition: number          // 0-100: meal compliance, water
  consistency: number        // 0-100: streak-based logging consistency
  dataCompleteness: number   // 0-100: how much data we have
  insights: string[]         // Key findings
  metabolicAge: number | null // Estimated metabolic age
}

// Body composition scoring
function scoreComposition(hd: HealthData, _profileAge: number): { score: number; insights: string[] } {
  const insights: string[] = []
  let total = 0, count = 0

  // Body fat assessment
  const bf = last(hd.bf, 30)
  if (bf.length > 0) {
    const current = bf[bf.length - 1].v
    // Optimal ranges (male): 10-15% excellent, 15-20% good, 20-25% fair
    if (current <= 12) { total += 100; insights.push(`Grasa corporal ${current}% — élite`) }
    else if (current <= 15) { total += 90 }
    else if (current <= 20) { total += 70; insights.push(`Grasa corporal ${current}% — buen rango`) }
    else if (current <= 25) { total += 50; insights.push(`Grasa corporal ${current}% — margen de mejora`) }
    else { total += 25; insights.push(`Grasa corporal ${current}% — priorizar recomposición`) }
    count++

    // Trend (losing fat = good during cut, gaining during mass is expected)
    if (bf.length >= 4) {
      const recentAvg = avg(bf.slice(-3))
      const olderAvg = avg(bf.slice(-6, -3))
      if (recentAvg < olderAvg) insights.push(`Grasa ↓${(olderAvg - recentAvg).toFixed(1)}% tendencia positiva`)
    }
  }

  // Muscle mass trend
  const muscle = last(hd.muscle, 30)
  if (muscle.length > 0) {
    const current = muscle[muscle.length - 1].v
    if (current >= 45) { total += 95 }
    else if (current >= 40) { total += 80 }
    else if (current >= 35) { total += 65 }
    else { total += 40 }
    count++

    if (muscle.length >= 4) {
      const recentAvg = avg(muscle.slice(-3))
      const olderAvg = avg(muscle.slice(-6, -3))
      if (recentAvg > olderAvg) insights.push(`Masa muscular ↑${(recentAvg - olderAvg).toFixed(1)}% — progreso activo`)
    }
  }

  // Weight trend (relative to goal)
  const weight = last(hd.weight, 30)
  if (weight.length >= 2) {
    const trend = weight[weight.length - 1].v - weight[0].v
    // Gaining 0.25-0.5kg/week = ideal for mass
    const weeklyChange = trend / (weight.length > 1 ? Math.max(1, (new Date(weight[weight.length-1].d).getTime() - new Date(weight[0].d).getTime()) / 604800000) : 1)
    if (weeklyChange >= 0.2 && weeklyChange <= 0.6) { total += 90 }
    else if (weeklyChange >= 0 && weeklyChange <= 1) { total += 70 }
    else { total += 50 }
    count++
  }

  // BMI estimate
  const w = last(hd.weight, 7)
  if (w.length > 0) {
    // We'd need height from profile, estimate score
    total += 70 // baseline
    count++
  }

  return { score: count > 0 ? Math.round(total / count) : 50, insights }
}

// Cardiovascular scoring
function scoreCardiovascular(hd: HealthData): { score: number; insights: string[] } {
  const insights: string[] = []
  let total = 0, count = 0

  // RHR
  const rhr = last(hd.rhr, 14)
  if (rhr.length > 0) {
    const current = rhr[rhr.length - 1].v
    if (current <= 55) { total += 100; insights.push(`FC reposo ${current}bpm — cardiovascular excelente`) }
    else if (current <= 65) { total += 80 }
    else if (current <= 75) { total += 60 }
    else { total += 35; insights.push(`FC reposo ${current}bpm — margen de mejora cardiovascular`) }
    count++
  }

  // HRV
  const hrv = last(hd.hrv, 14)
  if (hrv.length > 0) {
    const current = hrv[hrv.length - 1].v
    if (current >= 60) { total += 95 }
    else if (current >= 40) { total += 75 }
    else if (current >= 25) { total += 50 }
    else { total += 25; insights.push(`HRV ${current}ms — estrés acumulado o falta de recovery`) }
    count++
  }

  // SpO2
  const spo2 = last(hd.spo2, 7)
  if (spo2.length > 0) {
    const current = spo2[spo2.length - 1].v
    if (current >= 97) total += 100
    else if (current >= 95) total += 80
    else { total += 40; insights.push(`SpO2 ${current}% — consultar si persiste bajo 95%`) }
    count++
  }

  return { score: count > 0 ? Math.round(total / count) : 50, insights }
}

// Sleep scoring
function scoreSleep(hd: HealthData): { score: number; insights: string[] } {
  const insights: string[] = []
  let total = 0, count = 0

  const sleep = last(hd.sleep, 14)
  if (sleep.length > 0) {
    const avgSleep = avg(sleep)
    if (avgSleep >= 7.5 && avgSleep <= 8.5) { total += 100; insights.push(`Sueño ${avgSleep.toFixed(1)}h media — óptimo`) }
    else if (avgSleep >= 7) { total += 80 }
    else if (avgSleep >= 6) { total += 50; insights.push(`Sueño ${avgSleep.toFixed(1)}h — deuda acumulada`) }
    else { total += 20; insights.push(`Sueño crítico ${avgSleep.toFixed(1)}h — impacto en recuperación y hormonas`) }
    count++
  }

  // Consistency
  const wake = last(hd.wake_time, 14)
  if (wake.length >= 5) {
    const times = wake.map(e => e.v)
    const variance = times.reduce((a, t) => a + Math.abs(t - avg(wake)), 0) / times.length
    if (variance <= 0.5) { total += 95; insights.push('Horario de despertar muy consistente') }
    else if (variance <= 1) { total += 70 }
    else { total += 35; insights.push(`Despertar irregular (±${Math.round(variance * 60)}min) — ritmo circadiano alterado`) }
    count++
  }

  const bed = last(hd.bed_time, 14)
  if (bed.length >= 5) {
    const avgBed = avg(bed)
    if (avgBed <= 22.5) total += 90
    else if (avgBed <= 23) total += 70
    else { total += 40; insights.push(`Hora de dormir media: ${Math.floor(avgBed)}:${String(Math.round((avgBed % 1) * 60)).padStart(2, '0')} — demasiado tarde`) }
    count++
  }

  return { score: count > 0 ? Math.round(total / count) : 50, insights }
}

// Activity scoring
function scoreActivity(hd: HealthData, wkLog: WorkoutLog): { score: number; insights: string[] } {
  const insights: string[] = []
  let total = 0, count = 0

  // Steps
  const steps = last(hd.steps, 14)
  if (steps.length > 0) {
    const avgSteps = avg(steps)
    if (avgSteps >= 10000) { total += 100 }
    else if (avgSteps >= 7500) { total += 80; insights.push(`${Math.round(avgSteps)} pasos/día — cerca del óptimo`) }
    else if (avgSteps >= 5000) { total += 55 }
    else { total += 25; insights.push(`Solo ${Math.round(avgSteps)} pasos/día — NEAT bajo, aumentar movimiento diario`) }
    count++
  }

  // Workout consistency (days trained in last 14 days)
  const trainDates = new Set<string>()
  Object.keys(wkLog).forEach(key => {
    const date = key.split('-').slice(0, 3).join('-')
    const d = new Date(date)
    if ((NOW.getTime() - d.getTime()) / 864e5 <= 14) trainDates.add(date)
  })
  const daysPerWeek = (trainDates.size / 2) // over 2 weeks
  if (daysPerWeek >= 5) { total += 100; insights.push(`${daysPerWeek.toFixed(1)} sesiones/semana — consistencia élite`) }
  else if (daysPerWeek >= 4) { total += 85 }
  else if (daysPerWeek >= 3) { total += 65 }
  else { total += 30; insights.push(`Solo ${daysPerWeek.toFixed(1)} sesiones/semana — aumentar frecuencia`) }
  count++

  return { score: count > 0 ? Math.round(total / count) : 50, insights }
}

// Estimate metabolic age
function estimateMetabolicAge(hd: HealthData, chronologicalAge: number): number | null {
  const bf = last(hd.bf, 30)
  const rhr = last(hd.rhr, 14)
  const sleep = last(hd.sleep, 14)

  if (bf.length === 0 && rhr.length === 0) return null

  let adjustment = 0

  if (bf.length > 0) {
    const bfVal = bf[bf.length - 1].v
    if (bfVal < 12) adjustment -= 4
    else if (bfVal < 18) adjustment -= 1
    else if (bfVal > 25) adjustment += 3
    else if (bfVal > 30) adjustment += 7
  }

  if (rhr.length > 0) {
    const rhrVal = rhr[rhr.length - 1].v
    if (rhrVal < 55) adjustment -= 3
    else if (rhrVal < 65) adjustment -= 1
    else if (rhrVal > 80) adjustment += 4
  }

  if (sleep.length > 0) {
    const avgSleep = avg(sleep)
    if (avgSleep >= 7.5) adjustment -= 1
    else if (avgSleep < 6) adjustment += 3
  }

  return Math.max(18, chronologicalAge + adjustment)
}

// Main Health Score computation
export function computeHealthScore(
  hd: HealthData,
  wkLog: WorkoutLog,
  checks: Record<string, boolean>,
  profileAge: number,
  readinessScore: number
): HealthScoreBreakdown {
  const comp = scoreComposition(hd, profileAge)
  const cardio = scoreCardiovascular(hd)
  const sleepScore = scoreSleep(hd)
  const activity = scoreActivity(hd, wkLog)

  // Recovery = readiness score mapped to 0-100
  const recovery = readinessScore

  // Nutrition compliance from meal checks
  const mealKeys = Object.keys(checks).filter(k => k.startsWith('meal-'))
  const mealsChecked = mealKeys.filter(k => checks[k]).length
  const nutritionScore = mealKeys.length > 0 ? Math.round((mealsChecked / Math.max(mealKeys.length, 8)) * 100) : 50

  // Consistency from supplement checks
  const suppKeys = Object.keys(checks).filter(k => k.startsWith('s-'))
  const suppsChecked = suppKeys.filter(k => checks[k]).length
  const consistencyScore = suppKeys.length > 0 ? Math.round((suppsChecked / suppKeys.length) * 100) : 50

  // Data completeness
  const categories = ['weight', 'bf', 'muscle', 'rhr', 'hrv', 'sleep', 'wake_time', 'steps', 'spo2', 'water']
  const filled = categories.filter(c => (hd[c] || []).length > 0).length
  const dataCompleteness = Math.round((filled / categories.length) * 100)

  // Weighted total
  const total = Math.round(
    comp.score * 0.20 +
    cardio.score * 0.20 +
    sleepScore.score * 0.15 +
    recovery * 0.15 +
    activity.score * 0.15 +
    nutritionScore * 0.08 +
    consistencyScore * 0.07
  )

  const allInsights = [
    ...comp.insights,
    ...cardio.insights,
    ...sleepScore.insights,
    ...activity.insights,
  ]

  const metabolicAge = estimateMetabolicAge(hd, profileAge)

  return {
    total,
    composition: comp.score,
    cardiovascular: cardio.score,
    sleep: sleepScore.score,
    recovery,
    activity: activity.score,
    nutrition: nutritionScore,
    consistency: consistencyScore,
    dataCompleteness,
    insights: allInsights,
    metabolicAge,
  }
}
