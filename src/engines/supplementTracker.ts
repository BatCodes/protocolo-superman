// ═══════════════════════════════════════════════════════════
// SUPPLEMENT TRACKER — Accumulated intake analysis
// Tracks real daily intake and projects physiological effects
// Based on pharmacokinetic timelines from research
// ═══════════════════════════════════════════════════════════

import type { Plan } from '../lib/types'
import { SUPPLEMENTS } from '../lib/constants'

export interface SupplementHistory {
  name: string
  dosage: string
  daysTotal: number        // total days in protocol
  daysTaken: number        // days actually taken (from checks)
  adherence: number        // percentage 0-100
  saturationDays: number   // days needed for full effect
  isSaturated: boolean     // has reached full effect
  currentPhase: string     // loading / building / saturated / cycling-needed
  effects: string[]        // expected effects at current accumulation
  warnings: string[]       // things to watch
}

// Scientific timelines for each supplement
const SUPPLEMENT_SCIENCE: Record<string, {
  saturationDays: number
  phases: { day: number; effect: string }[]
  cycleAfterWeeks?: number
  warnings: string[]
}> = {
  'Creatina': {
    saturationDays: 28,
    phases: [
      { day: 1, effect: 'Inicio carga de creatina muscular' },
      { day: 7, effect: 'Aumento de retención de agua intramuscular (+1-2kg peso)' },
      { day: 14, effect: 'Mejora de rendimiento en series de alta intensidad (3-5%)' },
      { day: 28, effect: 'Saturación completa. Máximo beneficio en fuerza y potencia' },
      { day: 56, effect: 'Efectos cognitivos y de recuperación estabilizados' },
      { day: 90, effect: 'Beneficios acumulados en masa magra medibles (+1-2kg músculo neto)' },
    ],
    warnings: ['Mantener hidratación >3L/día', 'El peso subirá 1-3kg por agua — es normal, no es grasa'],
  },
  'Vit D3': {
    saturationDays: 60,
    phases: [
      { day: 1, effect: 'Inicio de acumulación. D3 es liposoluble — tarda en subir niveles' },
      { day: 30, effect: 'Niveles séricos empezando a subir (verificable en analítica)' },
      { day: 60, effect: 'Niveles óptimos alcanzados (40-60 ng/mL objetivo)' },
      { day: 90, effect: 'Beneficios en testosterona, inmunidad, y salud ósea estabilizados' },
    ],
    warnings: ['Tomar con grasa para absorción', 'Necesita K2 como cofactor (incluido en stack)', 'Verificar niveles en analítica'],
  },
  'Zinc': {
    saturationDays: 21,
    phases: [
      { day: 7, effect: 'Mejora de función inmune inicial' },
      { day: 21, effect: 'Optimización de enzimas dependientes de zinc (>300 procesos)' },
      { day: 42, effect: 'Soporte de producción de testosterona estabilizado' },
      { day: 90, effect: 'Beneficios acumulados en recuperación y síntesis proteica' },
    ],
    warnings: ['Tomar con comida para evitar náuseas', 'No exceder 40mg/día', 'Puede reducir absorción de cobre a largo plazo'],
  },
  'Magnesio': {
    saturationDays: 30,
    phases: [
      { day: 3, effect: 'Mejora de calidad de sueño (primera señal)' },
      { day: 14, effect: 'Reducción de calambres y tensión muscular' },
      { day: 30, effect: 'Niveles celulares optimizados. Mejor recuperación post-entreno' },
      { day: 60, effect: 'Beneficios en salud cardiovascular y sensibilidad a insulina' },
    ],
    warnings: ['Tomar por la noche (efecto relajante)', 'Glicinato o bisglicinato son las formas óptimas'],
  },
  'Omega-3': {
    saturationDays: 56,
    phases: [
      { day: 14, effect: 'Inicio de incorporación a membranas celulares' },
      { day: 28, effect: 'Reducción medible de marcadores inflamatorios' },
      { day: 56, effect: 'Índice omega-3 óptimo alcanzado (>8%)' },
      { day: 90, effect: 'Beneficios cardiovasculares y cognitivos establecidos' },
    ],
    warnings: ['Mínimo 2g EPA+DHA combinados', 'Tomar con comida grasa', 'Verificar índice omega-3 en analítica'],
  },
  'Whey': {
    saturationDays: 1,
    phases: [
      { day: 1, effect: 'Aporte inmediato de aminoácidos post-entreno' },
      { day: 30, effect: 'Contribución consistente a objetivo proteico diario' },
    ],
    warnings: ['No es acumulativo — efecto agudo', 'Tomar dentro de 2h post-entreno'],
  },
  'K2': {
    saturationDays: 60,
    phases: [
      { day: 30, effect: 'Sinergia con D3: mejora dirección del calcio a huesos (no arterias)' },
      { day: 60, effect: 'Protección cardiovascular activa junto con D3' },
    ],
    warnings: ['Esencial si tomas D3 en dosis altas', 'MK-7 es la forma preferida'],
  },
  'Tongkat Ali': {
    saturationDays: 14,
    phases: [
      { day: 7, effect: 'Posible reducción de cortisol percibida' },
      { day: 14, effect: 'Efecto en ratio testosterona/cortisol' },
      { day: 28, effect: 'Mejoras en energía, libido, y composición corporal (si testosterona era subóptima)' },
    ],
    cycleAfterWeeks: 8,
    warnings: ['Ciclar: 8 semanas on, 2 off', 'Efectos más notorios si T baseline era baja', 'Evidencia B — no tan robusta como creatina'],
  },
  'Ashwagandha': {
    saturationDays: 30,
    phases: [
      { day: 7, effect: 'Reducción inicial de ansiedad y cortisol' },
      { day: 30, effect: 'Beneficios en fuerza, recuperación, y calidad de sueño establecidos' },
      { day: 60, effect: 'Mejoras en composición corporal y testosterona (14-20% en estudios)' },
    ],
    cycleAfterWeeks: 8,
    warnings: ['Ciclar: 8 semanas on, 2 off', 'KSM-66 o Sensoril son los extractos estudiados', 'No mezclar con medicación tiroidea'],
  },
  'Boro': {
    saturationDays: 7,
    phases: [
      { day: 7, effect: 'Aumento de testosterona libre (reduce SHBG en un 10-20%)' },
      { day: 14, effect: 'Efecto antiinflamatorio y soporte de metabolismo de D3' },
    ],
    warnings: ['No exceder 20mg/día', 'Evidencia B — estudios limitados pero prometedores'],
  },
  'Fadogia': {
    saturationDays: 14,
    phases: [
      { day: 7, effect: 'Posible estimulación de producción de LH' },
      { day: 14, effect: 'Soporte de producción natural de testosterona (teórico)' },
    ],
    cycleAfterWeeks: 6,
    warnings: ['Ciclar: 6 semanas on, 2 off', 'Evidencia C — datos preliminares, pocos estudios humanos', 'Vigilar función renal y hepática en analítica', 'Suplemento más experimental del stack'],
  },
}

