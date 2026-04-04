export interface ExerciseInfo {
  id: string
  name: string
  muscle: string
  equipment: string
  alternatives: string[]  // IDs of alternative exercises
  warmupPct: number[]     // warm-up set percentages of working weight
}

export const EXERCISE_DB: Record<string, ExerciseInfo> = {
  'bench-press': { id: 'bench-press', name: 'Bench Press', muscle: 'Pecho', equipment: 'Barra', alternatives: ['db-bench', 'push-ups'], warmupPct: [40, 60, 80] },
  'db-bench': { id: 'db-bench', name: 'DB Bench Press', muscle: 'Pecho', equipment: 'Mancuernas', alternatives: ['bench-press', 'push-ups'], warmupPct: [50, 70] },
  'push-ups': { id: 'push-ups', name: 'Push-ups', muscle: 'Pecho', equipment: 'Peso corporal', alternatives: ['bench-press', 'db-bench'], warmupPct: [] },
  'ohp': { id: 'ohp', name: 'OHP', muscle: 'Hombros', equipment: 'Barra', alternatives: ['db-ohp', 'landmine-press'], warmupPct: [40, 60, 80] },
  'db-ohp': { id: 'db-ohp', name: 'DB OHP', muscle: 'Hombros', equipment: 'Mancuernas', alternatives: ['ohp'], warmupPct: [50, 70] },
  'landmine-press': { id: 'landmine-press', name: 'Landmine Press', muscle: 'Hombros', equipment: 'Barra', alternatives: ['ohp', 'db-ohp'], warmupPct: [50, 70] },
  'incline-db': { id: 'incline-db', name: 'Incline DB Press', muscle: 'Pecho superior', equipment: 'Mancuernas', alternatives: ['incline-bb'], warmupPct: [50, 70] },
  'incline-bb': { id: 'incline-bb', name: 'Incline BB Press', muscle: 'Pecho superior', equipment: 'Barra', alternatives: ['incline-db'], warmupPct: [40, 60, 80] },
  'dips': { id: 'dips', name: 'Weighted Dips', muscle: 'Pecho/Tríceps', equipment: 'Paralelas', alternatives: ['close-grip-bench'], warmupPct: [50] },
  'close-grip-bench': { id: 'close-grip-bench', name: 'Close Grip Bench', muscle: 'Tríceps', equipment: 'Barra', alternatives: ['dips'], warmupPct: [50, 70] },
  'lat-raise': { id: 'lat-raise', name: 'Lateral Raise', muscle: 'Deltoides lateral', equipment: 'Mancuernas', alternatives: ['cable-lat-raise'], warmupPct: [] },
  'cable-lat-raise': { id: 'cable-lat-raise', name: 'Cable Lateral Raise', muscle: 'Deltoides lateral', equipment: 'Cable', alternatives: ['lat-raise'], warmupPct: [] },
  'tricep-ext': { id: 'tricep-ext', name: 'Tricep Extension', muscle: 'Tríceps', equipment: 'Cable/Mancuerna', alternatives: ['skull-crushers'], warmupPct: [] },
  'skull-crushers': { id: 'skull-crushers', name: 'Skull Crushers', muscle: 'Tríceps', equipment: 'Barra EZ', alternatives: ['tricep-ext'], warmupPct: [] },
  'chest-fly': { id: 'chest-fly', name: 'Chest Fly', muscle: 'Pecho', equipment: 'Mancuernas/Cable', alternatives: ['pec-deck'], warmupPct: [] },
  'pec-deck': { id: 'pec-deck', name: 'Pec Deck', muscle: 'Pecho', equipment: 'Máquina', alternatives: ['chest-fly'], warmupPct: [] },
  'deadlift': { id: 'deadlift', name: 'Deadlift', muscle: 'Espalda/Piernas', equipment: 'Barra', alternatives: ['trap-bar-dl', 'rdl'], warmupPct: [30, 50, 70, 85] },
  'trap-bar-dl': { id: 'trap-bar-dl', name: 'Trap Bar Deadlift', muscle: 'Espalda/Piernas', equipment: 'Trap bar', alternatives: ['deadlift'], warmupPct: [30, 50, 70, 85] },
  'bb-row': { id: 'bb-row', name: 'Barbell Row', muscle: 'Espalda', equipment: 'Barra', alternatives: ['db-row', 'cable-row'], warmupPct: [50, 70] },
  'db-row': { id: 'db-row', name: 'DB Row', muscle: 'Espalda', equipment: 'Mancuerna', alternatives: ['bb-row', 'cable-row'], warmupPct: [50] },
  'cable-row': { id: 'cable-row', name: 'Cable Row', muscle: 'Espalda', equipment: 'Cable', alternatives: ['bb-row', 'db-row'], warmupPct: [50] },
  'pull-ups': { id: 'pull-ups', name: 'Weighted Pull-ups', muscle: 'Espalda', equipment: 'Barra fija', alternatives: ['lat-pulldown'], warmupPct: [] },
  'lat-pulldown': { id: 'lat-pulldown', name: 'Lat Pulldown', muscle: 'Espalda', equipment: 'Cable', alternatives: ['pull-ups'], warmupPct: [50] },
  'face-pulls': { id: 'face-pulls', name: 'Face Pulls', muscle: 'Deltoides posterior', equipment: 'Cable', alternatives: ['rear-delt-fly'], warmupPct: [] },
  'rear-delt-fly': { id: 'rear-delt-fly', name: 'Rear Delt Fly', muscle: 'Deltoides posterior', equipment: 'Mancuernas', alternatives: ['face-pulls'], warmupPct: [] },
  'shrugs': { id: 'shrugs', name: 'Heavy Shrugs', muscle: 'Trapecios', equipment: 'Barra/Mancuernas', alternatives: [], warmupPct: [50] },
  'bb-curl': { id: 'bb-curl', name: 'BB Curl', muscle: 'Bíceps', equipment: 'Barra', alternatives: ['db-curl'], warmupPct: [] },
  'db-curl': { id: 'db-curl', name: 'DB Curl', muscle: 'Bíceps', equipment: 'Mancuernas', alternatives: ['bb-curl'], warmupPct: [] },
  'hammer-curl': { id: 'hammer-curl', name: 'Hammer Curl', muscle: 'Bíceps/Antebrazo', equipment: 'Mancuernas', alternatives: [], warmupPct: [] },
  'squat': { id: 'squat', name: 'Back Squat', muscle: 'Cuádriceps', equipment: 'Barra', alternatives: ['front-squat', 'goblet-squat'], warmupPct: [30, 50, 70, 85] },
  'front-squat': { id: 'front-squat', name: 'Front Squat', muscle: 'Cuádriceps', equipment: 'Barra', alternatives: ['squat', 'goblet-squat'], warmupPct: [30, 50, 70, 85] },
  'goblet-squat': { id: 'goblet-squat', name: 'Goblet Squat', muscle: 'Cuádriceps', equipment: 'Mancuerna', alternatives: ['squat'], warmupPct: [50] },
  'rdl': { id: 'rdl', name: 'RDL', muscle: 'Isquiotibiales', equipment: 'Barra', alternatives: ['db-rdl'], warmupPct: [50, 70] },
  'db-rdl': { id: 'db-rdl', name: 'DB RDL', muscle: 'Isquiotibiales', equipment: 'Mancuernas', alternatives: ['rdl'], warmupPct: [50] },
  'leg-press': { id: 'leg-press', name: 'Leg Press', muscle: 'Cuádriceps', equipment: 'Máquina', alternatives: ['hack-squat'], warmupPct: [50, 70] },
  'hack-squat': { id: 'hack-squat', name: 'Hack Squat', muscle: 'Cuádriceps', equipment: 'Máquina', alternatives: ['leg-press'], warmupPct: [50, 70] },
  'lunges': { id: 'lunges', name: 'Lunges', muscle: 'Cuádriceps/Glúteos', equipment: 'Mancuernas', alternatives: ['split-squat'], warmupPct: [] },
  'split-squat': { id: 'split-squat', name: 'Bulgarian Split Squat', muscle: 'Cuádriceps/Glúteos', equipment: 'Mancuernas', alternatives: ['lunges'], warmupPct: [] },
  'leg-curl': { id: 'leg-curl', name: 'Leg Curl', muscle: 'Isquiotibiales', equipment: 'Máquina', alternatives: ['nordic-curl'], warmupPct: [] },
  'nordic-curl': { id: 'nordic-curl', name: 'Nordic Curl', muscle: 'Isquiotibiales', equipment: 'Peso corporal', alternatives: ['leg-curl'], warmupPct: [] },
  'calf-raise': { id: 'calf-raise', name: 'Calf Raise', muscle: 'Gemelos', equipment: 'Máquina/Smith', alternatives: [], warmupPct: [] },
  'hanging-leg-raise': { id: 'hanging-leg-raise', name: 'Hanging Leg Raise', muscle: 'Abdominales', equipment: 'Barra fija', alternatives: ['cable-crunch'], warmupPct: [] },
  'cable-crunch': { id: 'cable-crunch', name: 'Cable Crunch', muscle: 'Abdominales', equipment: 'Cable', alternatives: ['hanging-leg-raise'], warmupPct: [] },
}

