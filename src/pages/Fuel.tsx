import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import type { ScannedMeal } from '../lib/types'
import { callClaude, fileToBase64, hasApiKey } from '../lib/api'
import { save } from '../lib/storage'

interface FuelProps {
  scannedMeals: ScannedMeal[]
  setScannedMeals: React.Dispatch<React.SetStateAction<ScannedMeal[]>>
}

const TODAY = new Date().toISOString().slice(0, 10)

export function Fuel({ scannedMeals, setScannedMeals }: FuelProps) {
  const [scanning, setScanning] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [result, setResult] = useState<Omit<ScannedMeal, 'date' | 'time' | 'photo'> | null>(null)
  const [desc, setDesc] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const todayMeals = scannedMeals.filter(m => m.date === TODAY)
  const totals = todayMeals.reduce(
    (acc, m) => ({
      kcal: acc.kcal + m.kcal,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fat: acc.fat + m.fat,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  )

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

  return (
    <div className="pb-28 space-y-4">
      <p className="text-[13px] font-semibold text-zinc-400 uppercase tracking-wider px-4 mb-2">
        Meal Scanner
      </p>

      {/* Daily totals */}
      {todayMeals.length > 0 && (
        <div className="bg-[#1c1c1e] rounded-2xl p-4">
          <div className="text-[13px] text-zinc-500 mb-3">Hoy — Totales</div>
          <div className="grid grid-cols-4 gap-3">
            {[
              { l: 'KCAL', v: totals.kcal, c: '#30d158' },
              { l: 'PROT', v: `${totals.protein}g`, c: '#64d2ff' },
              { l: 'CARB', v: `${totals.carbs}g`, c: '#ff9f0a' },
              { l: 'FAT', v: `${totals.fat}g`, c: '#ffd60a' },
            ].map((m, i) => (
              <div key={i} className="text-center">
                <div className="text-[18px] font-bold mono" style={{ color: m.c }}>{m.v}</div>
                <div className="text-[11px] text-zinc-500">{m.l}</div>
              </div>
            ))}
          </div>
        </div>
      )}

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
