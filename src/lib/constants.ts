import type { Exercise, Supplement, HealthCategory, BloodWork } from './types'

// ═══════════════════════════════════════════════════════════
// THEME
// ═══════════════════════════════════════════════════════════
export const theme = {
  gold: '#c9a227',
  bg: '#050505',
  card: '#0d0d0d',
  border: '#1a1a1a',
  surface: '#111111',
  red: '#dc2626',
  green: '#16a34a',
  cyan: '#06b6d4',
  orange: '#ea580c',
  purple: '#8b5cf6',
  text: '#e4e4e7',
  muted: '#71717a',
  dim: '#3f3f46',
  blue: '#3b82f6',
} as const

// ═══════════════════════════════════════════════════════════
// TRAINING SPLITS
// ═══════════════════════════════════════════════════════════
export const WORKOUTS: Record<string, Exercise[]> = {
  PUSH: [
    { n: 'Bench Press', s: 4, r: '5-8', t: 'T-DRIVER' },
    { n: 'OHP', s: 4, r: '5-8', t: 'T-DRIVER' },
    { n: 'Incline DB Press', s: 4, r: '8-10', t: 'CAVILL' },
    { n: 'Weighted Dips', s: 3, r: '8-12', t: 'CAVILL' },
    { n: 'Lateral Raise', s: 4, r: '12-15', t: 'CAVILL' },
    { n: 'Tricep Ext', s: 3, r: '10-12', t: '' },
    { n: 'Chest Fly', s: 3, r: '12-15', t: '' },
  ],
  PULL: [
    { n: 'Deadlift', s: 4, r: '3-5', t: 'T-DRIVER' },
    { n: 'Barbell Row', s: 4, r: '6-8', t: 'T-DRIVER' },
    { n: 'Weighted Pull-ups', s: 4, r: '6-10', t: 'T-DRIVER' },
    { n: 'Face Pulls', s: 4, r: '15-20', t: '' },
    { n: 'Heavy Shrugs', s: 4, r: '8-12', t: 'CAVILL' },
    { n: 'BB Curl', s: 3, r: '8-12', t: '' },
    { n: 'Hammer Curl', s: 3, r: '10-12', t: '' },
  ],
  LEGS: [
    { n: 'Back Squat', s: 5, r: '5-8', t: 'T-DRIVER' },
    { n: 'RDL', s: 4, r: '8-10', t: 'T-DRIVER' },
    { n: 'Leg Press', s: 4, r: '10-12', t: '' },
    { n: 'Lunges', s: 3, r: '12/leg', t: '' },
    { n: 'Leg Curl', s: 3, r: '10-12', t: '' },
    { n: 'Calf Raise', s: 5, r: '12-15', t: '' },
    { n: 'Hanging Leg Raise', s: 3, r: '12-15', t: '' },
  ],
  REST: [],
}

export const SPLITS = ['PUSH', 'PULL', 'LEGS', 'PUSH', 'PULL', 'LEGS', 'REST'] as const
export const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const

// ═══════════════════════════════════════════════════════════
// SUPPLEMENTS
// ═══════════════════════════════════════════════════════════
export const SUPPLEMENTS: Supplement[] = [
  { n: 'Creatina', d: '5g', ev: 'A', tb: false, ph: 1 },
  { n: 'Vit D3', d: '5000IU', ev: 'A', tb: true, ph: 1 },
  { n: 'Zinc', d: '30mg', ev: 'A', tb: true, ph: 1 },
  { n: 'Magnesio', d: '400mg', ev: 'A', tb: true, ph: 1 },
  { n: 'Omega-3', d: '3g', ev: 'A', tb: false, ph: 1 },
  { n: 'Whey', d: '40g', ev: 'A', tb: false, ph: 1 },
  { n: 'K2', d: '200mcg', ev: 'A', tb: false, ph: 1 },
  { n: 'Tongkat Ali', d: '400mg', ev: 'B', tb: true, ph: 2 },
  { n: 'Ashwagandha', d: '600mg', ev: 'A', tb: true, ph: 2 },
  { n: 'Boro', d: '10mg', ev: 'B', tb: true, ph: 2 },
  { n: 'Fadogia', d: '600mg', ev: 'C', tb: true, ph: 3 },
]

// ═══════════════════════════════════════════════════════════
// HEALTH CATEGORIES
// ═══════════════════════════════════════════════════════════
export const HEALTH_CATEGORIES: HealthCategory[] = [
  { id: 'weight', l: 'Peso', u: 'kg', c: theme.gold },
  { id: 'bf', l: 'Grasa', u: '%', c: theme.orange },
  { id: 'muscle', l: 'Músculo', u: '%', c: theme.green },
  { id: 'rhr', l: 'FC Reposo', u: 'bpm', c: theme.red },
  { id: 'hrv', l: 'HRV', u: 'ms', c: theme.cyan },
  { id: 'sleep', l: 'Sueño', u: 'h', c: theme.purple },
  { id: 'bed_time', l: 'H.Dormir', u: 'h', c: theme.purple },
  { id: 'wake_time', l: 'H.Despertar', u: 'h', c: theme.gold },
  { id: 'steps', l: 'Pasos', u: '', c: theme.green },
  { id: 'spo2', l: 'SpO2', u: '%', c: theme.cyan },
  { id: 'temp', l: 'Temp', u: '°C', c: theme.orange },
  { id: 'water', l: 'Agua', u: 'L', c: theme.blue },
  { id: 'bp_sys', l: 'PA Sis', u: 'mmHg', c: theme.red },
  { id: 'resp', l: 'F.Resp', u: '/min', c: theme.cyan },
  { id: 'vo2', l: 'VO2', u: 'ml/kg', c: theme.green },
  { id: 'energy', l: 'E.Activa', u: 'kcal', c: theme.orange },
]

