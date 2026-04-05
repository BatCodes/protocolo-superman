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
  // FASE 1 (Sem 1-12)
  { n: 'Creatina Monohidrato', d: '5g', ev: 'A', tb: false, ph: 1, timing: 'Cualquier hora' },
  { n: 'Whey Protein Halal', d: '1-2 scoops', ev: 'A', tb: false, ph: 1, timing: 'Post-entreno' },
  { n: 'Vitamina D3', d: '5000 IU', ev: 'A', tb: true, ph: 1, timing: 'Mañana con grasa' },
  { n: 'Omega-3 EPA/DHA', d: '3g', ev: 'A', tb: false, ph: 1, timing: 'Con comidas' },
  { n: 'Magnesio Glicinato', d: '400-500mg', ev: 'A', tb: true, ph: 1, timing: 'Antes de dormir' },
  { n: 'Zinc Picolinato', d: '30mg', ev: 'A', tb: true, ph: 1, timing: 'Antes de dormir' },
  { n: 'Boro', d: '10mg', ev: 'B', tb: true, ph: 1, timing: 'Mañana' },
  { n: 'Ashwagandha KSM-66', d: '600mg', ev: 'A', tb: true, ph: 1, timing: 'Mañana' },
  { n: 'Vitamina K2 MK-7', d: '200mcg', ev: 'A', tb: false, ph: 1, timing: 'Con Vit D3' },
  // FASE 2 (Sem 13-30) — adds these
  { n: 'Tongkat Ali', d: '400mg', ev: 'B', tb: true, ph: 2, timing: 'Mañana' },
  { n: 'Fadogia Agrestis', d: '600mg', ev: 'C', tb: true, ph: 2, timing: 'Mañana', cycle: '8 semanas on / 4 off' },
  { n: 'DIM', d: '200mg', ev: 'B', tb: true, ph: 2, timing: 'Con cena' },
  // FASE 3 (Sem 31-60) — adds these
  { n: 'Caseína Halal', d: '1 scoop', ev: 'A', tb: false, ph: 3, timing: 'Antes de dormir' },
  { n: 'Fenogreco', d: '500mg', ev: 'B', tb: true, ph: 3, timing: 'Con comida' },
  { n: 'Citrulina Malato', d: '8g', ev: 'A', tb: false, ph: 3, timing: 'Pre-entreno' },
  { n: 'Shilajit', d: '500mg', ev: 'B', tb: true, ph: 3, timing: 'Mañana' },
  // FASE 4 - CUT (Sem 61-76) — adds these
  { n: 'L-Carnitina L-Tartrato', d: '2g', ev: 'A', tb: false, ph: 4, timing: 'Mañana' },
  { n: 'Cafeína', d: '200mg', ev: 'A', tb: false, ph: 4, timing: 'Pre-entreno (antes 14h)' },
  { n: 'Fosfatidilserina', d: '600mg', ev: 'B', tb: false, ph: 4, timing: 'Post-entreno' },
]