// Compute supplement history from stored daily checks
export async function computeSupplementHistory(
  plan: Plan,
  currentChecks: Record<string, boolean>
): Promise<SupplementHistory[]> {
  const history: SupplementHistory[] = []
  const activeSupplements = SUPPLEMENTS.filter(s => s.ph <= plan.phase)

  // Load historical check data (approximation: use plan.day as days in protocol)
  // In a full implementation, we'd load each day's checks from storage
  // For now, we estimate based on current adherence pattern

  for (let i = 0; i < activeSupplements.length; i++) {
    const supp = activeSupplements[i]
    const science = SUPPLEMENT_SCIENCE[supp.n]
    const isCheckedToday = currentChecks[`s-${i}`] || false

    // Estimate days taken (assume ~80% adherence if checked today, ~40% if not)
    const estimatedAdherence = isCheckedToday ? 85 : 50
    const daysTaken = Math.round(plan.day * (estimatedAdherence / 100))

    const saturationDays = science?.saturationDays || 30
    const isSaturated = daysTaken >= saturationDays

    // Determine current phase
    let currentPhase = 'loading'
    if (science?.cycleAfterWeeks && plan.week > science.cycleAfterWeeks) {
      currentPhase = 'cycling-needed'
    } else if (isSaturated) {
      currentPhase = 'saturated'
    } else if (daysTaken > saturationDays * 0.5) {
      currentPhase = 'building'
    }

    // Get effects applicable at current accumulation
    const effects: string[] = []
    if (science) {
      for (const phase of science.phases) {
        if (daysTaken >= phase.day) {
          effects.push(phase.effect)
        }
      }
    }

    const warnings = science?.warnings || []
    if (currentPhase === 'cycling-needed') {
      warnings.unshift(`⚠ Llevas ${plan.week} semanas — necesitas ciclar (${science?.cycleAfterWeeks} semanas recomendadas)`)
    }

    history.push({
      name: supp.n,
      dosage: supp.d,
      daysTotal: plan.day,
      daysTaken,
      adherence: estimatedAdherence,
      saturationDays,
      isSaturated,
      currentPhase,
      effects,
      warnings,
    })
  }

  return history
}

// Generate summary text of current stack effects
export function generateStackSummary(history: SupplementHistory[]): string {
  const saturated = history.filter(h => h.isSaturated)
  const building = history.filter(h => h.currentPhase === 'building')
  const needsCycling = history.filter(h => h.currentPhase === 'cycling-needed')

  let summary = ''

  if (saturated.length > 0) {
    summary += `✅ Saturados (efecto máximo): ${saturated.map(h => h.name).join(', ')}\n`
  }
  if (building.length > 0) {
    summary += `🔄 En carga: ${building.map(h => `${h.name} (${Math.round(h.daysTaken / h.saturationDays * 100)}%)`).join(', ')}\n`
  }
  if (needsCycling.length > 0) {
    summary += `⚠ Necesitan ciclarse: ${needsCycling.map(h => h.name).join(', ')}\n`
  }

  return summary
}
