// ═══════════════════════════════════════════════════════════
// EXERCISE GUIDE — Form instructions, muscle maps, visual guides
// Uses wger.de API (free, open source) for exercise images
// ═══════════════════════════════════════════════════════════

export interface ExerciseGuide {
  name: string
  muscles: string[]        // primary muscles
  secondary: string[]      // secondary muscles
  steps: string[]           // step-by-step form instructions
  tips: string[]            // form tips / common mistakes
  breathe: string          // breathing cue
  muscleIds: number[]      // for SVG muscle highlighting
}

// Muscle IDs map to body regions for SVG highlighting
// Front: 1=Chest, 2=Shoulders, 3=Biceps, 4=Abs, 5=Quads, 6=Forearms
// Back: 7=Traps, 8=Lats, 9=Triceps, 10=Lower Back, 11=Glutes, 12=Hamstrings, 13=Calves

export const EXERCISE_GUIDES: Record<string, ExerciseGuide> = {
  'Bench Press': {
    name: 'Bench Press',
    muscles: ['Pecho'],
    secondary: ['Tríceps', 'Deltoides anterior'],
    steps: [
      'Túmbate en el banco con los ojos bajo la barra',
      'Agarra la barra algo más ancho que los hombros',
      'Retrae las escápulas y arquea ligeramente la espalda',
      'Desenganche la barra y bájala controladamente al pecho',
      'Toca el pecho a la altura de los pezones',
      'Empuja explosivamente hasta extensión completa',
    ],
    tips: ['No rebotes en el pecho', 'Mantén los pies firmes en el suelo', 'Codos a ~45° del torso'],
    breathe: 'Inhala al bajar, exhala al empujar',
    muscleIds: [1, 2, 9],
  },
  'OHP': {
    name: 'Press Militar (OHP)',
    muscles: ['Deltoides'],
    secondary: ['Tríceps', 'Trapecio superior'],
    steps: [
      'De pie, barra a la altura de los hombros',
      'Agarra algo más ancho que los hombros',
      'Aprieta glúteos y abdomen para estabilizar',
      'Empuja la barra vertical, moviendo la cabeza hacia atrás',
      'Bloquea arriba con la barra sobre la cabeza',
      'Baja controladamente a los hombros',
    ],
    tips: ['No uses impulso de piernas', 'Mantén el core activado', 'La barra sube en línea recta'],
    breathe: 'Exhala al empujar arriba',
    muscleIds: [2, 7, 9],
  },
  'Incline DB Press': {
    name: 'Press Inclinado con Mancuernas',
    muscles: ['Pecho superior'],
    secondary: ['Deltoides anterior', 'Tríceps'],
    steps: [
      'Banco inclinado a 30-45°',
      'Mancuernas a la altura del pecho, codos a 45°',
      'Empuja las mancuernas arriba juntándolas ligeramente',
      'Baja controladamente hasta que los codos pasen la línea del pecho',
    ],
    tips: ['No inclines más de 45° (se convierte en press de hombro)', 'Retrae escápulas'],
    breathe: 'Inhala al bajar, exhala al empujar',
    muscleIds: [1, 2, 9],
  },
  'Weighted Dips': {
    name: 'Fondos Lastrados',
    muscles: ['Pecho', 'Tríceps'],
    secondary: ['Deltoides anterior'],
    steps: [
      'Sujétate en las paralelas con brazos extendidos',
      'Inclina el torso ligeramente hacia adelante',
      'Baja controladamente flexionando los codos',
      'Baja hasta que los hombros estén a la altura de los codos',
      'Empuja explosivamente hasta arriba',
    ],
    tips: ['Inclínate adelante para más pecho, vertical para más tríceps', 'No bajes demasiado si tienes dolor de hombro'],
    breathe: 'Inhala al bajar, exhala al subir',
    muscleIds: [1, 9, 2],
  },
  'Lateral Raise': {
    name: 'Elevaciones Laterales',
    muscles: ['Deltoides lateral'],
    secondary: ['Trapecio superior'],
    steps: [
      'De pie, mancuernas a los lados',
      'Levanta los brazos lateralmente hasta la altura de los hombros',
      'Mantén una ligera flexión de codo constante',
      'Baja controladamente, sin dejar caer',
    ],
    tips: ['Imagina verter agua de una jarra (meñique arriba)', 'No uses impulso', 'Menos peso, más control'],
    breathe: 'Exhala al subir',
    muscleIds: [2],
  },
  'Tricep Ext': {
    name: 'Extensión de Tríceps',
    muscles: ['Tríceps'],
    secondary: [],
    steps: [
      'Cable o mancuerna por encima de la cabeza',
      'Codos apuntando al techo, fijos',
      'Extiende los brazos completamente',
      'Baja controladamente sin mover los codos',
    ],
    tips: ['Los codos no se mueven — solo el antebrazo', 'Aprieta al final del movimiento'],
    breathe: 'Exhala al extender',
    muscleIds: [9],
  },
  'Chest Fly': {
    name: 'Aperturas de Pecho',
    muscles: ['Pecho'],
    secondary: ['Deltoides anterior'],
    steps: [
      'Tumbado en banco plano con mancuernas arriba',
      'Abre los brazos en arco amplio con codos ligeramente flexionados',
      'Baja hasta sentir estiramiento en el pecho',
      'Junta las mancuernas arriba apretando el pecho',
    ],
    tips: ['No uses peso excesivo — es un movimiento de aislamiento', 'Mantén la flexión de codo constante'],
    breathe: 'Inhala al abrir, exhala al cerrar',
    muscleIds: [1],
  },
  'Deadlift': {
    name: 'Peso Muerto',
    muscles: ['Espalda', 'Glúteos', 'Isquiotibiales'],
    secondary: ['Cuádriceps', 'Core', 'Trapecios', 'Antebrazos'],
    steps: [
      'Barra sobre la mitad del pie, pies a la anchura de caderas',
      'Agarra la barra justo fuera de las piernas',
      'Pecho arriba, espalda neutra, hombros sobre la barra',
      'Empuja el suelo con los pies para iniciar',
      'La barra sube pegada a las piernas',
      'Bloquea caderas y rodillas arriba simultáneamente',
      'Baja controladamente invirtiendo el movimiento',
    ],
    tips: ['NUNCA redondees la espalda baja', 'La barra siempre pegada al cuerpo', 'Piensa en empujar el suelo, no en tirar'],
    breathe: 'Gran respiración antes de levantar, exhala arriba',
    muscleIds: [8, 10, 11, 12, 5],
  },
  'Barbell Row': {
    name: 'Remo con Barra',
    muscles: ['Espalda media', 'Lats'],
    secondary: ['Bíceps', 'Romboides', 'Trapecio'],
    steps: [
      'Flexiona las caderas ~45°, espalda recta',
      'Agarra la barra algo más ancho que los hombros',
      'Tira de la barra hacia el ombligo',
      'Aprieta las escápulas al final',
      'Baja controladamente',
    ],
    tips: ['No uses impulso con el torso', 'Piensa en tirar con los codos, no con las manos'],
    breathe: 'Exhala al tirar hacia ti',
    muscleIds: [8, 7, 3],
  },
  'Weighted Pull-ups': {
    name: 'Dominadas Lastradas',
    muscles: ['Lats', 'Espalda'],
    secondary: ['Bíceps', 'Antebrazos', 'Core'],
    steps: [
      'Agarre pronado algo más ancho que los hombros',
      'Desde colgado completo (brazos estirados)',
      'Tira llevando el pecho hacia la barra',
      'Sube hasta que la barbilla pase la barra',
      'Baja controladamente hasta extensión completa',
    ],
    tips: ['No hagas kipping (balanceo)', 'Retrae escápulas para iniciar', 'Piensa en llevar los codos hacia las caderas'],
    breathe: 'Exhala al subir',
    muscleIds: [8, 3, 4],
  },
  'Face Pulls': {
    name: 'Face Pulls',
    muscles: ['Deltoides posterior', 'Romboides'],
    secondary: ['Trapecio medio', 'Rotadores externos'],
    steps: [
      'Cable a la altura de la cara',
      'Agarra la cuerda con ambas manos',
      'Tira hacia la cara separando las manos',
      'Rota externamente los hombros al final',
      'Mantén 1-2 segundos apretando',
    ],
    tips: ['Esencial para salud del hombro', 'No uses peso excesivo', 'Codos por encima de las muñecas'],
    breathe: 'Exhala al tirar',
    muscleIds: [2, 7],
  },
  'Heavy Shrugs': {
    name: 'Encogimientos (Shrugs)',
    muscles: ['Trapecios'],
    secondary: ['Romboides'],
    steps: [
      'De pie con barra o mancuernas pesadas',
      'Sube los hombros hacia las orejas',
      'Mantén 1-2 segundos arriba',
      'Baja controladamente',
    ],
    tips: ['No gires los hombros', 'Movimiento vertical puro', 'Usa straps si el agarre falla'],
    breathe: 'Exhala al subir',
    muscleIds: [7],
  },
  'BB Curl': {
    name: 'Curl con Barra',
    muscles: ['Bíceps'],
    secondary: ['Braquial', 'Antebrazo'],
    steps: [
      'De pie, barra con agarre supino (palmas arriba)',
      'Codos pegados al cuerpo',
      'Curl hasta contracción completa',
      'Baja controladamente sin mover los codos',
    ],
    tips: ['No balancees el cuerpo', 'Los codos no se mueven', 'Aprieta arriba 1 segundo'],
    breathe: 'Exhala al subir',
    muscleIds: [3],
  },
  'Hammer Curl': {
    name: 'Curl Martillo',
    muscles: ['Braquiorradial', 'Bíceps'],
    secondary: ['Antebrazo'],
    steps: [
      'De pie, mancuernas con agarre neutro (palmas hacia dentro)',
      'Curl manteniendo palmas mirándose entre sí',
      'Sube hasta contracción completa',
      'Baja controladamente',
    ],
    tips: ['No gires las muñecas', 'Excelente para ancho del brazo'],
    breathe: 'Exhala al subir',
    muscleIds: [3, 6],
  },
  'Back Squat': {
    name: 'Sentadilla',
    muscles: ['Cuádriceps', 'Glúteos'],
    secondary: ['Isquiotibiales', 'Core', 'Espalda baja'],
    steps: [
      'Barra en la parte alta de la espalda (high bar) o en los deltoides posteriores (low bar)',
      'Pies a la anchura de hombros o ligeramente más',
      'Pecho arriba, mirada al frente',
      'Rompe con caderas y rodillas simultáneamente',
      'Baja hasta que los muslos estén paralelos o más',
      'Empuja el suelo para subir, manteniendo la espalda recta',
    ],
    tips: ['Rodillas en la dirección de los pies', 'No dejes que las rodillas colapsen hacia dentro', 'Profundidad > peso'],
    breathe: 'Gran respiración antes de bajar, exhala al subir',
    muscleIds: [5, 11, 12, 10],
  },
  'RDL': {
    name: 'Peso Muerto Rumano (RDL)',
    muscles: ['Isquiotibiales', 'Glúteos'],
    secondary: ['Espalda baja', 'Core'],
    steps: [
      'De pie con barra, pies a la anchura de caderas',
      'Flexiona ligeramente las rodillas (y mantenlas ahí)',
      'Empuja las caderas hacia atrás bajando la barra',
      'Mantén la barra pegada a las piernas',
      'Baja hasta sentir estiramiento en isquiotibiales',
      'Extiende caderas para volver arriba',
    ],
    tips: ['La espalda NO se redondea nunca', 'El movimiento es de cadera, no de rodilla', 'Siente el estiramiento en los isquiotibiales'],
    breathe: 'Inhala al bajar, exhala al subir',
    muscleIds: [12, 11, 10],
  },
  'Leg Press': {
    name: 'Prensa de Piernas',
    muscles: ['Cuádriceps'],
    secondary: ['Glúteos', 'Isquiotibiales'],
    steps: [
      'Siéntate con la espalda bien apoyada',
      'Pies en la plataforma a la anchura de hombros',
      'Desbloquea la plataforma',
      'Baja controladamente flexionando las rodillas a ~90°',
      'Empuja sin bloquear completamente las rodillas',
    ],
    tips: ['No bloquees las rodillas arriba', 'Pies más altos = más glúteo/isquio', 'La espalda baja no debe despegarse del respaldo'],
    breathe: 'Inhala al bajar, exhala al empujar',
    muscleIds: [5, 11],
  },
  'Lunges': {
    name: 'Zancadas',
    muscles: ['Cuádriceps', 'Glúteos'],
    secondary: ['Isquiotibiales', 'Core'],
    steps: [
      'De pie con mancuernas a los lados',
      'Da un paso largo hacia adelante',
      'Baja la rodilla trasera casi al suelo',
      'La rodilla delantera no pasa la punta del pie',
      'Empuja con la pierna delantera para volver',
    ],
    tips: ['Mantén el torso vertical', 'Paso más largo = más glúteo'],
    breathe: 'Inhala al bajar, exhala al subir',
    muscleIds: [5, 11],
  },
  'Leg Curl': {
    name: 'Curl de Piernas',
    muscles: ['Isquiotibiales'],
    secondary: ['Gemelos'],
    steps: [
      'Túmbate boca abajo en la máquina',
      'Rodillo sobre los tobillos',
      'Curl llevando los talones hacia los glúteos',
      'Aprieta arriba 1 segundo',
      'Baja controladamente',
    ],
    tips: ['No levantes las caderas del banco', 'Contracción completa arriba'],
    breathe: 'Exhala al flexionar',
    muscleIds: [12],
  },
  'Calf Raise': {
    name: 'Elevaciones de Gemelos',
    muscles: ['Gemelos'],
    secondary: ['Sóleo'],
    steps: [
      'De pie en la máquina o escalón',
      'Baja los talones para estiramiento completo',
      'Sube en puntas de pie lo más alto posible',
      'Mantén 1-2 segundos arriba',
      'Baja controladamente',
    ],
    tips: ['Rango completo de movimiento', 'Pausa arriba y abajo', 'Alto volumen funciona mejor para gemelos'],
    breathe: 'Exhala al subir',
    muscleIds: [13],
  },
  'Hanging Leg Raise': {
    name: 'Elevación de Piernas Colgado',
    muscles: ['Abdominales', 'Flexores de cadera'],
    secondary: ['Oblicuos'],
    steps: [
      'Cuélgate de la barra con agarre pronado',
      'Piernas estiradas o ligeramente flexionadas',
      'Sube las piernas hasta 90° o más',
      'Baja controladamente sin balanceo',
    ],
    tips: ['Evita el balanceo', 'Para más dificultad: piernas rectas', 'Para principiantes: rodillas flexionadas'],
    breathe: 'Exhala al subir las piernas',
    muscleIds: [4],
  },
}

