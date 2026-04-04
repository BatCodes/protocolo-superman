import type { BloodResult } from '../lib/types'
import { BLOOD_SCHEDULE } from '../lib/constants'

export function getBloodWork(week: number, lastDate: string | null): BloodResult {
  const next = BLOOD_SCHEDULE.find(b => b.wk >= week - 1) || BLOOD_SCHEDULE[BLOOD_SCHEDULE.length - 1]
  return {
    next,
    weeksUntil: next.wk - week,
    overdue: next.wk - week < -1,
    lastDate,
  }
}