// Get exercise history from workout log (last weight used)
export function getExerciseHistory(
  wkLog: Record<string, { w: number; r: number }[]>,
  split: string,
  exerciseIdx: number,
  days: number = 60
): { date: string; sets: { w: number; r: number }[] }[] {
  const now = new Date()
  const history: { date: string; sets: { w: number; r: number }[] }[] = []

  Object.entries(wkLog).forEach(([key, sets]) => {
    const parts = key.split('-')
    const dateStr = parts.slice(0, 3).join('-')
    const keySplit = parts[3]
    const keyIdx = parts[4]

    if (keySplit === split && keyIdx === String(exerciseIdx)) {
      const d = new Date(dateStr)
      if ((now.getTime() - d.getTime()) / 864e5 <= days) {
        history.push({ date: dateStr, sets })
      }
    }
  })

  return history.sort((a, b) => a.date.localeCompare(b.date))
}

// Calculate progressive overload suggestion
export function getProgressionSuggestion(
  history: { date: string; sets: { w: number; r: number }[] }[]
): { weight: number; reps: number; message: string } | null {
  if (history.length < 2) return null

  const last = history[history.length - 1]
  const lastBest = last.sets.reduce((best, s) => s.w > best.w ? s : best, last.sets[0])

  // If completed target reps at this weight, suggest +2.5kg
  if (lastBest.r >= 8) {
    return {
      weight: lastBest.w + 2.5,
      reps: lastBest.r - 2,
      message: `+2.5kg → ${lastBest.w + 2.5}kg × ${lastBest.r - 2}`,
    }
  }
  // If low reps, suggest same weight more reps
  if (lastBest.r < 5) {
    return {
      weight: lastBest.w,
      reps: lastBest.r + 1,
      message: `${lastBest.w}kg × ${lastBest.r + 1} (más reps)`,
    }
  }

  return {
    weight: lastBest.w,
    reps: lastBest.r + 1,
    message: `${lastBest.w}kg × ${lastBest.r + 1}`,
  }
}

