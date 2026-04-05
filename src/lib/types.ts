// ═══════════════════════════════════════════════════════════
// CORE TYPES — Protocolo Superman
// ═══════════════════════════════════════════════════════════

export interface HealthEntry {
  d: string  // date YYYY-MM-DD
  v: number  // value
}

export interface HealthData {
  [key: string]: HealthEntry[]
}

export interface WorkoutSet {
  w: number  // weight kg
  r: number  // reps
}

export interface WorkoutLog {
  [key: string]: WorkoutSet[]  // key: "YYYY-MM-DD-SPLIT-exerciseIndex"
}

export interface ScannedMeal {
  description: string
  kcal: number
  protein: number
  carbs: number
  fat: number
  confidence: 'high' | 'medium' | 'low'
  notes: string
  date: string
  time: string
  photo?: string
}

export interface MedReport {
  date: string
  filename: string
  analysis: string
}

export interface Plan {
  day: number
  week: number
  phase: number
  phaseName: string
  phaseWeek: number
  split: string
  dayIdx: number
  totalDays: number
  pct: number
}

export interface ReadinessResult {
  score: number
  hrvScore: number
  sleepScore: number
  wakeScore: number
  rhrScore: number
  acwrScore: number
  acwr: number
  acute: number
  chronic: number
  reasons: string[]
}

export interface InjuryResult {
  risk: number
  factors: string[]
  level: 'LOW' | 'MODERATE' | 'HIGH'
}

export type DecisionMode = 'PUSH' | 'NORMAL' | 'REDUCE' | 'RECOVER' | 'DELOAD' | 'PROTECT'

export interface DecisionResult {
  action: string
  mode: DecisionMode
  details: string
  mods: string[]
  recovery: string[]
  reasons: string[]
}

export interface ACWRResult {
  acwr: number
  acwrScore: number
  acute: number
  chronic: number
}

export interface WeightTrend {
  current: number
  weeklyChange: number
  projected4w: number
}

export interface PredictionResult {
  lifts: Record<string, { d: string; e1rm: number; w: number; r: number }[]>
  weightTrend: WeightTrend | null
}

export interface BloodWork {
  wk: number
  label: string
  markers: string
}

export interface BloodResult {
  next: BloodWork
  weeksUntil: number
  overdue: boolean
  lastDate: string | null
}

export interface Exercise {
  n: string   // name
  s: number   // sets
  r: string   // rep range
  t: string   // tag (T-DRIVER, CAVILL, etc.)
}

export interface Supplement {
  n: string   // name
  d: string   // dosage
  ev: string  // evidence tier
  tb: boolean // testosterone booster
  ph: number  // phase when introduced
  timing: string // when to take
  cycle?: string // cycling instructions
}

export interface HealthCategory {
  id: string
  l: string   // label
  u: string   // unit
  c: string   // color
}

export type TabId = 'cmd' | 'combat' | 'fuel' | 'recon' | 'intel'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}
