// ═══════════════════════════════════════════════════════════
// STRAIN SCORE — Physical stress accumulated in the day
// ENERGY BANK — Combined recovery+sleep+strain+stress metric
// Inspired by Bevel / WHOOP strain tracking
// ═══════════════════════════════════════════════════════════

import type { HealthData, WorkoutLog, HealthEntry } from '../lib/types'

const NOW = new Date()
const TODAY = NOW.toISOString().slice(0, 10)

function last(arr: HealthEntry[] | undefined, days: number): HealthEntry[] {
  return (arr || []).filter(e => (NOW.getTime() - new Date(e.d).getTime()) / 864e5 <= days)
}

function avg(entries: HealthEntry[]): number {
  if (entries.length === 0) return 0
  return entries.reduce((a, e) => a + e.v, 0) / entries.length
}

// ─── Strain Score (0-21 scale, like WHOOP) ───
export interface StrainResult {
  score: number          // 0-21
  level: 'light' | 'moderate' | 'high' | 'overreaching'
  workoutStrain: number  // from today's logged sets
  dailyStrain: number    // from steps + active energy
  cardioLoad: number     // estimated from HR data
  description: string
}

export function computeStrain(hd: HealthData, wkLog: WorkoutLog): StrainResult {
  // Workout strain: volume from today's sets
  let workoutVolume = 0
  let todaySets = 0
  Object.entries(wkLog).forEach(([key, sets]) => {
    if (key.startsWith(TODAY)) {
      sets.forEach(s => {
        workoutVolume += (s.w || 0) * (s.r || 0)
        todaySets++
      })
    }
  })

  // Normalize workout volume to 0-14 (main contributor)
  // ~20000kg total volume = max strain for a session
  const workoutStrain = Math.min(14, (workoutVolume / 20000) * 14)

  // Daily activity strain from steps
  const stepsToday = last(hd.steps, 1)
  const todaySteps = stepsToday.length > 0 ? stepsToday[stepsToday.length - 1].v : 0
  // 10000 steps = ~3 strain points
  const dailyStrain = Math.min(4, (todaySteps / 10000) * 3)

  // Cardio load estimate from active energy
  const energyToday = last(hd.energy, 1)
  const todayEnergy = energyToday.length > 0 ? energyToday[energyToday.length - 1].v : 0
  // 500 kcal active = ~3 strain points
  const cardioLoad = Math.min(3, (todayEnergy / 500) * 3)

  const score = Math.min(21, Math.round((workoutStrain + dailyStrain + cardioLoad) * 10) / 10)

  let level: StrainResult['level'] = 'light'
  let description = 'Actividad ligera. Margen para entrenar duro.'
  if (score >= 18) {
    level = 'overreaching'
    description = 'Strain extremo. Riesgo de sobreentrenamiento. Prioriza recovery.'
  } else if (score >= 14) {
    level = 'high'
    description = 'Strain alto. Buena sesión. Asegura nutrición y sueño de calidad.'
  } else if (score >= 8) {
    level = 'moderate'
    description = 'Strain moderado. Buen balance actividad-recuperación.'
  }

  return { score, level, workoutStrain, dailyStrain, cardioLoad, description }
}

// ─── Energy Bank (0-100) ───
// Combines: recovery readiness, sleep quality, accumulated strain, stress signals
export interface EnergyBankResult {
  level: number      // 0-100
  status: 'depleted' | 'low' | 'moderate' | 'charged' | 'peak'
  components: {
    recovery: number   // from readiness
    sleep: number      // from sleep quality
    strain: number     // inverse of accumulated strain (high strain = less energy)
    stress: number     // from HRV/RHR signals
  }
  recommendation: string
  color: string
}

export function computeEnergyBank(
  readinessScore: number,
  hd: HealthData,
  strain: StrainResult
): EnergyBankResult {
  // Recovery component (25%)
  const recovery = readinessScore

  // Sleep component (30%)
  const sleep7 = last(hd.sleep, 3)
  let sleepComponent = 50
  if (sleep7.length > 0) {
    const avgSleep = avg(sleep7)
    if (avgSleep >= 8) sleepComponent = 100
    else if (avgSleep >= 7.5) sleepComponent = 85
    else if (avgSleep >= 7) sleepComponent = 70
    else if (avgSleep >= 6) sleepComponent = 45
    else sleepComponent = 20
  }

  // Strain component - inverse (25%)
  // High strain today = less energy remaining
  const strainInverse = Math.max(0, Math.round(100 - (strain.score / 21) * 100))

  // Stress component from HRV/RHR (20%)
  const hrv7 = last(hd.hrv, 7)
  const rhr7 = last(hd.rhr, 7)
  let stressComponent = 60
  if (hrv7.length >= 3) {
    const hrvBaseline = avg(hrv7)
    const hrvRecent = hrv7[hrv7.length - 1]?.v || hrvBaseline
    const ratio = hrvRecent / hrvBaseline
    stressComponent = Math.min(100, Math.max(0, Math.round(ratio * 70)))
  }
  if (rhr7.length >= 3) {
    const rhrBaseline = avg(rhr7)
    const rhrRecent = rhr7[rhr7.length - 1]?.v || rhrBaseline
    if (rhrRecent > rhrBaseline + 5) stressComponent = Math.max(20, stressComponent - 20)
  }

  const level = Math.round(
    recovery * 0.25 +
    sleepComponent * 0.30 +
    strainInverse * 0.25 +
    stressComponent * 0.20
  )

  let status: EnergyBankResult['status'] = 'moderate'
  let recommendation = 'Energía normal. Puedes seguir el plan.'
  let color = '#ffd60a'

  if (level >= 85) {
    status = 'peak'; color = '#30d158'
    recommendation = 'Energía máxima. Día óptimo para PR o sesión intensa.'
  } else if (level >= 70) {
    status = 'charged'; color = '#30d158'
    recommendation = 'Bien cargado. Sesión estándar o push ligero.'
  } else if (level >= 50) {
    status = 'moderate'; color = '#ffd60a'
    recommendation = 'Energía moderada. Sesión estándar, evita máximos.'
  } else if (level >= 30) {
    status = 'low'; color = '#ff9f0a'
    recommendation = 'Energía baja. Reduce volumen 20-30%. Prioriza recovery.'
  } else {
    status = 'depleted'; color = '#ff453a'
    recommendation = 'Energía depleted. Día de descanso activo o movilidad.'
  }

  return {
    level,
    status,
    components: {
      recovery,
      sleep: sleepComponent,
      strain: strainInverse,
      stress: stressComponent,
    },
    recommendation,
    color,
  }
}
