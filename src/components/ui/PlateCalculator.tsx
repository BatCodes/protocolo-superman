import { useState } from 'react'
import { motion } from 'framer-motion'

interface PlateCalculatorProps {
  weight?: number // pre-fill from last set
}

const BAR_WEIGHT = 20 // Olympic bar in kg
const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25] // available plates in kg
const PLATE_COLORS: Record<number, string> = {
  25: '#ff453a',
  20: '#0a84ff',
  15: '#ffd60a',
  10: '#30d158',
  5: '#fff',
  2.5: '#ff453a',
  1.25: '#8e8e93',
}

function calculatePlates(targetWeight: number): { plates: number[]; achievable: number } {
  const perSide = (targetWeight - BAR_WEIGHT) / 2
  if (perSide <= 0) return { plates: [], achievable: BAR_WEIGHT }

  const result: number[] = []
  let remaining = perSide

  for (const plate of PLATES) {
    while (remaining >= plate) {
      result.push(plate)
      remaining -= plate
    }
  }

  const achievable = BAR_WEIGHT + (perSide - remaining) * 2
  return { plates: result, achievable }
}

export function PlateCalculator({ weight: initialWeight }: PlateCalculatorProps) {
  const [target, setTarget] = useState(initialWeight || 60)
  const { plates, achievable } = calculatePlates(target)

  return (
    <div className="bg-[#1c1c1e] rounded-2xl p-4">
      <div className="text-[13px] text-zinc-500 mb-3">Calculador de Discos</div>

      {/* Weight input */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => setTarget(Math.max(BAR_WEIGHT, target - 2.5))}
          className="press w-10 h-10 rounded-full bg-[#2c2c2e] flex items-center justify-center text-[20px] text-white font-light"
        >
          −
        </button>
        <div className="flex-1 text-center">
          <div className="text-[32px] font-black mono text-white">{target}</div>
          <div className="text-[11px] text-zinc-600">kg total</div>
        </div>
        <button
          onClick={() => setTarget(target + 2.5)}
          className="press w-10 h-10 rounded-full bg-[#2c2c2e] flex items-center justify-center text-[20px] text-white font-light"
        >
          +
        </button>
      </div>

      {/* Visual barbell */}
      <div className="flex items-center justify-center gap-0 mb-4 h-16 overflow-hidden">
        {/* Left plates (reversed) */}
        <div className="flex items-center flex-row-reverse">
          {plates.map((p, i) => (
            <motion.div
              key={`l-${i}`}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-sm flex items-center justify-center"
              style={{
                width: Math.max(6, p * 1.2),
                height: 20 + p * 1.4,
                background: PLATE_COLORS[p] || '#8e8e93',
                marginRight: 1,
                opacity: p <= 5 ? 0.7 : 1,
              }}
            >
              {p >= 10 && <span className="text-[6px] font-bold text-black rotate-90">{p}</span>}
            </motion.div>
          ))}
        </div>

        {/* Bar */}
        <div className="w-8 h-2 bg-zinc-500 rounded-full" />
        <div className="w-2 h-6 bg-zinc-400 rounded" />
        <div className="w-24 h-1.5 bg-zinc-500" />
        <div className="w-2 h-6 bg-zinc-400 rounded" />
        <div className="w-8 h-2 bg-zinc-500 rounded-full" />

        {/* Right plates */}
        <div className="flex items-center">
          {plates.map((p, i) => (
            <motion.div
              key={`r-${i}`}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-sm flex items-center justify-center"
              style={{
                width: Math.max(6, p * 1.2),
                height: 20 + p * 1.4,
                background: PLATE_COLORS[p] || '#8e8e93',
                marginLeft: 1,
                opacity: p <= 5 ? 0.7 : 1,
              }}
            >
              {p >= 10 && <span className="text-[6px] font-bold text-black rotate-90">{p}</span>}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Plate list per side */}
      <div style={{ borderTop: '0.33px solid rgba(255,255,255,0.08)' }} className="pt-3">
        <div className="text-[11px] text-zinc-600 mb-2">Por cada lado (barra {BAR_WEIGHT}kg):</div>
        {plates.length === 0 ? (
          <div className="text-[13px] text-zinc-500">Solo la barra ({BAR_WEIGHT}kg)</div>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {plates.map((p, i) => (
              <span
                key={i}
                className="text-[13px] font-semibold px-3 py-1 rounded-full mono"
                style={{ background: (PLATE_COLORS[p] || '#8e8e93') + '20', color: PLATE_COLORS[p] || '#8e8e93' }}
              >
                {p}kg
              </span>
            ))}
          </div>
        )}
        {achievable !== target && (
          <div className="text-[11px] text-zinc-600 mt-2">
            Peso alcanzable más cercano: <span className="mono text-white">{achievable}kg</span>
          </div>
        )}
      </div>
    </div>
  )
}