// ═══════════════════════════════════════════════════════════
// HEALTH CATEGORIES — 30+ body metrics
// ═══════════════════════════════════════════════════════════
export const HEALTH_CATEGORY_GROUPS = [
  {
    group: 'Composici\u00f3n Corporal',
    categories: [
      { id: 'weight', l: 'Peso', u: 'kg', c: '#ffd60a' },
      { id: 'bf', l: 'Grasa Corporal', u: '%', c: '#ff9f0a' },
      { id: 'muscle', l: 'Masa Muscular', u: '%', c: '#30d158' },
      { id: 'bone_mass', l: 'Masa \u00d3sea', u: 'kg', c: '#8e8e93' },
      { id: 'water_body', l: 'Agua Corporal', u: '%', c: '#64d2ff' },
      { id: 'visceral_fat', l: 'Grasa Visceral', u: 'nivel', c: '#ff453a' },
      { id: 'bmr', l: 'Metabolismo Basal', u: 'kcal', c: '#ff9f0a' },
      { id: 'bmi', l: 'IMC', u: '', c: '#8e8e93' },
    ],
  },
  {
    group: 'An\u00e1lisis Segmental',
    categories: [
      { id: 'muscle_arm_r', l: 'M\u00fasculo Brazo D', u: 'kg', c: '#30d158' },
      { id: 'muscle_arm_l', l: 'M\u00fasculo Brazo I', u: 'kg', c: '#30d158' },
      { id: 'muscle_trunk', l: 'M\u00fasculo Tronco', u: 'kg', c: '#30d158' },
      { id: 'muscle_leg_r', l: 'M\u00fasculo Pierna D', u: 'kg', c: '#30d158' },
      { id: 'muscle_leg_l', l: 'M\u00fasculo Pierna I', u: 'kg', c: '#30d158' },
      { id: 'fat_arm_r', l: 'Grasa Brazo D', u: '%', c: '#ff9f0a' },
      { id: 'fat_arm_l', l: 'Grasa Brazo I', u: '%', c: '#ff9f0a' },
      { id: 'fat_trunk', l: 'Grasa Tronco', u: '%', c: '#ff9f0a' },
      { id: 'fat_leg_r', l: 'Grasa Pierna D', u: '%', c: '#ff9f0a' },
      { id: 'fat_leg_l', l: 'Grasa Pierna I', u: '%', c: '#ff9f0a' },
    ],
  },
  {
    group: 'Cardiovascular',
    categories: [
      { id: 'rhr', l: 'FC Reposo', u: 'bpm', c: '#ff453a' },
      { id: 'hrv', l: 'HRV', u: 'ms', c: '#64d2ff' },
      { id: 'spo2', l: 'SpO2', u: '%', c: '#64d2ff' },
      { id: 'bp_sys', l: 'PA Sist\u00f3lica', u: 'mmHg', c: '#ff453a' },
      { id: 'bp_dia', l: 'PA Diast\u00f3lica', u: 'mmHg', c: '#ff453a' },
      { id: 'vo2', l: 'VO2 max', u: 'ml/kg', c: '#30d158' },
      { id: 'resp', l: 'Freq. Respiratoria', u: '/min', c: '#64d2ff' },
    ],
  },
  {
    group: 'Sue\u00f1o y Recuperaci\u00f3n',
    categories: [
      { id: 'sleep', l: 'Horas de Sue\u00f1o', u: 'h', c: '#bf5af2' },
      { id: 'bed_time', l: 'Hora Dormir', u: 'h', c: '#bf5af2' },
      { id: 'wake_time', l: 'Hora Despertar', u: 'h', c: '#ffd60a' },
      { id: 'temp', l: 'Temperatura', u: '\u00b0C', c: '#ff9f0a' },
    ],
  },
  {
    group: 'Actividad y Nutrici\u00f3n',
    categories: [
      { id: 'steps', l: 'Pasos', u: '', c: '#30d158' },
      { id: 'energy', l: 'Energ\u00eda Activa', u: 'kcal', c: '#ff9f0a' },
      { id: 'water', l: 'Agua', u: 'L', c: '#64d2ff' },
      { id: 'waist', l: 'Cintura', u: 'cm', c: '#8e8e93' },
      { id: 'hip', l: 'Cadera', u: 'cm', c: '#8e8e93' },
      { id: 'body_protein', l: 'Prote\u00edna Corporal', u: 'kg', c: '#bf5af2' },
      { id: 'mineral_mass', l: 'Masa Mineral', u: 'kg', c: '#8e8e93' },
    ],
  },
] as const

// Flat list for backward compatibility
export const HEALTH_CATEGORIES: HealthCategory[] = HEALTH_CATEGORY_GROUPS.flatMap(g =>
  g.categories.map(c => ({ ...c }))
)

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
