export interface UserProfile {
  name: string
  age: number
  height: number        // cm
  weight: number        // kg current
  weightGoal: number    // kg target
  sex: 'male' | 'female'
  experience: 'beginner' | 'intermediate' | 'advanced'
  dietaryRestrictions: string[]  // e.g. ['halal', 'gluten-free']
  injuries: string[]
  location: string
  startDate: string
}

export const DIETARY_OPTIONS = [
  'Halal', 'Kosher', 'Vegetariano', 'Vegano', 'Sin gluten',
  'Sin lactosa', 'Sin frutos secos', 'Keto', 'Ninguna',
] as const

export const INJURY_OPTIONS = [
  'Hombro', 'Espalda baja', 'Rodilla', 'Muñeca', 'Cuello',
  'Cadera', 'Tobillo', 'Codo', 'Ninguna',
] as const

// Mifflin-St Jeor BMR
function computeBMR(profile: UserProfile): number {
  if (profile.sex === 'male') {
    return 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5
  }
  return 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161
}

export interface MacroTargets {
  kcal: number
  protein: number  // grams
  carbs: number
  fat: number
  water: number    // liters
}

// Compute daily macro targets based on profile, phase, and training day
export function computeMacros(
  profile: UserProfile,
  phase: number,
  isTrainingDay: boolean
): MacroTargets {
  const bmr = computeBMR(profile)
  // Activity multiplier: training days higher
  const activityMult = isTrainingDay ? 1.75 : 1.4

  let tdee = bmr * activityMult

  // Phase-based caloric adjustment
  let surplus: number
  switch (phase) {
    case 1: surplus = isTrainingDay ? 300 : 150; break     // Foundation: moderate surplus
    case 2: surplus = isTrainingDay ? 500 : 300; break     // Mass I: aggressive surplus
    case 3: surplus = isTrainingDay ? 600 : 350; break     // Mass II: max surplus
    case 4: surplus = isTrainingDay ? -300 : -500; break   // Cut: deficit
    default: surplus = 300
  }

  const kcal = Math.round(tdee + surplus)

  // Protein: 2.2g/kg for building, 2.5g/kg for cutting
  const proteinPerKg = phase === 4 ? 2.5 : 2.2
  const protein = Math.round(profile.weight * proteinPerKg)

  // Fat: 25% of calories
  const fat = Math.round((kcal * 0.25) / 9)

  // Carbs: remainder
  const carbs = Math.round((kcal - protein * 4 - fat * 9) / 4)

  // Water: 40ml per kg body weight + 500ml for training
  const water = Math.round((profile.weight * 0.04 + (isTrainingDay ? 0.5 : 0)) * 10) / 10

  return { kcal, protein, carbs, fat, water }
}

export interface MealPlan {
  time: string
  title: string
  desc: string
  icon: string
  type: 'meal' | 'routine'
  kcalPct?: number  // percentage of daily kcal for this meal
}

