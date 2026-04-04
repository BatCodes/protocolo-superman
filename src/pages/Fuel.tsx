import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import type { ScannedMeal } from '../lib/types'
import { callClaude, fileToBase64, hasApiKey } from '../lib/api'
import { save } from '../lib/storage'
import { Ring } from '../components/ui/Ring'
import type { MealPlan } from '../lib/profile'

interface FuelProps {
  scannedMeals: ScannedMeal[]
  setScannedMeals: React.Dispatch<React.SetStateAction<ScannedMeal[]>>
  macroTargets: { kcal: number; protein: number; carbs: number; fat: number; water: number }
  checks: Record<string, boolean>
  toggle: (id: string) => void
  mealPlan: MealPlan[]
}

const TODAY = new Date().toISOString().slice(0, 10)

export function Fuel({ scannedMeals, setScannedMeals, macroTargets, checks, toggle, mealPlan }: FuelProps) {
  const [scanning, setScanning] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [result, setResult] = useState<Omit<ScannedMeal, 'date' | 'time' | 'photo'> | null>(null)
  const [desc, setDesc] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const todayMeals = scannedMeals.filter(m => m.date === TODAY)

  // Scanned meal totals
  const scannedTotals = todayMeals.reduce(
    (acc, m) => ({
      kcal: acc.kcal + m.kcal,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fat: acc.fat + m.fat,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  )

  // Checked meal plan totals (approximate from kcalPct)
  const checkedMealTotals = mealPlan.reduce(
    (acc, meal, i) => {
      if (meal.type !== 'meal' || !checks[`meal-${i}`] || !meal.kcalPct) return acc
      const mealKcal = Math.round((meal.kcalPct / 100) * macroTargets.kcal)
      const mealProtein = Math.round((meal.kcalPct / 100) * macroTargets.protein)
      const mealCarbs = Math.round((meal.kcalPct / 100) * macroTargets.carbs)
      const mealFat = Math.round((meal.kcalPct / 100) * macroTargets.fat)
      return {
        kcal: acc.kcal + mealKcal,
        protein: acc.protein + mealProtein,
        carbs: acc.carbs + mealCarbs,
        fat: acc.fat + mealFat,
      }
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  )

  // Combined totals
  const totalKcal = scannedTotals.kcal + checkedMealTotals.kcal
  const totalProtein = scannedTotals.protein + checkedMealTotals.protein
  const totalCarbs = scannedTotals.carbs + checkedMealTotals.carbs
  const totalFat = scannedTotals.fat + checkedMealTotals.fat

  // Ring percentages
  const kcalPct = macroTargets.kcal > 0 ? Math.round((totalKcal / macroTargets.kcal) * 100) : 0
  const proteinPct = macroTargets.protein > 0 ? Math.round((totalProtein / macroTargets.protein) * 100) : 0
  const carbsPct = macroTargets.carbs > 0 ? Math.round((totalCarbs / macroTargets.carbs) * 100) : 0

  // Water tracker
  const waterGlasses = 8
  const waterPerGlass = macroTargets.water / waterGlasses
  const filledGlasses = Array.from({ length: waterGlasses }).filter((_, i) => checks[`water-${i}`]).length
  const waterConsumed = Math.round(filledGlasses * waterPerGlass * 10) / 10
  const waterTarget = macroTargets.water

  const scan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !hasApiKey()) return
    setScanning(true)
    setResult(null)
    const b64 = await fileToBase64(file)
    const mt = file.type || 'image/jpeg'
    setPreview(`data:${mt};base64,${b64}`)

    try {
      const text = await callClaude(
        [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mt, data: b64 } },
            { type: 'text', text: `Analiza comida. ${desc || ''}. Solo JSON.` },
          ] as any,
        }],
        'Nutricionista experto. Analiza foto comida. SOLO JSON: {"description":"...","kcal":N,"protein":N,"carbs":N,"fat":N,"confidence":"high|medium|low","notes":"..."}',
      )
      setResult(JSON.parse(text.replace(/```json|```/g, '').trim()))
    } catch {
      setResult({ description: 'Error al analizar', kcal: 0, protein: 0, carbs: 0, fat: 0, confidence: 'low', notes: 'Reintenta' })
    }
    setScanning(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const saveMeal = async () => {
    if (!result) return
    const meal: ScannedMeal = {
      ...result,
      date: TODAY,
      time: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }),
      photo: preview || undefined,
    }
    const updated = [...scannedMeals, meal]
    setScannedMeals(updated)
    await save('scanned-meals', updated)
    setResult(null)
    setPreview(null)
    setDesc('')
  }

  const macroRows: { label: string; current: number; target: number; color: string }[] = [
    { label: 'Proteina', current: totalProtein, target: macroTargets.protein, color: '#64d2ff' },
    { label: 'Carbos', current: totalCarbs, target: macroTargets.carbs, color: '#ff9f0a' },
    { label: 'Grasa', current: totalFat, target: macroTargets.fat, color: '#ffd60a' },
  ]

  return (
    <div className="pb-28 space-y-4">
      {/* Activity Rings */}
      <div className="bg-[#1c1c1e] rounded-2xl pt-2 pb-4">
        <div className="relative flex items-center justify-center py-6">
          <Ring pct={kcalPct} size={140} strokeWidth={12} color="#30d158">
            <Ring pct={proteinPct} size={110} strokeWidth={12} color="#64d2ff">
              <Ring pct={carbsPct} size={80} strokeWidth={12} color="#ff9f0a">
                <div className="text-center">
                  <div className="text-[24px] font-black mono text-white">{totalKcal}</div>
                  <div className="text-[10px] text-zinc-500">/ {macroTargets.kcal}</div>
                </div>
              </Ring>
            </Ring>
          </Ring>
        </div>

        {/* Ring legend */}
        <div className="flex justify-center gap-5 px-4">
          {[
            { label: 'Kcal', color: '#30d158' },
            { label: 'Prot', color: '#64d2ff' },
            { label: 'Carbs', color: '#ff9f0a' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-[11px] text-zinc-400">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Daily macro breakdown */}
      <div className="bg-[#1c1c1e] rounded-2xl p-4 space-y-3">
        <div className="text-[13px] font-semibold text-zinc-400 uppercase tracking-wider">
          Macros Diarios
        </div>
        {macroRows.map((row) => {
          const pct = row.target > 0 ? Math.min((row.current / row.target) * 100, 100) : 0
          return (
            <div key={row.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[14px] text-white">{row.label}</span>
                <span className="text-[14px] mono" style={{ color: row.color }}>
                  {row.current}/{row.target}g
                </span>
              </div>
              <div className="h-[6px] rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: row.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Water tracker */}
      <div className="bg-[#1c1c1e] rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[13px] font-semibold text-zinc-400 uppercase tracking-wider">
            Agua
          </div>
          <div className="text-[14px] mono" style={{ color: '#64d2ff' }}>
            {waterConsumed}L / {waterTarget}L
          </div>
        </div>
        <div className="flex justify-between gap-2">
          {Array.from({ length: waterGlasses }).map((_, i) => {
            const filled = checks[`water-${i}`]
            return (
              <button
                key={i}
                onClick={() => toggle(`water-${i}`)}
                className="flex-1 aspect-square rounded-full transition-all duration-200 active:scale-90"
                style={{
                  backgroundColor: filled ? '#64d2ff' : 'transparent',
                  border: filled ? '2px solid #64d2ff' : '2px solid rgba(255,255,255,0.12)',
                  boxShadow: filled ? '0 0 10px rgba(100,210,255,0.3)' : 'none',
                }}
              />
            )
          })}
        </div>
      </div>

      {/* Meal Scanner section */}
      <p className="text-[13px] font-semibold text-zinc-400 uppercase tracking-wider px-4 mb-2">
        Meal Scanner
      </p>

      {/* Camera / Gallery buttons */}
      <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={scan} className="hidden" />

      <div className="grid grid-cols-2 gap-3">
        <button
          className="press bg-[#1c1c1e] rounded-2xl p-6 text-center active:scale-[0.97] transition-transform"
          onClick={() => fileRef.current?.click()}
        >
          <div className="text-3xl mb-2">📸</div>
          <div className="text-[13px] font-semibold" style={{ color: '#30d158' }}>Camara</div>
        </button>
        <button
          className="press bg-[#1c1c1e] rounded-2xl p-6 text-center active:scale-[0.97] transition-transform"
          onClick={() => {
            const inp = document.createElement('input')
            inp.type = 'file'
            inp.accept = 'image/*'
            inp.onchange = scan as any
            inp.click()
          }}
        >
          <div className="text-3xl mb-2">🖼️</div>
          <div className="text-[13px] font-semibold" style={{ color: '#bf5af2' }}>Galeria</div>
        </button>
      </div>

      {/* Optional description */}
      <input
        value={desc}
        onChange={e => setDesc(e.target.value)}
        placeholder="Descripcion opcional..."
        className="w-full bg-[#1c1c1e] text-white px-4 py-3 text-[15px] rounded-2xl outline-none"
      />

      {/* Scanning state */}
      {scanning && (
        <div className="bg-[#1c1c1e] rounded-2xl p-6 text-center">
          <div className="text-[15px] font-semibold animate-pulse" style={{ color: '#ffd60a' }}>
            Analizando comida...
          </div>
        </div>
      )}

      {/* Result card */}
      {preview && result && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="bg-[#1c1c1e] rounded-2xl overflow-hidden">
            <img src={preview} alt="" className="w-full h-40 object-cover" />
            <div className="p-4">
              <div className="text-[15px] font-semibold text-white mb-3">{result.description}</div>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[
                  { l: 'KCAL', v: result.kcal, c: '#30d158' },
                  { l: 'P', v: `${result.protein}g`, c: '#64d2ff' },
                  { l: 'C', v: `${result.carbs}g`, c: '#ff9f0a' },
                  { l: 'F', v: `${result.fat}g`, c: '#ffd60a' },
                ].map((m, i) => (
                  <div key={i} className="text-center">
                    <div className="text-[17px] font-bold mono" style={{ color: m.c }}>{m.v}</div>
                    <div className="text-[11px] text-zinc-500">{m.l}</div>
                  </div>
                ))}
              </div>
              {result.notes && (
                <div className="text-[13px] text-zinc-500 mb-4">{result.notes}</div>
              )}
              <button
                onClick={saveMeal}
                className="press w-full py-3.5 rounded-2xl text-[15px] font-semibold transition-all active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #30d158, #28a745)', color: '#fff' }}
              >
                Registrar Comida
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Today's meals log */}
      {todayMeals.length > 0 && (
        <>
          <p className="text-[13px] font-semibold text-zinc-400 uppercase tracking-wider px-4 mb-2">
            Registro Hoy — {todayMeals.length} comidas
          </p>
          <div className="bg-[#1c1c1e] rounded-2xl overflow-hidden">
            {todayMeals.map((m, i) => (
              <div
                key={i}
                className="flex gap-3 px-4 py-3 items-center"
                style={i < todayMeals.length - 1 ? { borderBottom: '0.33px solid rgba(255,255,255,0.08)' } : undefined}
              >
                {m.photo && (
                  <img src={m.photo} alt="" className="w-11 h-11 object-cover rounded-xl flex-shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] text-white truncate">{m.description}</div>
                  <div className="text-[13px] text-zinc-500 mono">
                    {m.time} · {m.kcal}kcal · {m.protein}P · {m.carbs}C · {m.fat}F
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* No API key warning */}
      {!hasApiKey() && (
        <div className="bg-[#1c1c1e] rounded-2xl p-4 text-center">
          <div className="text-[13px] text-zinc-500">
            Configura tu API key en ajustes para usar el scanner IA
          </div>
        </div>
      )}
    </div>
  )
}