// Fetch exercise image from wger.de API (free, open source)
export async function fetchExerciseImage(exerciseName: string): Promise<string | null> {
  try {
    // Search for exercise
    const searchRes = await fetch(
      `https://wger.de/api/v2/exercise/search/?term=${encodeURIComponent(exerciseName)}&language=2&format=json`
    )
    if (!searchRes.ok) return null
    const searchData = await searchRes.json()

    if (!searchData.suggestions?.length) return null
    const exerciseId = searchData.suggestions[0]?.data?.id
    if (!exerciseId) return null

    // Get images
    const imgRes = await fetch(
      `https://wger.de/api/v2/exerciseimage/?exercise_base=${exerciseId}&format=json`
    )
    if (!imgRes.ok) return null
    const imgData = await imgRes.json()

    return imgData.results?.[0]?.image || null
  } catch {
    return null
  }
}

// Get guide for exercise name (fuzzy match)
export function getGuide(exerciseName: string): ExerciseGuide | null {
  // Direct match
  if (EXERCISE_GUIDES[exerciseName]) return EXERCISE_GUIDES[exerciseName]

  // Fuzzy match
  const lower = exerciseName.toLowerCase()
  for (const [key, guide] of Object.entries(EXERCISE_GUIDES)) {
    if (key.toLowerCase().includes(lower) || lower.includes(key.toLowerCase())) {
      return guide
    }
  }

  return null
}
