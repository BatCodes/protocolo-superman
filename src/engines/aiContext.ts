// ═══════════════════════════════════════════════════════════
// AI CONTEXT ENGINE — Micro-insights for every metric
// Every number gets a "why" and an "action"
// Rule-based (instant) — feels like AI, costs nothing
// ═══════════════════════════════════════════════════════════

import type { HealthData, HealthEntry } from '../lib/types'

function last(arr: HealthEntry[] | undefined, days: number): HealthEntry[] {
  const now = new Date()
  return (arr || []).filter(e => (now.getTime() - new Date(e.d).getTime()) / 864e5 <= days)
}

function avg(arr: HealthEntry[]): number {
  return arr.length > 0 ? arr.reduce((a, e) => a + e.v, 0) / arr.length : 0
}

function trend(arr: HealthEntry[]): 'improving' | 'declining' | 'stable' | 'insufficient' {
  if (arr.length < 4) return 'insufficient'
  const recent = avg(arr.slice(-3))
  const older = avg(arr.slice(-6, -3))
  if (recent > older * 1.03) return 'improving'
  if (recent < older * 0.97) return 'declining'
  return 'stable'
}

export interface MicroInsight {
  metric: string
  value: string
  why: string
  action: string
  trend: 'improving' | 'declining' | 'stable' | 'insufficient'
  severity: 'positive' | 'neutral' | 'warning' | 'critical'
}

// ─── Weight insight ───
function weightInsight(hd: HealthData, goalWeight: number): MicroInsight | null {
  const entries = last(hd.weight, 30)
  if (entries.length === 0) return null
  const current = entries[entries.length - 1].v
  const t = trend(entries)
  const diff = goalWeight - current
  const weekly = entries.length >= 8 ? (entries[entries.length - 1].v - entries[entries.length - 8].v) / (entries.length / 7) : 0

  let why = '', action = '', severity: MicroInsight['severity'] = 'neutral'
  if (diff > 0) {
    // Gaining phase
    if (weekly >= 0.2 && weekly <= 0.5) {
      why = `Ganando ${weekly.toFixed(2)}kg/sem — ritmo ideal para masa muscular sin exceso de grasa.`
      action = 'Mantén el surplus actual. Estás en el sweet spot.'
      severity = 'positive'
    } else if (weekly > 0.5) {
      why = `Ganando ${weekly.toFixed(2)}kg/sem — ritmo alto. Parte puede ser grasa innecesaria.`
      action = 'Reduce surplus 200kcal/día. Objetivo: 0.25-0.5kg/sem.'
      severity = 'warning'
    } else if (weekly < 0.1 && weekly >= 0) {
      why = `Solo ${weekly.toFixed(2)}kg/sem — insuficiente para masa. Tu cuerpo no tiene material para construir.`
      action = 'Añade 300kcal/día. Prioriza carbos post-entreno.'
      severity = 'warning'
    } else if (weekly < 0) {
      why = `Perdiendo peso en fase de masa — déficit calórico no intencionado.`
      action = 'Urgente: aumenta ingesta 500kcal/día. Revisa tracking de comidas.'
      severity = 'critical'
    }
  } else {
    // Cutting or at goal
    if (weekly >= -0.5 && weekly <= -0.2) {
      why = `Perdiendo ${Math.abs(weekly).toFixed(2)}kg/sem — ritmo saludable para definición.`
      action = 'Mantén. Proteína alta (2.5g/kg) para preservar músculo.'
      severity = 'positive'
    } else if (weekly < -0.7) {
      why = `Perdiendo ${Math.abs(weekly).toFixed(2)}kg/sem — demasiado rápido. Riesgo de pérdida muscular.`
      action = 'Reduce déficit. Añade 200kcal. La prisa es enemiga del músculo.'
      severity = 'critical'
    }
  }

  return {
    metric: 'Peso',
    value: `${current.toFixed(1)}kg`,
    why: why || `${current.toFixed(1)}kg — ${Math.abs(diff).toFixed(1)}kg del objetivo.`,
    action: action || 'Continúa registrando peso diariamente en ayunas.',
    trend: t === 'improving' ? (diff > 0 ? 'improving' : 'declining') : t,
    severity: severity || 'neutral',
  }
}

