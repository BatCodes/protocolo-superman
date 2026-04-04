import type { WorkoutLog, ACWRResult } from '../lib/types'

const NOW = new Date()

export function computeACWR(wkLog: WorkoutLog): ACWRResult {
  const getVolume = (days: number): number => {
    let vol = 0
    Object.entries(wkLog).forEach(([key, sets]) => {
      const dateStr = key.split('-').slice(0, 3).join('-')
      const d = new Date(dateStr)
      if ((NOW.getTime() - d.getTime()) / 864e5 <= days) {
        sets.forEach(s => { vol += (s.w || 0) * (s.r || 0) })
      }
    })
    return vol
  }

  const acute = getVolume(7)
  const chronic28 = getVolume(28)
  const chronicWeekly = chronic28 / 4
  const acwr = chronicWeekly > 0 ? acute / chronicWeekly : 1.0

  let acwrScore = 80
  if (acwr >= 0.8 && acwr <= 1.3) acwrScore = 95
  else if (acwr > 1.3 && acwr <= 1.5) acwrScore = 60
  else if (acwr > 1.5) acwrScore = 20
  else if (acwr < 0.8) acwrScore = 50

  return { acwr, acwrScore, acute, chronic: chronicWeekly }
}
