import type { ReadinessResult, InjuryResult, Plan, DecisionResult } from '../lib/types'

export function computeDecision(
  readiness: ReadinessResult,
  injury: InjuryResult,
  _plan: Plan
): DecisionResult {
  const r = readiness.score
  const { acwr } = readiness
  let action: string, mode: DecisionResult['mode'], details: string, mods: string[] = []

  if (injury.risk >= 60) {
    mode = 'PROTECT'
    action = '🛡️ SESIÓN REDUCIDA — Riesgo lesión elevado'
    details = 'Reducir volumen 40%. No compuestos >80% 1RM. Añadir 15min movilidad. Priorizar recovery.'
    mods = ['-40% volumen', 'No >80% 1RM', '+Movilidad 15min']
  } else if (acwr > 1.5) {
    mode = 'DELOAD'
    action = '🔄 DELOAD FORZADO — ACWR en zona roja'
    details = '50% volumen, mantener intensidad. Tu carga acumulada excede la capacidad de recuperación.'
    mods = ['50% volumen', 'Mantener intensidad', 'Dormir 9h+']
  } else if (r < 40) {
    mode = 'RECOVER'
    action = '🔋 RECOVERY DAY — Readiness crítica'
    details = 'Sustituir sesión por movilidad + cardio zona 1. Tu cuerpo necesita recuperarse antes de entrenar fuerte.'
    mods = ['Solo movilidad', 'Cardio Z1 20min', 'Dormir 9h+', '+500kcal carbos']
  } else if (r < 60) {
    mode = 'REDUCE'
    action = '⚠️ SESIÓN ADAPTADA — Readiness baja'
    details = 'Reducir volumen 20-30%. Mantener compuestos principales pero sin PRs. Priorizar técnica.'
    mods = ['-20% volumen', 'No intentar PRs', 'Técnica > intensidad']
  } else if (r >= 80 && acwr >= 0.8 && acwr <= 1.2) {
    mode = 'PUSH'
    action = '🚀 PUSH DAY — Readiness óptima'
    details = 'Añadir 1 serie extra por ejercicio. Intentar PR en compuestos principales si te sientes fuerte.'
    mods = ['+1 serie/ejercicio', 'Intentar PRs', 'Surplus calórico alto']
  } else {
    mode = 'NORMAL'
    action = '✅ SESIÓN ESTÁNDAR — Todo en rango'
    details = 'Ejecutar plan como prescrito. Progresión normal.'
    mods = ['Plan estándar']
  }

  // Recovery autopilot
  const recovery: string[] = []
  if (r < 60) recovery.push('Frío AM: 2min máx (no forzar)')
  else recovery.push('Frío AM: protocolo normal')
  if (r < 50) {
    recovery.push('Sauna: saltar hoy')
    recovery.push('Dormir: objetivo 9h, en cama a las 21:30')
  } else {
    recovery.push('Sauna: post-entreno 15-20min')
    recovery.push('Dormir: objetivo 8h, en cama a las 22:00')
  }
  if (r >= 80) recovery.push('Nutrición: surplus máximo, +extra carbs post-WO')
  else if (r < 50) recovery.push('Nutrición: +500kcal carbos, comida pre-bed extra')
  else recovery.push('Nutrición: plan estándar')

  return { action, mode, details, mods, recovery, reasons: readiness.reasons }
}
