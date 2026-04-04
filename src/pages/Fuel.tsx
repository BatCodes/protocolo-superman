import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import type { ScannedMeal } from '../lib/types'
import { callClaude, fileToBase64, hasApiKey } from '../lib/api'
import { save } from '../lib/storage'
import { GlassCard } from '../components/ui/GlassCard'
import { Section } from '../components/ui/Section'

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
    // Reset file input
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
    <div className="pb-28 space-y-3">
      <Section title="MEAL SCANNER" color="#16a34a" />

      {/* Daily totals */}
      {todayMeals.length > 0 && (
        <GlassCard className="p-3.5">
          <div className="text-[8px] text-zinc-500 font-mono tracking-wider mb-2">HOY — TOTALES</div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { l: 'KCAL', v: totals.kcal, c: '#16a34a' },
              { l: 'PROT', v: `${totals.protein}g`, c: '#06b6d4' },
              { l: 'CARB', v: `${totals.carbs}g`, c: '#ea580c' },
              { l: 'FAT', v: `${totals.fat}g`, c: '#c9a227' },
            ].map((m, i) => (
              <div key={i} className="text-center p-2 rounded-lg" style={{ background: m.c + '10' }}>
                <div className="text-[16px] font-black font-mono" style={{ color: m.c }}>{m.v}</div>
                <div className="text-[7px] font-mono text-zinc-500">{m.l}</div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Camera / Gallery buttons */}
      <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={scan} className="hidden" />

      <div className="grid grid-cols-2 gap-2">
        <GlassCard
          className="p-5 text-center"
          glowColor="#16a34a"
          onClick={() => fileRef.current?.click()}
        >
          <div className="text-2xl mb-1">📸</div>
          <div className="text-[10px] font-bold font-mono" style={{ color: '#16a34a' }}>CÁMARA</div>
        </GlassCard>
        <GlassCard
          className="p-5 text-center"
          glowColor="#8b5cf6"
          onClick={() => {
            const inp = document.createElement('input')
            inp.type = 'file'
            inp.accept = 'image/*'
            inp.onchange = scan as any
            inp.click()
          }}
        >
          <div className="text-2xl mb-1">🖼️</div>
          <div className="text-[10px] font-bold font-mono" style={{ color: '#8b5cf6' }}>GALERÍA</div>
        </GlassCard>
      </div>

      {/* Optional description */}
      <input
        value={desc}
        onChange={e => setDesc(e.target.value)}
        placeholder="Descripción opcional..."
        className="w-full bg-[#0d0d0d] border border-white/[0.06] text-zinc-200 px-3.5 py-2.5 text-[12px] rounded-xl outline-none focus:border-[#c9a227]/30 transition-colors"
      />

      {/* Scanning state */}
      {scanning && (
        <GlassCard className="p-6 text-center">
          <div className="text-[11px] font-mono animate-pulse" style={{ color: '#c9a227' }}>
            ANALIZANDO COMIDA...
          </div>
        </GlassCard>
      )}

      {/* Result card */}
      {preview && result && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <GlassCard className="overflow-hidden" glowColor="#16a34a">
            <img src={preview} alt="" className="w-full h-36 object-cover" />
            <div className="p-3.5">
              <div className="text-[12px] font-bold text-zinc-200 mb-2">{result.description}</div>
              <div className="grid grid-cols-4 gap-1.5 mb-3">
                {[
                  { l: 'KCAL', v: result.kcal, c: '#16a34a' },
                  { l: 'P', v: `${result.protein}g`, c: '#06b6d4' },
                  { l: 'C', v: `${result.carbs}g`, c: '#ea580c' },
                  { l: 'F', v: `${result.fat}g`, c: '#c9a227' },
                ].map((m, i) => (
                  <div key={i} className="text-center p-2 rounded-lg" style={{ background: m.c + '10' }}>
                    <div className="text-[15px] font-black font-mono" style={{ color: m.c }}>{m.v}</div>
                    <div className="text-[7px] font-mono text-zinc-500">{m.l}</div>
                  </div>
                ))}
              </div>
              {result.notes && (
                <div className="text-[9px] text-zinc-500 mb-3">{result.notes}</div>
              )}
              <button
                onClick={saveMeal}
                className="w-full py-2.5 rounded-xl text-[11px] font-black font-mono transition-all active:scale-[0.98]"
                style={{ background: '#16a34a', color: '#000' }}
              >
                ✓ REGISTRAR COMIDA
              </button>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Today's meals log */}
      {todayMeals.length > 0 && (
        <>
          <Section title="REGISTRO HOY" color="#c9a227" right={`${todayMeals.length} comidas`} />
          {todayMeals.map((m, i) => (
            <GlassCard key={i} className="flex gap-3 p-3 items-center">
              {m.photo && (
                <img src={m.photo} alt="" className="w-11 h-11 object-cover rounded-lg flex-shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <div className="text-[11px] text-zinc-200 truncate">{m.description}</div>
                <div className="text-[9px] text-zinc-500 font-mono">
                  {m.time} · {m.kcal}kcal · {m.protein}P · {m.carbs}C · {m.fat}F
                </div>
              </div>
            </GlassCard>
          ))}
        </>
      )}

      {/* No API key warning */}
      {!hasApiKey() && (
        <GlassCard className="p-4 text-center">
          <div className="text-[10px] text-zinc-500">
            Configura tu API key en ajustes para usar el scanner IA
          </div>
        </GlassCard>
      )}
    </div>
  )
}
