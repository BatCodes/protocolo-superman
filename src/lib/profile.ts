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

// Generate dynamic meal plan based on profile, macros, and day of week
// dayOfWeek: 0=Sunday, 1=Monday, etc. Used to rotate meal variety
export function generateMealPlan(profile: UserProfile, macros: MacroTargets, isTrainingDay: boolean, dayOfWeek?: number): MealPlan[] {
  const restrictions = profile.dietaryRestrictions.map(r => r.toLowerCase())
  const isHalal = restrictions.includes('halal')
  const isVeg = restrictions.includes('vegetariano') || restrictions.includes('vegano')
  const isVegan = restrictions.includes('vegano')
  const day = dayOfWeek ?? new Date().getDay()

  // Protein sources — rotated by day
  const allProteins = isVegan
    ? ['tofu scramble', 'tempeh a la plancha', 'garbanzos especiados', 'seitán salteado', 'lentejas', 'edamame', 'hamburguesa vegetal']
    : isVeg
      ? ['huevos revueltos', 'tortilla de espinacas', 'yogur griego con granola', 'queso cottage con fruta', 'huevos cocidos', 'tofu salteado', 'frittata de verduras']
      : isHalal
        ? ['pollo a la plancha', 'carne picada halal con especias', 'huevos revueltos con verduras', 'salmón al horno', 'pechuga de pavo halal', 'merluza a la plancha', 'ternera halal salteada']
        : ['pechuga de pollo', 'carne picada con tomate', 'huevos revueltos', 'salmón al horno', 'pavo a la plancha', 'merluza a la plancha', 'ternera salteada']

  const allCarbs = ['arroz basmati', 'boniato asado', 'pasta integral', 'quinoa', 'arroz integral', 'cuscús', 'patata cocida']
  const allSides = ['brócoli al vapor', 'ensalada mixta', 'espinacas salteadas', 'verduras asadas', 'judías verdes', 'calabacín a la plancha', 'pimientos asados']
  const allBreakfastBases = ['avena con plátano', 'tostadas integrales con aguacate', 'gachas de avena con frutos rojos', 'tortitas de avena', 'pan integral con tomate', 'porridge con manzana', 'avena overnight con mango']

  // Rotate by day of week
  const pick = (arr: string[], offset: number) => arr[(day + offset) % arr.length]

  const pGrams = Math.round(macros.protein / 5)
  const mealKcal = (pct: number) => Math.round((pct / 100) * macros.kcal)

  const plan: MealPlan[] = [
    { time: '7:00', title: 'Despertar', desc: 'Exposición solar 10min. Pesar en ayunas.', icon: '☀️', type: 'routine' },
    { time: '7:30', title: 'Desayuno', desc: `${pick(allBreakfastBases, 0)} + ${pick(allProteins, 2)}. Stack AM. ~${pGrams}g prot · ${mealKcal(20)} kcal`, icon: '🍳', type: 'meal', kcalPct: 20 },
    { time: '10:30', title: 'Media mañana', desc: `${pick(allCarbs, 0)} + ${pick(allProteins, 0)} + ${pick(allSides, 0)}. ~${pGrams}g prot · ${mealKcal(20)} kcal`, icon: '🍗', type: 'meal', kcalPct: 20 },
    { time: '13:30', title: 'Almuerzo', desc: `${pick(allCarbs, 1)} + ${pick(allProteins, 1)} + ${pick(allSides, 1)}. ~${pGrams}g prot · ${mealKcal(20)} kcal`, icon: '🥩', type: 'meal', kcalPct: 20 },
  ]

  if (isTrainingDay) {
    plan.push(
      { time: '15:30', title: 'Pre-Workout', desc: `${pick(allBreakfastBases, 3)} + whey + miel. ~${pGrams}g prot · ${mealKcal(10)} kcal`, icon: '⚡', type: 'meal', kcalPct: 10 },
      { time: '16:00', title: 'Entrenamiento', desc: 'Sesión de entreno.', icon: '🏋️', type: 'routine' },
      { time: '19:00', title: 'Post-Workout', desc: `Whey + ${pick(allCarbs, 2)} + ${pick(allProteins, 3)}. Ventana anabólica. ~${pGrams}g prot · ${mealKcal(20)} kcal`, icon: '🍚', type: 'meal', kcalPct: 20 },
      { time: '19:30', title: 'Sauna', desc: 'Protocolo térmico post-entreno.', icon: '🔥', type: 'routine' },
    )
  } else {
    plan.push(
      { time: '16:00', title: 'Merienda', desc: `${isVegan ? 'Batido proteína vegetal' : 'Yogur griego'} + ${pick(['almendras', 'nueces', 'anacardos', 'mix frutos secos', 'cacahuetes', 'pistachos', 'avellanas'], 0)}. ~${pGrams}g prot · ${mealKcal(10)} kcal`, icon: '🥜', type: 'meal', kcalPct: 10 },
      { time: '17:00', title: 'Actividad ligera', desc: 'Caminar 30min / movilidad / yoga.', icon: '🚶', type: 'routine' },
    )
  }

  plan.push(
    { time: '21:00', title: 'Toque de queda', desc: 'Sin pantallas. Preparar sueño.', icon: '📱', type: 'routine' },
    { time: '22:00', title: 'Pre-bed', desc: `${isVegan ? 'Caseína vegetal' : 'Yogur griego'} + ${pick(['almendras', 'nueces de macadamia', 'mantequilla de cacahuete', 'semillas de chía', 'queso cottage', 'requesón', 'kéfir'], 0)} + Mg. Stack PM. ~${mealKcal(10)} kcal`, icon: '🌙', type: 'meal', kcalPct: 10 },
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
