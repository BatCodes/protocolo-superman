import type { WorkoutLog, HealthData, Plan, PredictionResult } from '../lib/types'

export function computePredictions(wkLog: WorkoutLog, hd: HealthData, _plan: Plan): PredictionResult {
  const lifts: PredictionResult['lifts'] = {}

  Object.entries(wkLog).forEach(([key, sets]) => {
    const parts = key.split('-')
    const date = parts.slice(0, 3).join('-')
    sets.forEach(s => {
      if (s.w && s.r) {
        const e1rm = Math.round(s.w * (1 + s.r / 30)) // Epley formula
        const exIdx = parts[parts.length - 1]
        const split = parts[3]
        const liftKey = `${split}-${exIdx}`
        if (!lifts[liftKey]) lifts[liftKey] = []
        lifts[liftKey].push({ d: date, e1rm, w: s.w, r: s.r })
      }
    })
  })

  // Weight trajectory
  const weights = (hd.weight || []).slice(-30)
  let weightTrend: PredictionResult['weightTrend'] = null
  if (weights.length >= 4) {
    const recent = weights.slice(-4).map(e => e.v)
    const earlier = weights.slice(-8, -4).map(e => e.v)
    if (earlier.length > 0) {
      const avgRecent = recent.reduce((a, b) => a + b, 0) / recent.length
      const avgEarlier = earlier.reduce((a, b) => a + b, 0) / earlier.length
      const weeklyChange = (avgRecent - avgEarlier) / 4 * 7
      weightTrend = {
        current: avgRecent,
        weeklyChange,
        projected4w: Math.round((avgRecent + weeklyChange * 4) * 10) / 10,
      }
    }
  }

  return { lifts, weightTrend }
}