// Compute e1RM using Epley formula
export function computeE1RM(weight: number, reps: number): number {
  if (reps === 1) return weight
  return Math.round(weight * (1 + reps / 30))
}

// Get personal records from workout log
export function getPersonalRecords(
  wkLog: Record<string, { w: number; r: number }[]>
): { exercise: string; split: string; idx: number; weight: number; reps: number; e1rm: number; date: string }[] {
  const prs: Record<string, { weight: number; reps: number; e1rm: number; date: string; split: string; idx: number }> = {}

  Object.entries(wkLog).forEach(([key, sets]) => {
    const parts = key.split('-')
    const dateStr = parts.slice(0, 3).join('-')
    const split = parts[3]
    const idx = parseInt(parts[4])
    const prKey = `${split}-${idx}`

    sets.forEach(s => {
      if (s.w && s.r) {
        const e1rm = computeE1RM(s.w, s.r)
        if (!prs[prKey] || e1rm > prs[prKey].e1rm) {
          prs[prKey] = { weight: s.w, reps: s.r, e1rm, date: dateStr, split, idx }
        }
      }
    })
  })

  return Object.entries(prs).map(([exercise, data]) => ({ exercise, ...data }))
    .sort((a, b) => b.e1rm - a.e1rm)
}

// Generate warm-up sets
export function getWarmupSets(workingWeight: number, warmupPcts: number[]): { w: number; r: number }[] {
  return warmupPcts.map(pct => ({
    w: Math.round(workingWeight * pct / 100 / 2.5) * 2.5, // round to nearest 2.5
    r: pct < 60 ? 10 : pct < 80 ? 6 : 3,
  }))
}
