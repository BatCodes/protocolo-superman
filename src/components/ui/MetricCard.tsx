import { Spark } from './Spark'

interface MetricCardProps {
  label: string
  value: number | null
  unit: string
  color: string
  trend?: number[]
  isEditing: boolean
  onToggleEdit: () => void
}

export function MetricCard({ label, value, unit, color, trend, isEditing, onToggleEdit }: MetricCardProps) {
  return (
    <button
      onClick={onToggleEdit}
      className={`
        bg-[#0d0d0d]/80 backdrop-blur-xl text-left w-full p-3 rounded-xl
        transition-all duration-200
        ${isEditing
          ? 'border-2 ring-1 ring-opacity-30'
          : 'border border-white/[0.06] hover:border-white/10'
        }
      `}
      style={isEditing ? { borderColor: color + '60', '--tw-ring-color': color } as React.CSSProperties : undefined}
    >
      <div className="text-[9px] font-mono text-zinc-500 mb-0.5">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className="text-[17px] font-extrabold font-mono text-zinc-200">
          {value ?? '—'}
        </span>
        <span className="text-[9px] text-zinc-500">{unit}</span>
      </div>
      {trend && trend.length > 1 && (
        <div className="mt-1">
          <Spark data={trend} color={color} height={18} />
        </div>
      )}
    </button>
  )
}
