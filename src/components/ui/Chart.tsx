import { motion } from 'framer-motion'

interface ChartProps {
  data: { date: string; value: number }[]
  color?: string
  height?: number
  showArea?: boolean
  showDots?: boolean
  showLabels?: boolean
  unit?: string
}

export function Chart({
  data,
  color = '#30d158',
  height = 120,
  showArea = true,
  showDots = true,
  showLabels = true,
  unit = ''
}: ChartProps) {
  if (!data || data.length < 2) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-[13px] text-zinc-600">
        Datos insuficientes
      </div>
    )
  }

  const values = data.map(d => d.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const width = 100 // viewBox percentage
  const chartHeight = 100

  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * width,
    y: chartHeight - ((d.value - min) / range) * (chartHeight * 0.8) - chartHeight * 0.1,
    value: d.value,
    date: d.date,
  }))

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = `${linePath} L ${width} ${chartHeight} L 0 ${chartHeight} Z`

  // Show first, middle, last labels
  const labelIndices = [0, Math.floor(data.length / 2), data.length - 1]

  return (
    <div style={{ height: height + (showLabels ? 24 : 0) }}>
      {/* Value labels */}
      <div className="flex justify-between mb-1 px-1">
        <span className="text-[11px] text-zinc-600 mono">{min.toFixed(1)}{unit}</span>
        <span className="text-[11px] font-semibold mono" style={{ color }}>
          {values[values.length - 1].toFixed(1)}{unit}
        </span>
        <span className="text-[11px] text-zinc-600 mono">{max.toFixed(1)}{unit}</span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${chartHeight}`}
        preserveAspectRatio="none"
        style={{ height, width: '100%', display: 'block' }}
      >
        {/* Gradient fill */}
        <defs>
          <linearGradient id={`grad-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        {showArea && (
          <motion.path
            d={areaPath}
            fill={`url(#grad-${color.replace('#','')})`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          />
        )}

        {/* Line */}
        <motion.path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />

        {/* Dots */}
        {showDots && points.length <= 30 && points.map((p, i) => (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="1.5"
            fill={color}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>

      {/* Date labels */}
      {showLabels && (
        <div className="flex justify-between mt-1 px-1">
          {labelIndices.map(i => (
            <span key={i} className="text-[10px] text-zinc-600">
              {data[i]?.date.slice(5) || ''}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
