import { useMemo } from 'react'
import type { WorkoutLog } from '../../lib/types'
import { WORKOUTS } from '../../lib/constants'

interface MuscleHeatmapProps {
  wkLog: WorkoutLog
  size?: number
}

// Map exercises to muscle groups with volume contribution
const EXERCISE_MUSCLES: Record<string, { primary: string[]; volume: number }> = {
  'Bench Press': { primary: ['chest', 'front-delt', 'triceps'], volume: 1.0 },
  'OHP': { primary: ['shoulders', 'triceps', 'traps'], volume: 1.0 },
  'Incline DB Press': { primary: ['upper-chest', 'front-delt'], volume: 0.8 },
  'Weighted Dips': { primary: ['chest', 'triceps'], volume: 0.8 },
  'Lateral Raise': { primary: ['side-delt'], volume: 0.6 },
  'Tricep Ext': { primary: ['triceps'], volume: 0.5 },
  'Chest Fly': { primary: ['chest'], volume: 0.5 },
  'Deadlift': { primary: ['back', 'glutes', 'hamstrings', 'traps'], volume: 1.2 },
  'Barbell Row': { primary: ['lats', 'rhomboids', 'biceps'], volume: 1.0 },
  'Weighted Pull-ups': { primary: ['lats', 'biceps'], volume: 1.0 },
  'Face Pulls': { primary: ['rear-delt', 'rhomboids'], volume: 0.4 },
  'Heavy Shrugs': { primary: ['traps'], volume: 0.7 },
  'BB Curl': { primary: ['biceps'], volume: 0.5 },
  'Hammer Curl': { primary: ['biceps', 'forearms'], volume: 0.5 },
  'Back Squat': { primary: ['quads', 'glutes', 'hamstrings'], volume: 1.2 },
  'RDL': { primary: ['hamstrings', 'glutes', 'lower-back'], volume: 1.0 },
  'Leg Press': { primary: ['quads', 'glutes'], volume: 0.8 },
  'Lunges': { primary: ['quads', 'glutes'], volume: 0.7 },
  'Leg Curl': { primary: ['hamstrings'], volume: 0.5 },
  'Calf Raise': { primary: ['calves'], volume: 0.5 },
  'Hanging Leg Raise': { primary: ['abs'], volume: 0.5 },
}

// Calculate volume per muscle from workout log
function computeMuscleVolume(wkLog: WorkoutLog): Record<string, number> {
  const volume: Record<string, number> = {}
  const splits = ['PUSH', 'PULL', 'LEGS']

  for (const split of splits) {
    const exercises = WORKOUTS[split] || []
    exercises.forEach((ex, idx) => {
      const mapping = EXERCISE_MUSCLES[ex.n]
      if (!mapping) return

      // Sum all volume for this exercise across all dates
      let totalVol = 0
      Object.entries(wkLog).forEach(([key, sets]) => {
        if (key.includes(`-${split}-${idx}`)) {
          sets.forEach(s => { totalVol += (s.w || 0) * (s.r || 0) })
        }
      })

      mapping.primary.forEach(muscle => {
        volume[muscle] = (volume[muscle] || 0) + totalVol * mapping.volume
      })
    })
  }

  return volume
}

// Map volume to intensity (0-1)
function normalizeVolume(volume: Record<string, number>): Record<string, number> {
  const values = Object.values(volume)
  if (values.length === 0) return {}
  const max = Math.max(...values)
  if (max === 0) return {}

  const normalized: Record<string, number> = {}
  for (const [muscle, vol] of Object.entries(volume)) {
    normalized[muscle] = vol / max
  }
  return normalized
}

function intensityColor(intensity: number): string {
  if (intensity >= 0.8) return '#30d158'  // very trained
  if (intensity >= 0.6) return '#34c759'
  if (intensity >= 0.4) return '#64d2ff'  // moderate
  if (intensity >= 0.2) return '#0a84ff'
  if (intensity > 0) return '#48484a'     // light
  return 'rgba(255,255,255,0.04)'         // untrained
}

