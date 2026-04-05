// ═══════════════════════════════════════════════════════════
// DIGITAL TWIN — AI-powered personalized health intelligence
// Generates: insights, weekly reports, action programs
// ═══════════════════════════════════════════════════════════

import type { HealthData, WorkoutLog, HealthEntry } from '../lib/types'
import type { HealthScoreBreakdown } from './healthScore'
import type { Plan } from '../lib/types'
import type { ReadinessResult } from '../lib/types'
import type { UserProfile } from '../lib/profile'

const NOW = new Date()

function last(arr: HealthEntry[] | undefined, days: number): HealthEntry[] {
  return (arr || []).filter(e => (NOW.getTime() - new Date(e.d).getTime()) / 864e5 <= days)
}

function avg(entries: HealthEntry[]): number {
  if (entries.length === 0) return 0
  return entries.reduce((a, e) => a + e.v, 0) / entries.length
}

function trend(entries: HealthEntry[]): 'up' | 'down' | 'stable' {
  if (entries.length < 4) return 'stable'
  const recent = avg(entries.slice(-3))
  const older = avg(entries.slice(-6, -3))
  if (recent > older * 1.03) return 'up'
  if (recent < older * 0.97) return 'down'
  return 'stable'
}

// ─── Personalized Insights ───
export interface Insight {
  id: string
  type: 'warning' | 'positive' | 'action' | 'info'
  title: string
  body: string
  metric?: string
  priority: number  // 1 = highest
}

