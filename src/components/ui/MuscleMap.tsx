interface MuscleMapProps {
  muscleIds: number[]  // IDs of muscles to highlight
  color?: string
  size?: number
}

// Muscle IDs:
// Front: 1=Chest, 2=Shoulders, 3=Biceps, 4=Abs, 5=Quads, 6=Forearms
// Back: 7=Traps, 8=Lats, 9=Triceps, 10=Lower Back, 11=Glutes, 12=Hamstrings, 13=Calves

export function MuscleMap({ muscleIds, color = '#30d158', size = 120 }: MuscleMapProps) {
  const active = new Set(muscleIds)
  const dim = 'rgba(255,255,255,0.06)'
  const glow = color

  const getColor = (id: number) => active.has(id) ? glow : dim
  const halfW = size / 2 - 4

  return (
    <div className="flex gap-2 justify-center">
      {/* Front view */}
      <svg width={halfW} height={size} viewBox="0 0 60 120">
        {/* Head */}
        <circle cx="30" cy="10" r="7" fill={dim} />
        {/* Neck */}
        <rect x="27" y="17" width="6" height="5" rx="2" fill={dim} />
        {/* Shoulders */}
        <ellipse cx="16" cy="28" rx="7" ry="5" fill={getColor(2)} />
        <ellipse cx="44" cy="28" rx="7" ry="5" fill={getColor(2)} />
        {/* Chest */}
        <ellipse cx="23" cy="35" rx="8" ry="7" fill={getColor(1)} />
        <ellipse cx="37" cy="35" rx="8" ry="7" fill={getColor(1)} />
        {/* Biceps */}
        <ellipse cx="11" cy="42" rx="4" ry="9" fill={getColor(3)} />
        <ellipse cx="49" cy="42" rx="4" ry="9" fill={getColor(3)} />
        {/* Abs */}
        <rect x="22" y="42" width="16" height="18" rx="4" fill={getColor(4)} />
        {/* Forearms */}
        <ellipse cx="8" cy="58" rx="3" ry="8" fill={getColor(6)} />
        <ellipse cx="52" cy="58" rx="3" ry="8" fill={getColor(6)} />
        {/* Quads */}
        <ellipse cx="22" cy="72" rx="7" ry="14" fill={getColor(5)} />
        <ellipse cx="38" cy="72" rx="7" ry="14" fill={getColor(5)} />
        {/* Shins / Calves front */}
        <ellipse cx="21" cy="98" rx="5" ry="13" fill={getColor(13)} />
        <ellipse cx="39" cy="98" rx="5" ry="13" fill={getColor(13)} />
      </svg>

      {/* Back view */}
      <svg width={halfW} height={size} viewBox="0 0 60 120">
        {/* Head */}
        <circle cx="30" cy="10" r="7" fill={dim} />
        {/* Neck */}
        <rect x="27" y="17" width="6" height="5" rx="2" fill={dim} />
        {/* Traps */}
        <path d="M20 22 Q30 18 40 22 L38 30 Q30 28 22 30 Z" fill={getColor(7)} />
        {/* Shoulders back */}
        <ellipse cx="16" cy="28" rx="7" ry="5" fill={getColor(2)} />
        <ellipse cx="44" cy="28" rx="7" ry="5" fill={getColor(2)} />
        {/* Triceps */}
        <ellipse cx="11" cy="42" rx="4" ry="9" fill={getColor(9)} />
        <ellipse cx="49" cy="42" rx="4" ry="9" fill={getColor(9)} />
        {/* Lats */}
        <ellipse cx="22" cy="38" rx="7" ry="9" fill={getColor(8)} />
        <ellipse cx="38" cy="38" rx="7" ry="9" fill={getColor(8)} />
        {/* Lower back */}
        <ellipse cx="30" cy="50" rx="8" ry="7" fill={getColor(10)} />
        {/* Glutes */}
        <ellipse cx="23" cy="62" rx="8" ry="6" fill={getColor(11)} />
        <ellipse cx="37" cy="62" rx="8" ry="6" fill={getColor(11)} />
        {/* Hamstrings */}
        <ellipse cx="22" cy="78" rx="6" ry="12" fill={getColor(12)} />
        <ellipse cx="38" cy="78" rx="6" ry="12" fill={getColor(12)} />
        {/* Calves */}
        <ellipse cx="21" cy="98" rx="5" ry="13" fill={getColor(13)} />
        <ellipse cx="39" cy="98" rx="5" ry="13" fill={getColor(13)} />
      </svg>
    </div>
  )
}
