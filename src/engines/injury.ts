import type { HealthData, WorkoutLog, Plan, ReadinessResult, InjuryResult, HealthEntry } from '../lib/types'

const NOW = new Date()

function last(arr: HealthEntry[] | undefined, n: number): HealthEntry[] {
  return (arr || []).filter(e => (NOW.getTime() - new Date(e.d).getTime()) / 864e5 <= n)
}

export function computeInjuryRisk(
  readiness: ReadinessResult,
  hd: HealthData,
  _wkLog: WorkoutLog,
  plan: Plan
): InjuryResult {
  let risk = 0
  const factors: string[] = []

  if (readiness.acwr > 1.5) { risk += 30; factors.push('ACWR >1.5 (carga aguda excesiva)') }
  else if (readiness.acwr > 1.3) { risk += 15; factors.push('ACWR >1.3 (límite alto)') }

  const sleepDebt = last(hd.sleep, 7).filter(e => e.v < 7).length
  if (sleepDebt >= 3) { risk += 20; factors.push(`Deuda de sueño: ${sleepDebt} noches <7h`) }

  if (readiness.hrvScore < 40) { risk += 15; factors.push('HRV suprimido') }

  const weeksSinceStart = plan.phaseWeek
  if (weeksSinceStart > 5 && weeksSinceStart % 5 > 4) { risk += 10; factors.push(`${weeksSinceStart} semanas sin deload`) }

  if (readiness.rhrScore < 40) { risk += 10; factors.push('FC reposo elevada') }

  const level = risk >= 60 ? 'HIGH' : risk >= 30 ? 'MODERATE' : 'LOW'
  return { risk: Math.min(risk, 95), factors, level }
}