export function generateInsights(
  hd: HealthData,
  wkLog: WorkoutLog,
  healthScore: HealthScoreBreakdown,
  readiness: ReadinessResult,
  plan: Plan,
): Insight[] {
  const insights: Insight[] = []

  // ── Sleep debt detection ──
  const sleep7 = last(hd.sleep, 7)
  const badNights = sleep7.filter(e => e.v < 7).length
  if (badNights >= 3) {
    insights.push({
      id: 'sleep-debt',
      type: 'warning',
      title: 'Deuda de sueño acumulada',
      body: `${badNights} de las últimas 7 noches has dormido menos de 7h. Esto reduce tu testosterona, recuperación muscular y rendimiento cognitivo. Prioriza dormir 30min más los próximos 3 días.`,
      metric: `${badNights}/7 noches <7h`,
      priority: 1,
    })
  }

  // ── HRV suppression ──
  const hrv14 = last(hd.hrv, 14)
  const hrv3 = last(hd.hrv, 3)
  if (hrv14.length >= 5 && hrv3.length >= 1) {
    const baseline = avg(hrv14)
    const current = hrv3[hrv3.length - 1].v
    const drop = ((baseline - current) / baseline) * 100
    if (drop > 15) {
      insights.push({
        id: 'hrv-drop',
        type: 'warning',
        title: `HRV bajó ${Math.round(drop)}% desde tu baseline`,
        body: 'Tu sistema nervioso autónomo muestra señales de estrés acumulado. Tu cuerpo necesita recuperación activa — reduce intensidad hoy, prioriza sueño y nutrición.',
        metric: `${current}ms vs ${Math.round(baseline)}ms baseline`,
        priority: 1,
      })
    } else if (drop < -10) {
      insights.push({
        id: 'hrv-up',
        type: 'positive',
        title: `HRV subió ${Math.round(-drop)}% por encima del baseline`,
        body: 'Tu recuperación está en un punto alto. Es un buen día para intentar PRs o añadir volumen extra.',
        metric: `${current}ms — por encima del baseline`,
        priority: 3,
      })
    }
  }

  // ── Muscle imbalance (segmental) ──
  // If we had segmental data, we'd detect imbalances here
  // For now, check workout balance
  const pushDays = Object.keys(wkLog).filter(k => k.includes('-PUSH-')).length
  const pullDays = Object.keys(wkLog).filter(k => k.includes('-PULL-')).length
  const legDays = Object.keys(wkLog).filter(k => k.includes('-LEGS-')).length
  if (pushDays > 0 && pullDays > 0 && legDays > 0) {
    const minSplit = Math.min(pushDays, pullDays, legDays)
    const maxSplit = Math.max(pushDays, pullDays, legDays)
    if (maxSplit > minSplit * 1.5) {
      const weakest = pushDays === minSplit ? 'PUSH' : pullDays === minSplit ? 'PULL' : 'LEGS'
      insights.push({
        id: 'split-imbalance',
        type: 'action',
        title: `Desbalance en entrenamiento: ${weakest} retrasado`,
        body: `Tienes ${pushDays} sesiones de PUSH, ${pullDays} de PULL, y ${legDays} de LEGS en tus registros. ${weakest} necesita más atención para un desarrollo equilibrado.`,
        priority: 2,
      })
    }
  }

  // ── Weight stall ──
  const weight30 = last(hd.weight, 30)
  if (weight30.length >= 6) {
    const t = trend(weight30)
    if (t === 'stable' && plan.phase <= 3) {
      insights.push({
        id: 'weight-stall',
        type: 'action',
        title: 'Peso estancado — ajustar surplus',
        body: 'Tu peso lleva 4+ semanas sin cambio significativo. En fase de masa necesitas un surplus consistente. Añade 200-300kcal/día o revisa tu tracking de comidas.',
        metric: `${weight30[weight30.length-1].v}kg — estable`,
        priority: 2,
      })
    } else if (t === 'up' && plan.phase <= 3) {
      insights.push({
        id: 'weight-gain',
        type: 'positive',
        title: 'Progreso de peso activo',
        body: `Ganando peso de forma consistente — verifica que la ganancia sea mayormente muscular revisando tu % de grasa corporal.`,
        priority: 4,
      })
    }
  }

  // ── RHR elevation ──
  const rhr7 = last(hd.rhr, 7)
  const rhr30 = last(hd.rhr, 30)
  if (rhr7.length > 0 && rhr30.length >= 7) {
    const current = rhr7[rhr7.length - 1].v
    const baseline = avg(rhr30)
    if (current > baseline + 5) {
      insights.push({
        id: 'rhr-elevated',
        type: 'warning',
        title: 'FC reposo elevada — posible sobreentrenamiento',
        body: `Tu FC en reposo está ${Math.round(current - baseline)}bpm por encima de tu baseline. Señales posibles: estrés acumulado, infección incipiente, o falta de recuperación. Considera un día de descanso activo.`,
        metric: `${current}bpm vs ${Math.round(baseline)}bpm baseline`,
        priority: 1,
      })
    }
  }

  // ── Readiness pattern ──
  if (readiness.score < 50) {
    insights.push({
      id: 'readiness-low',
      type: 'warning',
      title: 'Readiness por debajo del 50%',
      body: 'Múltiples indicadores sugieren que tu cuerpo no está recuperado. Reduce la intensidad del entreno, prioriza nutrición y sueño.',
      metric: `${readiness.score}/100`,
      priority: 1,
    })
  } else if (readiness.score >= 85) {
    insights.push({
      id: 'readiness-peak',
      type: 'positive',
      title: 'Readiness en zona peak',
      body: 'Todos los indicadores están alineados — es un día óptimo para intentar PRs o aumentar volumen.',
      metric: `${readiness.score}/100`,
      priority: 3,
    })
  }

  // ── Water tracking ──
  const water = last(hd.water, 7)
  if (water.length > 0) {
    const avgWater = avg(water)
    if (avgWater < 2.5) {
      insights.push({
        id: 'hydration',
        type: 'action',
        title: 'Hidratación insuficiente',
        body: `Media de ${avgWater.toFixed(1)}L/día en la última semana. Objetivo mínimo: 3L para optimizar rendimiento y recuperación. La deshidratación reduce la fuerza un 2-5%.`,
        metric: `${avgWater.toFixed(1)}L/día`,
        priority: 2,
      })
    }
  }

  // ── Phase transition suggestion ──
  if (plan.phase === 1 && plan.week >= 11) {
    insights.push({
      id: 'phase-transition',
      type: 'info',
      title: 'Próxima transición de fase',
      body: `Semana ${plan.week}/12 de Foundation. Prepárate para Mass I — el surplus calórico y la intensidad aumentarán. Asegúrate de tener una analítica baseline reciente.`,
      priority: 3,
    })
  }

  // ── Data completeness ──
  if (healthScore.dataCompleteness < 40) {
    insights.push({
      id: 'data-low',
      type: 'info',
      title: 'Tu Digital Twin necesita más datos',
      body: `Solo tienes ${healthScore.dataCompleteness}% de las métricas registradas. Cuantos más datos registres, más precisas serán las recomendaciones. Prioriza: peso, sueño, HRV, y FC reposo.`,
      priority: 4,
    })
  }

  return insights.sort((a, b) => a.priority - b.priority)
}

// ─── Weekly Report Data ───
export interface WeeklyReport {
  weekNumber: number
  dateRange: string
  healthScore: number
  healthScoreDelta: number  // vs previous week
  summary: string[]
  bodyComposition: { metric: string; value: string; trend: 'up' | 'down' | 'stable' }[]
  sleepAvg: number
  workoutsCompleted: number
  workoutsTarget: number
  topInsight: string
  metabolicAge: number | null
}