// ─── Sleep insight ───
function sleepInsight(hd: HealthData): MicroInsight | null {
  const entries = last(hd.sleep, 14)
  if (entries.length === 0) return null
  const current = entries[entries.length - 1].v
  const badNights = entries.filter(e => e.v < 7).length

  let why = '', action = '', severity: MicroInsight['severity'] = 'neutral'
  if (current >= 8) {
    why = `${current.toFixed(1)}h anoche — zona óptima. Tu testosterona, HGH y recuperación muscular se maximizan con 7.5-8.5h.`
    action = 'Perfecto. Mantén este patrón.'
    severity = 'positive'
  } else if (current >= 7) {
    why = `${current.toFixed(1)}h — aceptable pero no óptimo. Cada hora por debajo de 8 reduce la recuperación un ~10%.`
    action = 'Intenta adelantar 30min la hora de acostarte.'
    severity = 'neutral'
  } else if (current >= 6) {
    why = `${current.toFixed(1)}h — deuda de sueño. Tu cortisol sube un 37% con menos de 7h. Testosterona cae un 10-15%.`
    action = 'Prioridad máxima: en cama a las 21:30. Sin pantallas 1h antes.'
    severity = 'warning'
  } else {
    why = `${current.toFixed(1)}h — crítico. Rendimiento mental y físico severamente comprometidos.`
    action = 'Reduce carga de entreno hoy. Siesta de 20min si es posible. En cama a las 21:00.'
    severity = 'critical'
  }

  if (badNights >= 3) {
    why += ` ${badNights} de ${entries.length} noches por debajo de 7h.`
  }

  return { metric: 'Sueño', value: `${current.toFixed(1)}h`, why, action, trend: trend(entries), severity }
}

// ─── HRV insight ───
function hrvInsight(hd: HealthData): MicroInsight | null {
  const entries = last(hd.hrv, 14)
  if (entries.length === 0) return null
  const current = entries[entries.length - 1].v
  const baseline = avg(entries)
  const ratio = current / baseline

  let why = '', action = '', severity: MicroInsight['severity'] = 'neutral'
  if (ratio >= 1.1) {
    why = `HRV ${current}ms — ${Math.round((ratio - 1) * 100)}% por encima de tu baseline. Sistema nervioso parasimpático dominante.`
    action = 'Día ideal para sesión intensa o intentar PRs.'
    severity = 'positive'
  } else if (ratio >= 0.9) {
    why = `HRV ${current}ms — dentro del rango normal. Recuperación adecuada.`
    action = 'Sesión estándar. Todo en orden.'
    severity = 'neutral'
  } else if (ratio >= 0.8) {
    why = `HRV ${current}ms — ${Math.round((1 - ratio) * 100)}% por debajo de baseline. Señal de estrés acumulado o recuperación incompleta.`
    action = 'Reduce intensidad un 20%. Prioriza sueño y nutrición hoy.'
    severity = 'warning'
  } else {
    why = `HRV ${current}ms — significativamente suprimido. Posible sobreentrenamiento, enfermedad incipiente o estrés severo.`
    action = 'Día de descanso activo. Solo movilidad/caminar. Monitoriza mañana.'
    severity = 'critical'
  }

  return { metric: 'HRV', value: `${current}ms`, why, action, trend: trend(entries), severity }
}

// ─── RHR insight ───
function rhrInsight(hd: HealthData): MicroInsight | null {
  const entries = last(hd.rhr, 14)
  if (entries.length === 0) return null
  const current = entries[entries.length - 1].v
  const baseline = avg(entries)

  let why = '', action = '', severity: MicroInsight['severity'] = 'neutral'
  if (current <= 55) {
    why = `FC ${current}bpm — nivel de atleta. Corazón eficiente, buena adaptación cardiovascular.`
    action = 'Excelente. Sigue con el protocolo.'
    severity = 'positive'
  } else if (current <= 65) {
    why = `FC ${current}bpm — rango saludable. Irá bajando con el entrenamiento consistente.`
    action = 'El cardio en zona 2 (caminar 30min) acelera la mejora.'
    severity = 'neutral'
  } else if (current > baseline + 5) {
    why = `FC ${current}bpm — ${Math.round(current - baseline)}bpm por encima de tu baseline. Posible fatiga, estrés o infección.`
    action = 'Reduce volumen de entreno. Si persiste 3+ días, considera visita médica.'
    severity = 'warning'
  } else if (current > 75) {
    why = `FC ${current}bpm — elevada para alguien activo. Puede indicar estrés crónico o falta de sueño.`
    action = 'Prioriza recuperación: sueño, hidratación, y manejo de estrés.'
    severity = 'warning'
  }

  return { metric: 'FC Reposo', value: `${current}bpm`, why, action, trend: trend(entries), severity }
}