// Generate dynamic meal plan based on profile and macros
export function generateMealPlan(profile: UserProfile, macros: MacroTargets, isTrainingDay: boolean): MealPlan[] {
  const restrictions = profile.dietaryRestrictions.map(r => r.toLowerCase())
  const isHalal = restrictions.includes('halal')
  const isVeg = restrictions.includes('vegetariano') || restrictions.includes('vegano')
  const isVegan = restrictions.includes('vegano')

  // Protein sources
  const proteinSources = isVegan
    ? ['tofu', 'tempeh', 'legumbres', 'seitán']
    : isVeg
      ? ['huevos', 'yogur griego', 'queso cottage', 'tofu']
      : isHalal
        ? ['pollo halal', 'carne picada halal', 'huevos', 'pescado']
        : ['pollo', 'carne picada', 'huevos', 'pescado', 'ternera']

  const p = proteinSources
  const pGrams = Math.round(macros.protein / 5) // per meal approx

  const plan: MealPlan[] = [
    { time: '7:00', title: 'Despertar', desc: `Exposición solar 10min. Pesar en ayunas.`, icon: '☀️', type: 'routine' },
    { time: '7:30', title: 'Desayuno', desc: `${p[2]} + avena + fruta. Stack AM. ~${pGrams}g proteína.`, icon: '🍳', type: 'meal', kcalPct: 20 },
    { time: '10:30', title: 'Media mañana', desc: `Arroz + ${p[0]} + verduras. ~${pGrams}g proteína.`, icon: '🍗', type: 'meal', kcalPct: 20 },
    { time: '13:30', title: 'Almuerzo', desc: `Boniato + ${p[1]} + ensalada. ~${pGrams}g proteína.`, icon: '🥩', type: 'meal', kcalPct: 20 },
  ]

  if (isTrainingDay) {
    plan.push(
      { time: '15:30', title: 'Pre-Workout', desc: `Avena + whey + miel. ~${pGrams}g proteína.`, icon: '⚡', type: 'meal', kcalPct: 10 },
      { time: '16:00', title: 'Entrenamiento', desc: 'Sesión de entreno.', icon: '🏋️', type: 'routine' },
      { time: '19:00', title: 'Post-Workout', desc: `Whey + arroz + ${p[0]}. Ventana anabólica. ~${pGrams}g proteína.`, icon: '🍚', type: 'meal', kcalPct: 20 },
      { time: '19:30', title: 'Sauna', desc: 'Protocolo térmico post-entreno.', icon: '🔥', type: 'routine' },
    )
  } else {
    plan.push(
      { time: '16:00', title: 'Merienda', desc: `${isVegan ? 'Batido proteína vegetal' : 'Yogur griego'} + frutos secos. ~${pGrams}g proteína.`, icon: '🥜', type: 'meal', kcalPct: 10 },
      { time: '17:00', title: 'Actividad ligera', desc: 'Caminar 30min / movilidad / yoga.', icon: '🚶', type: 'routine' },
    )
  }

  plan.push(
    { time: '21:00', title: 'Toque de queda', desc: 'Sin pantallas. Preparar sueño.', icon: '📱', type: 'routine' },
    { time: '22:00', title: 'Pre-bed', desc: `${isVegan ? 'Proteína caseína vegetal' : 'Yogur'} + almendras + Mg. Stack PM.`, icon: '🌙', type: 'meal', kcalPct: 10 },
    { time: '22:30', title: 'Lights Out', desc: 'Objetivo: dormido antes de 23:00.', icon: '💤', type: 'routine' },
  )

  return plan
}

// Build AI system prompt from profile
export function buildAIPrompt(profile: UserProfile): string {
  return `Eres el SISTEMA DE INTELIGENCIA del PROTOCOLO SUPERMAN. Plataforma autónoma de optimización física.
SUJETO: ${profile.sex === 'male' ? 'Hombre' : 'Mujer'} ${profile.age}a, ${profile.height}cm, ${profile.weight}kg→${profile.weightGoal}kg objetivo. ${profile.experience === 'beginner' ? 'Principiante' : profile.experience === 'intermediate' ? 'Intermedio' : 'Avanzado'}. ${profile.dietaryRestrictions.join(', ') || 'Sin restricciones'}. ${profile.location}.${profile.injuries.length > 0 ? ` Lesiones: ${profile.injuries.join(', ')}.` : ''}
PROTOCOLO: 4 fases (Foundation→Mass I→Mass II→Cut), PPL 6d, surplus agresivo fases 1-3, déficit controlado fase 4.
ERES PROACTIVO: Analizas datos, detectas problemas, prescribes acciones.
TIENES ACCESO A: Readiness Score, ACWR, Injury Risk, métricas de salud, workout logs, meals, analíticas.
REGLAS: Español. Directo. Evidencia A/B/C. No TRT/SARMs. Cada recomendación con WHY explícito.`
}
