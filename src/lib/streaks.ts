// ═══════════════════════════════════════════════════════════
// STREAKS & GAMIFICATION
// ═══════════════════════════════════════════════════════════

export interface StreakData {
  foodLogging: number      // consecutive days with food logged
  exerciseLogging: number  // consecutive days with exercise logged
  weightTracking: number   // consecutive days with weight logged
  longestFood: number
  longestExercise: number
  longestWeight: number
  totalDaysLogged: number
  lastFoodDate: string
  lastExerciseDate: string
  lastWeightDate: string
}

export interface Badge {
  id: string
  title: string
  description: string
  icon: string
  earned: boolean
  earnedDate?: string
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
}

const INITIAL_STREAKS: StreakData = {
  foodLogging: 0,
  exerciseLogging: 0,
  weightTracking: 0,
  longestFood: 0,
  longestExercise: 0,
  longestWeight: 0,
  totalDaysLogged: 0,
  lastFoodDate: '',
  lastExerciseDate: '',
  lastWeightDate: '',
}

// Check if a date is yesterday
function isYesterday(dateStr: string): boolean {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return dateStr === yesterday.toISOString().slice(0, 10)
}

function isToday(dateStr: string): boolean {
  return dateStr === new Date().toISOString().slice(0, 10)
}

// Update streak for a category
export function updateStreak(
  current: StreakData,
  category: 'food' | 'exercise' | 'weight',
  date: string
): StreakData {
  const updated = { ...current }
  const today = new Date().toISOString().slice(0, 10)

  if (category === 'food') {
    if (date === today && !isToday(updated.lastFoodDate)) {
      if (isYesterday(updated.lastFoodDate) || updated.lastFoodDate === '') {
        updated.foodLogging++
      } else {
        updated.foodLogging = 1
      }
      updated.lastFoodDate = date
      updated.longestFood = Math.max(updated.longestFood, updated.foodLogging)
      updated.totalDaysLogged++
    }
  } else if (category === 'exercise') {
    if (date === today && !isToday(updated.lastExerciseDate)) {
      if (isYesterday(updated.lastExerciseDate) || updated.lastExerciseDate === '') {
        updated.exerciseLogging++
      } else {
        updated.exerciseLogging = 1
      }
      updated.lastExerciseDate = date
      updated.longestExercise = Math.max(updated.longestExercise, updated.exerciseLogging)
    }
  } else if (category === 'weight') {
    if (date === today && !isToday(updated.lastWeightDate)) {
      if (isYesterday(updated.lastWeightDate) || updated.lastWeightDate === '') {
        updated.weightTracking++
      } else {
        updated.weightTracking = 1
      }
      updated.lastWeightDate = date
      updated.longestWeight = Math.max(updated.longestWeight, updated.weightTracking)
    }
  }

  return updated
}

// Generate badges based on streaks
export function generateBadges(streaks: StreakData): Badge[] {
  const badges: Badge[] = []
  const today = new Date().toISOString().slice(0, 10)

  // Food logging streaks
  const foodStreaks = [
    { days: 7, title: '7 Días Fuel', desc: '7 días consecutivos registrando comidas', icon: '🔥', tier: 'bronze' as const },
    { days: 14, title: '2 Semanas Fuel', desc: '14 días consecutivos registrando comidas', icon: '🔥', tier: 'silver' as const },
    { days: 30, title: '30 Días Fuel', desc: '30 días consecutivos registrando comidas', icon: '🔥', tier: 'gold' as const },
    { days: 90, title: '90 Días Fuel', desc: '90 días consecutivos — disciplina élite', icon: '💎', tier: 'platinum' as const },
  ]

  foodStreaks.forEach(s => {
    badges.push({
      id: `food-${s.days}`,
      title: s.title,
      description: s.desc,
      icon: s.icon,
      earned: streaks.longestFood >= s.days,
      earnedDate: streaks.longestFood >= s.days ? today : undefined,
      tier: s.tier,
    })
  })

  // Exercise streaks
  const exerciseStreaks = [
    { days: 7, title: '7 Días Combat', desc: '7 días consecutivos entrenando', icon: '💪', tier: 'bronze' as const },
    { days: 14, title: '2 Semanas Combat', desc: '14 días consecutivos entrenando', icon: '💪', tier: 'silver' as const },
    { days: 30, title: '30 Días Combat', desc: '30 días sin faltar al gym', icon: '🏆', tier: 'gold' as const },
    { days: 90, title: '90 Días Combat', desc: '90 días — guerrero confirmado', icon: '👑', tier: 'platinum' as const },
  ]

  exerciseStreaks.forEach(s => {
    badges.push({
      id: `exercise-${s.days}`,
      title: s.title,
      description: s.desc,
      icon: s.icon,
      earned: streaks.longestExercise >= s.days,
      earnedDate: streaks.longestExercise >= s.days ? today : undefined,
      tier: s.tier,
    })
  })

  // Total days milestones
  const milestones = [
    { days: 10, title: 'Primera Semana+', desc: '10 días usando el protocolo', icon: '⭐', tier: 'bronze' as const },
    { days: 50, title: 'Medio Centenario', desc: '50 días registrados', icon: '🌟', tier: 'silver' as const },
    { days: 100, title: 'Centurión', desc: '100 días registrados', icon: '💫', tier: 'gold' as const },
    { days: 365, title: 'El Año', desc: '365 días — transformación completa', icon: '🏅', tier: 'platinum' as const },
  ]

  milestones.forEach(s => {
    badges.push({
      id: `milestone-${s.days}`,
      title: s.title,
      description: s.desc,
      icon: s.icon,
      earned: streaks.totalDaysLogged >= s.days,
      earnedDate: streaks.totalDaysLogged >= s.days ? today : undefined,
      tier: s.tier,
    })
  })

  return badges
}

export { INITIAL_STREAKS }
