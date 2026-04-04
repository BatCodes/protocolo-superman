import type { Plan } from '../lib/types'

const NOW = new Date()

export function getPlan(startDate: string | null): Plan {
  if (!startDate) {
    return { day: 0, week: 0, phase: 1, phaseName: '—', phaseWeek: 0, split: '—', dayIdx: 0, totalDays: 532, pct: 0 }
  }

  const diff = Math.floor((NOW.getTime() - new Date(startDate).getTime()) / 864e5)
  const day = Math.max(1, diff + 1)
  const week = Math.ceil(day / 7)

  let phase = 1, phaseName = 'FOUNDATION', ps = 1
  if (week > 60) { phase = 4; phaseName = 'THE CUT'; ps = 61 }
  else if (week > 30) { phase = 3; phaseName = 'MASS II'; ps = 31 }
  else if (week > 12) { phase = 2; phaseName = 'MASS I'; ps = 13 }

  const dow = NOW.getDay()
  const di = dow === 0 ? 6 : dow - 1
  const splits = ['PUSH', 'PULL', 'LEGS', 'PUSH', 'PULL', 'LEGS', 'REST']

  return {
    day,
    week,
    phase,
    phaseName,
    phaseWeek: week - ps + 1,
    split: splits[di],
    dayIdx: di,
    totalDays: 532,
    pct: Math.round(day / 532 * 100),
  }
}