// ═══════════════════════════════════════════════════════════
// BLOOD WORK SCHEDULE
// ═══════════════════════════════════════════════════════════
export const BLOOD_SCHEDULE: BloodWork[] = [
  { wk: 10, label: 'Baseline #1', markers: 'T total, T libre, SHBG, E2, LH, FSH, prolactina, TSH, T3/T4, ferritina, B12, vit D, CBC, lípidos, glucosa, HbA1c' },
  { wk: 24, label: 'Validación Mass I', markers: 'T total, T libre, SHBG, E2, CBC, lípidos, hígado AST/ALT, creatinina' },
  { wk: 48, label: 'Pico Mass II', markers: 'Panel completo + IGF-1, cortisol AM, DHEA-S, insulina ayunas' },
  { wk: 70, label: 'Monitor Cut', markers: 'T total, T libre, E2, TSH, T3, cortisol, CBC, lípidos, ferritina' },
]

// ═══════════════════════════════════════════════════════════
// AI SYSTEM PROMPT
// ═══════════════════════════════════════════════════════════
export const AI_SYSTEM_PROMPT = `Eres el SISTEMA DE INTELIGENCIA del PROTOCOLO SUPERMAN. Plataforma autónoma de nivel élite militar.
SUJETO: Hombre 28a, 179cm, ~72kg→85kg objetivo. Principiante. Halal. Cataluña.
PROTOCOLO: 4 fases, PPL 6d, sin límite tiempo gym, surplus agresivo, resultados ASAP.
ERES PROACTIVO: Analizas datos, detectas problemas, prescribes acciones. Como oficial de inteligencia que briefea al comandante.
TIENES ACCESO A: Readiness Score, ACWR, Injury Risk, todas las métricas Apple Health, workout logs, meals escaneadas, analíticas.
REGLAS: Español. Directo. Evidencia A/B/C. No TRT/SARMs. Formato briefing militar. Cada recomendación con WHY explícito.`

// ═══════════════════════════════════════════════════════════
// NAVIGATION TABS
// ═══════════════════════════════════════════════════════════
export const TABS = [
  { id: 'cmd' as const, icon: '⚡', label: 'SITREP' },
  { id: 'combat' as const, icon: '🏋️', label: 'COMBAT' },
  { id: 'fuel' as const, icon: '📸', label: 'FUEL' },
  { id: 'recon' as const, icon: '❤️', label: 'RECON' },
  { id: 'intel' as const, icon: '🎖️', label: 'INTEL' },
] as const

// ═══════════════════════════════════════════════════════════
// DAILY MEAL SCHEDULE
// ═══════════════════════════════════════════════════════════
export const DAILY_MEALS = [
  { time: '7:00', title: 'Despertar', desc: 'Exposición solar 10min. Pesar en ayunas.', icon: '☀️', type: 'routine' as const },
  { time: '7:30', title: 'Meal 1 — Desayuno', desc: 'Huevos + ghee + plátano. Stack AM: D3, Zinc, Omega-3, Creatina.', icon: '🍳', type: 'meal' as const },
  { time: '10:30', title: 'Meal 2 — Media mañana', desc: 'Arroz + pollo + ajo + cúrcuma', icon: '🍗', type: 'meal' as const },
  { time: '13:30', title: 'Meal 3 — Almuerzo', desc: 'Boniato + carne picada halal', icon: '🥩', type: 'meal' as const },
  { time: '15:30', title: 'Pre-Workout', desc: 'Avena + whey + miel. Preparar sesión.', icon: '⚡', type: 'meal' as const },
  { time: '16:00', title: 'Entrenamiento', desc: 'Sesión de entreno. Sin límite de tiempo.', icon: '🏋️', type: 'routine' as const },
  { time: '19:00', title: 'Meal 4 — Post-WO', desc: 'Whey + arroz + pollo. Ventana anabólica.', icon: '🍚', type: 'meal' as const },
  { time: '19:30', title: 'Sauna', desc: 'Protocolo térmico post-entreno.', icon: '🔥', type: 'routine' as const },
  { time: '21:00', title: 'Toque de queda', desc: 'Sin pantallas. Preparar sueño.', icon: '📱', type: 'routine' as const },
  { time: '22:00', title: 'Meal 5 — Pre-bed', desc: 'Yogur + almendras + Mg. Stack PM.', icon: '🌙', type: 'meal' as const },
  { time: '22:30', title: 'Lights Out', desc: 'Objetivo: dormido antes de 23:00.', icon: '💤', type: 'routine' as const },
]

// Quick prompts for Intel tab
export const QUICK_PROMPTS = [
  'Adapta: no pude entrenar',
  'Plan de recuperación semanal',
  '¿Listo para cambiar de fase?',
  'Análisis de progreso completo',
  'Mi readiness es baja, ¿por qué?',
  '¿Qué analítica pedir ahora?',
  'Review semanal',
  '¿Cómo acelerar resultados?',
]