export function MuscleHeatmap({ wkLog, size = 160 }: MuscleHeatmapProps) {
  const volume = useMemo(() => computeMuscleVolume(wkLog), [wkLog])
  const intensity = useMemo(() => normalizeVolume(volume), [volume])

  const g = (muscle: string) => intensityColor(intensity[muscle] || 0)
  const dim = 'rgba(255,255,255,0.04)'
  const halfW = size / 2 - 8

  // Total volume for display
  const totalVolume = Object.values(volume).reduce((a, b) => a + b, 0)
  const dominantMuscle = Object.entries(volume).sort((a, b) => b[1] - a[1])[0]
  const weakestMuscle = Object.entries(volume).filter(([, v]) => v > 0).sort((a, b) => a[1] - b[1])[0]

  const muscleLabels: Record<string, string> = {
    'chest': 'Pecho', 'upper-chest': 'Pecho sup.', 'shoulders': 'Hombros',
    'front-delt': 'Delt. ant.', 'side-delt': 'Delt. lat.', 'rear-delt': 'Delt. post.',
    'triceps': 'Tríceps', 'biceps': 'Bíceps', 'forearms': 'Antebrazos',
    'lats': 'Dorsales', 'traps': 'Trapecios', 'rhomboids': 'Romboides',
    'back': 'Espalda', 'lower-back': 'Lumbar',
    'abs': 'Abdominales', 'quads': 'Cuádriceps', 'hamstrings': 'Isquios',
    'glutes': 'Glúteos', 'calves': 'Gemelos',
  }

  return (
    <div>
      {/* Body visualization */}
      <div className="flex gap-3 justify-center mb-4">
        {/* Front */}
        <div className="text-center">
          <div className="text-[10px] text-zinc-600 mb-1">Frontal</div>
          <svg width={halfW} height={size} viewBox="0 0 60 120">
            <circle cx="30" cy="10" r="7" fill={dim} />
            <rect x="27" y="17" width="6" height="5" rx="2" fill={dim} />
            <ellipse cx="16" cy="28" rx="7" ry="5" fill={g('shoulders')} />
            <ellipse cx="44" cy="28" rx="7" ry="5" fill={g('shoulders')} />
            <ellipse cx="23" cy="35" rx="8" ry="7" fill={g('chest')} />
            <ellipse cx="37" cy="35" rx="8" ry="7" fill={g('chest')} />
            <ellipse cx="11" cy="42" rx="4" ry="9" fill={g('biceps')} />
            <ellipse cx="49" cy="42" rx="4" ry="9" fill={g('biceps')} />
            <rect x="22" y="42" width="16" height="18" rx="4" fill={g('abs')} />
            <ellipse cx="8" cy="58" rx="3" ry="8" fill={g('forearms')} />
            <ellipse cx="52" cy="58" rx="3" ry="8" fill={g('forearms')} />
            <ellipse cx="22" cy="72" rx="7" ry="14" fill={g('quads')} />
            <ellipse cx="38" cy="72" rx="7" ry="14" fill={g('quads')} />
            <ellipse cx="21" cy="98" rx="5" ry="13" fill={g('calves')} />
            <ellipse cx="39" cy="98" rx="5" ry="13" fill={g('calves')} />
          </svg>
        </div>
        {/* Back */}
        <div className="text-center">
          <div className="text-[10px] text-zinc-600 mb-1">Posterior</div>
          <svg width={halfW} height={size} viewBox="0 0 60 120">
            <circle cx="30" cy="10" r="7" fill={dim} />
            <rect x="27" y="17" width="6" height="5" rx="2" fill={dim} />
            <path d="M20 22 Q30 18 40 22 L38 30 Q30 28 22 30 Z" fill={g('traps')} />
            <ellipse cx="16" cy="28" rx="7" ry="5" fill={g('rear-delt')} />
            <ellipse cx="44" cy="28" rx="7" ry="5" fill={g('rear-delt')} />
            <ellipse cx="11" cy="42" rx="4" ry="9" fill={g('triceps')} />
            <ellipse cx="49" cy="42" rx="4" ry="9" fill={g('triceps')} />
            <ellipse cx="22" cy="38" rx="7" ry="9" fill={g('lats')} />
            <ellipse cx="38" cy="38" rx="7" ry="9" fill={g('lats')} />
            <ellipse cx="30" cy="50" rx="8" ry="7" fill={g('lower-back')} />
            <ellipse cx="23" cy="62" rx="8" ry="6" fill={g('glutes')} />
            <ellipse cx="37" cy="62" rx="8" ry="6" fill={g('glutes')} />
            <ellipse cx="22" cy="78" rx="6" ry="12" fill={g('hamstrings')} />
            <ellipse cx="38" cy="78" rx="6" ry="12" fill={g('hamstrings')} />
            <ellipse cx="21" cy="98" rx="5" ry="13" fill={g('calves')} />
            <ellipse cx="39" cy="98" rx="5" ry="13" fill={g('calves')} />
          </svg>
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 mb-3">
        {[
          { c: '#30d158', l: 'Alto' },
          { c: '#64d2ff', l: 'Medio' },
          { c: '#48484a', l: 'Bajo' },
          { c: 'rgba(255,255,255,0.08)', l: 'Sin datos' },
        ].map(item => (
          <div key={item.l} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ background: item.c }} />
            <span className="text-[10px] text-zinc-600">{item.l}</span>
          </div>
        ))}
      </div>

      {/* Stats */}
      {totalVolume > 0 && (
        <div className="bg-[#2c2c2e] rounded-xl p-3 space-y-1.5">
          <div className="flex justify-between">
            <span className="text-[12px] text-zinc-500">Volumen total acumulado</span>
            <span className="text-[12px] mono text-white">{Math.round(totalVolume).toLocaleString()} kg</span>
          </div>
          {dominantMuscle && (
            <div className="flex justify-between">
              <span className="text-[12px] text-zinc-500">Más desarrollado</span>
              <span className="text-[12px] mono" style={{ color: '#30d158' }}>{muscleLabels[dominantMuscle[0]] || dominantMuscle[0]}</span>
            </div>
          )}
          {weakestMuscle && dominantMuscle && weakestMuscle[0] !== dominantMuscle[0] && (
            <div className="flex justify-between">
              <span className="text-[12px] text-zinc-500">Necesita más trabajo</span>
              <span className="text-[12px] mono" style={{ color: '#ff9f0a' }}>{muscleLabels[weakestMuscle[0]] || weakestMuscle[0]}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
