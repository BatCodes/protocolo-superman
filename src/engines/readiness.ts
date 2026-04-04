import type { HealthData, WorkoutLog, HealthEntry, ReadinessResult } from '../lib/types'
import { computeACWR } from './acwr'

const NOW = new Date()

function last(arr: HealthEntry[] | undefined, n: number): HealthEntry[] {
  return (arr || []).filter(e => {
    const d = new Date(e.d)
    return (NOW.getTime() - d.getTime()) / 864e5 <= n
  })
}

export function computeReadiness(hd: HealthData, wkLog: WorkoutLog): ReadinessResult {
  const reasons: string[] = []

  // HRV component (30%)
  const hrvAll = last(hd.hrv, 28)
  const hrvRecent = last(hd.hrv, 2)
  let hrvScore = 50
  if (hrvAll.length >= 3 && hrvRecent.length > 0) {
    const baseline = hrvAll.reduce((a, e) => a + e.v, 0) / hrvAll.length
    const current = hrvRecent[hrvRecent.length - 1].v
    const ratio = current / baseline
    hrvScore = Math.min(100, Math.max(0, ratio * 80))
    if (ratio < 0.85) reasons.push(`HRV ↓${Math.round((1 - ratio) * 100)}% vs baseline`)
    else if (ratio > 1.1) reasons.push(`HRV ↑${Math.round((ratio - 1) * 100)}% vs baseline`)
  } else {
    reasons.push('HRV: datos insuficientes')
  }

  // Sleep component (25%)
  const sleepRecent = last(hd.sleep, 3)
  let sleepScore = 50
  if (sleepRecent.length > 0) {
    const avg = sleepRecent.reduce((a, e) => a + e.v, 0) / sleepRecent.length
    if (avg >= 7.5 && avg <= 8.5) sleepScore = 100
    else if (avg >= 7 && avg <= 9) sleepScore = 75
    else if (avg >= 6) { sleepScore = 40; reasons.push(`Sueño bajo: ${avg.toFixed(1)}h media`) }
    else { sleepScore = 15; reasons.push(`Sueño crítico: ${avg.toFixed(1)}h`) }
  } else {
    reasons.push('Sueño: sin datos')
  }

  // Wake consistency (15%)
  const wakeRecent = last(hd.wake_time, 7)
  let wakeScore = 50
  if (wakeRecent.length >= 3) {
    const times = wakeRecent.map(e => e.v)
    const avg = times.reduce((a, b) => a + b, 0) / times.length
    const variance = times.reduce((a, t) => a + Math.abs(t - avg), 0) / times.length
    wakeScore = Math.max(0, Math.round(100 - variance * 25))
    if (variance > 0.75) reasons.push(`Despertar irregular: ±${(variance * 60).toFixed(0)}min varianza`)
  }

  // RHR component (15%)
  const rhrAll = last(hd.rhr, 28)
  const rhrRecent = last(hd.rhr, 2)
  let rhrScore = 50
  if (rhrAll.length >= 3 && rhrRecent.length > 0) {
    const baseline = rhrAll.reduce((a, e) => a + e.v, 0) / rhrAll.length
    const current = rhrRecent[rhrRecent.length - 1].v
    if (current <= baseline) rhrScore = 90
    else if (current <= baseline * 1.05) rhrScore = 70
    else {
      rhrScore = Math.max(10, 70 - (current - baseline) * 5)
      reasons.push(`FC reposo ↑${Math.round(current - baseline)}bpm vs baseline`)
    }
  }

  // ACWR component (15%)
  const { acwr, acwrScore: acwrS, acute, chronic } = computeACWR(wkLog)
  if (acwr > 1.5) reasons.push(`ACWR ${acwr.toFixed(2)} — zona de riesgo`)
  else if (acwr < 0.8 && chronic > 0) reasons.push(`ACWR ${acwr.toFixed(2)} — desentrenamiento`)

  const total = Math.round(hrvScore * 0.30 + sleepScore * 0.25 + wakeScore * 0.15 + rhrScore * 0.15 + acwrS * 0.15)

  return {
    score: total,
    hrvScore,
    sleepScore,
    wakeScore,
    rhrScore,
    acwrScore: acwrS,
    acwr,
    acute,
    chronic,
    reasons,
  }
}