// ─── Body fat insight ───
function bfInsight(hd: HealthData): MicroInsight | null {
  const entries = last(hd.bf, 30)
  if (entries.length === 0) return null
  const current = entries[entries.length - 1].v
  const t = trend(entries)

  let why = '', action = '', severity: MicroInsight['severity'] = 'neutral'
  if (current <= 12) {
    why = `${current}% — nivel atlético élite. Definición muscular visible.`
    action = 'Mantener este nivel requiere consistencia. No bajar de 8% (riesgo hormonal).'
    severity = 'positive'
  } else if (current <= 15) {
    why = `${current}% — rango atlético. Abdominales visibles. Buena salud hormonal.`
    action = 'Rango ideal para rendimiento y estética. Mantén.'
    severity = 'positive'
  } else if (current <= 20) {
    why = `${current}% — rango saludable normal. Definición parcial.`
    action = t === 'declining' ? 'Tendencia positiva — sigue así.' : 'Déficit moderado de 300-500kcal para bajar.'
    severity = 'neutral'
  } else if (current <= 25) {
    why = `${current}% — por encima del óptimo para rendimiento. Impacta sensibilidad a insulina.`
    action = 'Prioriza recomposición: déficit suave + entreno de fuerza + proteína alta.'
    severity = 'warning'
  } else {
    why = `${current}% — zona de riesgo metabólico. Aumenta riesgo cardiovascular y resistencia a insulina.`
    action = 'Consulta médico. Déficit controlado de 500kcal + caminar 10k pasos/día.'
    severity = 'critical'
  }

  return { metric: 'Grasa Corporal', value: `${current}%`, why, action, trend: t, severity }
}

// ─── Steps insight ───
function stepsInsight(hd: HealthData): MicroInsight | null {
  const entries = last(hd.steps, 7)
  if (entries.length === 0) return null
  const current = entries[entries.length - 1].v

  let why = '', action = '', severity: MicroInsight['severity'] = 'neutral'
  if (current >= 10000) {
    why = `${current.toLocaleString()} pasos — excelente NEAT (termogénesis por actividad no-ejercicio). Quemas ~300-500kcal extra.`
    action = 'Perfecto. El NEAT es el factor #1 más subestimado para perder grasa.'
    severity = 'positive'
  } else if (current >= 7500) {
    why = `${current.toLocaleString()} pasos — buen nivel. Cerca del objetivo de 10k.`
    action = `+${(10000 - current).toLocaleString()} pasos para el óptimo. Camina 15min después de comer.`
    severity = 'neutral'
  } else if (current >= 5000) {
    why = `${current.toLocaleString()} pasos — bajo. El sedentarismo reduce tu metabolismo basal y empeora la sensibilidad a insulina.`
    action = 'Objetivo: 3 caminatas de 10min (post-comida). Sube escaleras. Aparca lejos.'
    severity = 'warning'
  } else {
    why = `${current.toLocaleString()} pasos — muy bajo. Impacto negativo en metabolismo, humor y recuperación muscular.`
    action = 'Urgente: cualquier movimiento cuenta. Pon alarma cada hora para levantarte.'
    severity = 'critical'
  }

  return { metric: 'Pasos', value: current.toLocaleString(), why, action, trend: trend(entries), severity }
}

// ─── Strain insight ───
export function strainInsight(strainScore: number, level: string): MicroInsight {
  let why = '', action = '', severity: MicroInsight['severity'] = 'neutral'
  if (level === 'overreaching') {
    why = `Strain ${strainScore.toFixed(1)}/21 — zona de sobreentrenamiento. Tu cuerpo necesita más tiempo de recuperación del que le estás dando.`
    action = 'Día de descanso obligatorio mañana. Sueño 9h+. Comida extra.'
    severity = 'critical'
  } else if (level === 'high') {
    why = `Strain ${strainScore.toFixed(1)}/21 — sesión intensa registrada. Buena carga si la recuperación acompaña.`
    action = 'Nutrición post-entreno crucial. 40g proteína + carbos en la próxima hora.'
    severity = 'neutral'
  } else if (level === 'moderate') {
    why = `Strain ${strainScore.toFixed(1)}/21 — carga moderada. Buen balance actividad-recuperación.`
    action = 'Puedes añadir más volumen si te sientes bien.'
    severity = 'positive'
  } else {
    why = `Strain ${strainScore.toFixed(1)}/21 — actividad ligera. Tu cuerpo puede manejar más carga.`
    action = 'Buen día para sesión intensa si la recuperación es buena.'
    severity = 'positive'
  }
  return { metric: 'Strain', value: `${strainScore.toFixed(1)}/21`, why, action, trend: 'stable', severity }
}

