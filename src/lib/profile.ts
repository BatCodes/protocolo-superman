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
  kcal?: number      // exact calories
  tBoost?: string    // T-optimization reason
}

// Generate dynamic meal plan based on profile, macros, and day of week
// dayOfWeek: 0=Sunday, 1=Monday, etc. Used to determine split
export function generateMealPlan(_profile: UserProfile, _macros: MacroTargets, _isTrainingDay: boolean, dayOfWeek?: number): MealPlan[] {
  // Determine split from day of week
  const splits = ['REST', 'PUSH', 'PULL', 'LEGS', 'PUSH', 'PULL', 'LEGS']
  const day = dayOfWeek ?? new Date().getDay()
  const split = splits[day === 0 ? 0 : day]

  // Total kcal per split for percentage calculations
  const splitTotalKcal: Record<string, number> = {
    PUSH: 750 + 580 + 700 + 420 + 700,  // 3150
    PULL: 780 + 530 + 720 + 400 + 700,  // 3130
    LEGS: 820 + 600 + 800 + 550 + 780,  // 3550
    REST: 620 + 450 + 620 + 350 + 560,  // 2600
  }
  const totalKcal = splitTotalKcal[split] || 3150
  const pct = (kcal: number) => Math.round((kcal / totalKcal) * 100)

  if (split === 'PUSH') {
    return [
      { time: '7:00', title: 'Desayuno', desc: '5 huevos enteros en mantequilla + 2 tostadas sourdough + aguacate (medio) + nueces de Brasil (4)', icon: '🍳', type: 'meal', kcal: 750, kcalPct: pct(750), tBoost: 'Colesterol + grasa sat + selenio = T' },
      { time: '10:30', title: 'Media mañana', desc: 'Yogur griego entero (250g) + avena (60g) + miel + frutos rojos + semillas calabaza (30g)', icon: '🥣', type: 'meal', kcal: 580, kcalPct: pct(580), tBoost: 'Zinc calabaza, probióticos gut-T' },
      { time: '13:30', title: 'Almuerzo', desc: '200g ternera halal picada (80/20) + 200g arroz basmati + ensalada AOVE + ajo', icon: '🥩', type: 'meal', kcal: 700, kcalPct: pct(700), tBoost: 'Zinc rojo + B12, AOVE boost T' },
      { time: '16:30', title: 'Pre-entreno', desc: 'Tortitas arroz (3) + miel + plátano + whey shake', icon: '⚡', type: 'meal', kcal: 420, kcalPct: pct(420), tBoost: 'Carbs rápidos para entrenar' },
      { time: '17:00', title: 'Entrenamiento', desc: 'Sesión PUSH. Sin límite de tiempo.', icon: '🏋️', type: 'routine' },
      { time: '19:30', title: 'Post-entreno', desc: '200g cordero halal + boniato (300g) + brócoli + zumo granada (200ml)', icon: '🍖', type: 'meal', kcal: 700, kcalPct: pct(700), tBoost: 'Cordero=rey zinc, granada +24%T' },
      { time: '21:00', title: 'Toque de queda', desc: 'Sin pantallas. Preparar sueño.', icon: '📱', type: 'routine' },
      { time: '22:30', title: 'Lights Out', desc: 'Objetivo: dormido antes de 23:00.', icon: '💤', type: 'routine' },
    ]
  }

  if (split === 'PULL') {
    return [
      { time: '7:00', title: 'Desayuno', desc: '5 huevos enteros en ghee + avena (80g) con leche entera + plátano + nueces', icon: '🍳', type: 'meal', kcal: 780, kcalPct: pct(780), tBoost: 'Ghee: grasa saturada hormonal' },
      { time: '10:30', title: 'Media mañana', desc: 'Whey shake + yogur griego (200g) + miel + nueces (30g) + granada', icon: '🥣', type: 'meal', kcal: 530, kcalPct: pct(530), tBoost: 'Nueces: omega-3, granada: T booster' },
      { time: '13:30', title: 'Almuerzo', desc: '250g pollo halal muslo (con piel) + 250g arroz + espinacas + AOVE + ajo + cebolla', icon: '🍗', type: 'meal', kcal: 720, kcalPct: pct(720), tBoost: 'Cebolla+ajo: boost T en estudios' },
      { time: '16:30', title: 'Pre-entreno', desc: 'Tortitas arroz + miel + plátano + shot de jengibre', icon: '⚡', type: 'meal', kcal: 400, kcalPct: pct(400), tBoost: 'Jengibre: meta-análisis +17% T' },
      { time: '17:00', title: 'Entrenamiento', desc: 'Sesión PULL. Sin límite de tiempo.', icon: '🏋️', type: 'routine' },
      { time: '19:30', title: 'Post-entreno', desc: '200g ternera halal + boniato (300g) + verduras crucíferas + mantequilla', icon: '🥩', type: 'meal', kcal: 700, kcalPct: pct(700), tBoost: 'Crucíferas: precursor DIM anti-estro' },
      { time: '21:00', title: 'Toque de queda', desc: 'Sin pantallas. Preparar sueño.', icon: '📱', type: 'routine' },
      { time: '22:30', title: 'Lights Out', desc: 'Objetivo: dormido antes de 23:00.', icon: '💤', type: 'routine' },
    ]
  }

  if (split === 'LEGS') {
    return [
      { time: '7:00', title: 'Desayuno', desc: '6 huevos (5 enteros + 1 clara) en aceite coco + avena (80g) leche entera + miel + frutos secos (40g)', icon: '🍳', type: 'meal', kcal: 820, kcalPct: pct(820), tBoost: 'Aceite coco MCTs: producción hormonal' },
      { time: '10:30', title: 'Media mañana', desc: 'Yogur griego entero (250g) + granola + whey + granada + semillas calabaza', icon: '🥣', type: 'meal', kcal: 600, kcalPct: pct(600), tBoost: 'Zinc + probióticos + fruta T-boost' },
      { time: '13:30', title: 'Almuerzo', desc: '250g cordero halal o bistec + 300g arroz + espinacas + AOVE + cebolla cruda', icon: '🥩', type: 'meal', kcal: 800, kcalPct: pct(800), tBoost: 'Carne roja 5x/sem: zinc, hierro, B12' },
      { time: '16:30', title: 'Pre-entreno', desc: 'Arroz + whey + plátano + dátiles + zumo remolacha (100ml)', icon: '⚡', type: 'meal', kcal: 550, kcalPct: pct(550), tBoost: 'Remolacha: óxido nítrico' },
      { time: '17:00', title: 'Entrenamiento', desc: 'Sesión LEGS. Sin límite de tiempo.', icon: '🏋️', type: 'routine' },
      { time: '19:30', title: 'Post-entreno', desc: '250g pollo/cordero halal + boniato (350g) + crucíferas + mantequilla + cúrcuma', icon: '🍖', type: 'meal', kcal: 780, kcalPct: pct(780), tBoost: 'Día piernas: más calorías para recup' },
      { time: '21:00', title: 'Toque de queda', desc: 'Sin pantallas. Preparar sueño.', icon: '📱', type: 'routine' },
      { time: '22:30', title: 'Lights Out', desc: 'Objetivo: dormido antes de 23:00.', icon: '💤', type: 'routine' },
    ]
  }

  // REST (Domingo)
  return [
    { time: '8:00', title: 'Desayuno', desc: '4 huevos enteros + 2 claras + avena (60g) + frutos rojos + nueces Brasil', icon: '🍳', type: 'meal', kcal: 620, kcalPct: pct(620), tBoost: 'Día descanso: menos carbs, misma grasa' },
    { time: '11:00', title: 'Media mañana', desc: 'Whey shake + yogur griego (200g) + semillas calabaza + manzana', icon: '🥣', type: 'meal', kcal: 450, kcalPct: pct(450), tBoost: 'Mantener proteína alta en descanso' },
    { time: '14:00', title: 'Almuerzo', desc: '200g ternera halal + 150g arroz + ensalada enorme + AOVE + cebolla + ajo', icon: '🥩', type: 'meal', kcal: 620, kcalPct: pct(620), tBoost: 'Carne roja incluso en descanso' },
    { time: '17:00', title: 'Merienda', desc: 'Tortitas arroz (2) + mantequilla almendra + plátano', icon: '🥜', type: 'meal', kcal: 350, kcalPct: pct(350), tBoost: 'Grasas saludables mantenidas' },
    { time: '17:30', title: 'Actividad ligera', desc: 'Caminar 30min / movilidad / yoga.', icon: '🚶', type: 'routine' },
    { time: '20:00', title: 'Cena', desc: '200g salmón/pescado + boniato (200g) + verduras + limón', icon: '🐟', type: 'meal', kcal: 560, kcalPct: pct(560), tBoost: 'Omega-3 directo del pescado' },
    { time: '21:00', title: 'Toque de queda', desc: 'Sin pantallas. Preparar sueño.', icon: '📱', type: 'routine' },
    { time: '22:30', title: 'Lights Out', desc: 'Objetivo: dormido antes de 23:00.', icon: '💤', type: 'routine' },
  ]
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