export function generateWeeklyReportData(
  hd: HealthData,
  wkLog: WorkoutLog,
  healthScore: HealthScoreBreakdown,
  plan: Plan,
): WeeklyReport {
  const weekNum = plan.week
  const now = new Date()
  const weekStart = new Date(now.getTime() - 6 * 864e5)
  const dateRange = `${weekStart.toLocaleDateString('es', { day: 'numeric', month: 'short' })} — ${now.toLocaleDateString('es', { day: 'numeric', month: 'short' })}`

  const summary: string[] = []
  const bodyComp: WeeklyReport['bodyComposition'] = []

  // Weight
  const weight7 = last(hd.weight, 7)
  if (weight7.length > 0) {
    const t = trend(weight7)
    bodyComp.push({ metric: 'Peso', value: `${weight7[weight7.length-1].v}kg`, trend: t })
    if (t === 'up') summary.push('Peso en aumento — surplus activo')
    else if (t === 'down') summary.push('Peso bajando — revisar ingesta calórica')
  }

  // Body fat
  const bf7 = last(hd.bf, 14)
  if (bf7.length > 0) {
    bodyComp.push({ metric: 'Grasa corporal', value: `${bf7[bf7.length-1].v}%`, trend: trend(bf7) })
  }

  // Muscle
  const muscle7 = last(hd.muscle, 14)
  if (muscle7.length > 0) {
    bodyComp.push({ metric: 'Masa muscular', value: `${muscle7[muscle7.length-1].v}%`, trend: trend(muscle7) })
  }

  // Sleep
  const sleep7 = last(hd.sleep, 7)
  const sleepAvg = sleep7.length > 0 ? avg(sleep7) : 0
  if (sleepAvg > 0) {
    summary.push(sleepAvg >= 7.5 ? `Sueño excelente: ${sleepAvg.toFixed(1)}h media` : `Sueño bajo: ${sleepAvg.toFixed(1)}h — impacta recuperación`)
  }

  // Workouts
  const trainDates = new Set<string>()
  Object.keys(wkLog).forEach(key => {
    const date = key.split('-').slice(0, 3).join('-')
    const d = new Date(date)
    if ((now.getTime() - d.getTime()) / 864e5 <= 7) trainDates.add(date)
  })
  const workoutsCompleted = trainDates.size
  summary.push(`${workoutsCompleted}/6 sesiones completadas`)

  const topInsight = healthScore.insights[0] || 'Registra más datos para insights personalizados'

  return {
    weekNumber: weekNum,
    dateRange,
    healthScore: healthScore.total,
    healthScoreDelta: 0, // Would need previous week's score
    summary,
    bodyComposition: bodyComp,
    sleepAvg,
    workoutsCompleted,
    workoutsTarget: 6,
    topInsight,
    metabolicAge: healthScore.metabolicAge,
  }
}

// ─── AI Prompt Builder for Weekly Report ───
export function buildWeeklyReportPrompt(
  report: WeeklyReport,
  profile: UserProfile | null,
  healthScore: HealthScoreBreakdown,
  insights: Insight[],
): string {
  const profileCtx = profile
    ? `Sujeto: ${profile.sex === 'male' ? 'Hombre' : 'Mujer'} ${profile.age}a, ${profile.height}cm, ${profile.weight}kg→${profile.weightGoal}kg. ${profile.experience}. ${profile.dietaryRestrictions.join(', ') || 'Sin restricciones'}.`
    : 'Sujeto sin perfil completo.'

  return `GENERA UN INFORME SEMANAL DE SALUD.
${profileCtx}
Semana ${report.weekNumber}. ${report.dateRange}.

HEALTH SCORE: ${healthScore.total}/900
- Composición: ${healthScore.composition}/100
- Cardiovascular: ${healthScore.cardiovascular}/100
- Sueño: ${healthScore.sleep}/100
- Recovery: ${healthScore.recovery}/100
- Actividad: ${healthScore.activity}/100
- Nutrición: ${healthScore.nutrition}/100
${healthScore.metabolicAge ? `- Edad metabólica estimada: ${healthScore.metabolicAge} años` : ''}

DATOS:
- Sueño media: ${report.sleepAvg.toFixed(1)}h
- Entrenos: ${report.workoutsCompleted}/${report.workoutsTarget}
- Composición: ${report.bodyComposition.map(b => `${b.metric}: ${b.value} (${b.trend})`).join(', ')}

INSIGHTS DETECTADOS:
${insights.slice(0, 5).map(i => `- [${i.type}] ${i.title}: ${i.body}`).join('\n')}

Formato:
1) Resumen ejecutivo (2-3 frases)
2) Lo que va bien (bullets)
3) Lo que necesita atención (bullets con acciones concretas)
4) Plan de acción para la próxima semana (3-5 acciones priorizadas)
5) Nota motivacional personalizada

Máximo 300 palabras. Español. Directo. Basado en datos.`
}

// ─── Milestones ───
export interface Milestone {
  id: string
  title: string
  target: number
  current: number
  unit: string
  type: 'weight' | 'bf' | 'muscle' | 'custom'
  completed: boolean
  completedDate?: string
}

export function checkMilestones(milestones: Milestone[], hd: HealthData): Milestone[] {
  return milestones.map(m => {
    const entries = hd[m.type === 'weight' ? 'weight' : m.type === 'bf' ? 'bf' : m.type === 'muscle' ? 'muscle' : ''] || []
    if (entries.length === 0) return m

    const current = entries[entries.length - 1].v
    const updated = { ...m, current }

    // Check completion
    if (m.type === 'bf') {
      // For body fat, target is lower
      updated.completed = current <= m.target
    } else {
      // For weight/muscle, target is higher
      updated.completed = current >= m.target
    }

    if (updated.completed && !m.completedDate) {
      updated.completedDate = new Date().toISOString().slice(0, 10)
    }

    return updated
  })
}