// ─── Energy Bank insight ───
export function energyInsight(level: number, _status: string): MicroInsight {
  let why = '', action = '', severity: MicroInsight['severity'] = 'neutral'
  if (level >= 85) {
    why = `Energy Bank ${level}% — tu cuerpo está completamente recuperado. Todos los sistemas preparados para rendimiento máximo.`
    action = 'Día óptimo: intenta PRs, añade volumen, entrena sin restricciones.'
    severity = 'positive'
  } else if (level >= 70) {
    why = `Energy Bank ${level}% — bien cargado. Suficiente reserva para una sesión productiva.`
    action = 'Sesión estándar. No fuerces máximos pero puedes progresar normalmente.'
    severity = 'positive'
  } else if (level >= 50) {
    why = `Energy Bank ${level}% — moderado. La fatiga acumulada empieza a notarse.`
    action = 'Reduce volumen un 20%. Técnica > intensidad hoy.'
    severity = 'neutral'
  } else if (level >= 30) {
    why = `Energy Bank ${level}% — bajo. Tu cuerpo está pidiendo recuperación activamente.`
    action = 'Sesión ligera o solo movilidad. Prioriza sueño y nutrición.'
    severity = 'warning'
  } else {
    why = `Energy Bank ${level}% — depleted. Riesgo alto de lesión y rendimiento muy reducido.`
    action = 'Descanso completo. Dormir 9h+. Comida extra rica en carbos. Sin entreno.'
    severity = 'critical'
  }
  return { metric: 'Energy Bank', value: `${level}%`, why, action, trend: level >= 70 ? 'improving' : level < 40 ? 'declining' : 'stable', severity }
}

// ─── ACWR insight ───
export function acwrInsight(acwr: number): MicroInsight {
  let why = '', action = '', severity: MicroInsight['severity'] = 'neutral'
  if (acwr >= 0.8 && acwr <= 1.3) {
    why = `ACWR ${acwr.toFixed(2)} — zona óptima. La carga aguda está equilibrada con la crónica.`
    action = 'Mantén la frecuencia y volumen actuales.'
    severity = 'positive'
  } else if (acwr > 1.3 && acwr <= 1.5) {
    why = `ACWR ${acwr.toFixed(2)} — zona de precaución. Has aumentado la carga más rápido de lo que tu cuerpo ha adaptado.`
    action = 'No añadas más volumen esta semana. Mantén o reduce ligeramente.'
    severity = 'warning'
  } else if (acwr > 1.5) {
    why = `ACWR ${acwr.toFixed(2)} — zona de riesgo. La probabilidad de lesión aumenta exponencialmente por encima de 1.5.`
    action = 'Deload forzado: 50% volumen esta semana. No es negociable.'
    severity = 'critical'
  } else if (acwr < 0.8) {
    why = `ACWR ${acwr.toFixed(2)} — desentrenamiento. Has reducido la carga demasiado o has faltado a sesiones.`
    action = 'Recupera la frecuencia gradualmente. No saltes a volumen alto directamente.'
    severity = 'warning'
  }
  return { metric: 'ACWR', value: acwr.toFixed(2), why, action, trend: acwr >= 0.8 && acwr <= 1.3 ? 'improving' : 'declining', severity }
}

// ─── Generate ALL micro-insights ───
export function generateAllInsights(
  hd: HealthData,
  goalWeight: number,
  strainScore: number,
  strainLevel: string,
  energyLevel: number,
  energyStatus: string,
  acwr: number,
): MicroInsight[] {
  const insights: MicroInsight[] = []

  const w = weightInsight(hd, goalWeight)
  if (w) insights.push(w)
  const s = sleepInsight(hd)
  if (s) insights.push(s)
  const h = hrvInsight(hd)
  if (h) insights.push(h)
  const r = rhrInsight(hd)
  if (r) insights.push(r)
  const bf = bfInsight(hd)
  if (bf) insights.push(bf)
  const st = stepsInsight(hd)
  if (st) insights.push(st)
  insights.push(strainInsight(strainScore, strainLevel))
  insights.push(energyInsight(energyLevel, energyStatus))
  insights.push(acwrInsight(acwr))

  return insights
}
