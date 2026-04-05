import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ScannedMeal } from '../lib/types'
import type { MealPlan } from '../lib/profile'
import { generateMealPlan, computeMacros } from '../lib/profile'
import { WORKOUTS } from '../lib/constants'
import type { FoodItem, DiaryEntry } from '../lib/fooddb'
import { searchFoods, lookupBarcode, getRecentFoods, getDiaryTotals, quickAddFood } from '../lib/fooddb'
import { callClaude, fileToBase64, hasApiKey } from '../lib/api'
import { load, save } from '../lib/storage'
import { Ring } from '../components/ui/Ring'

interface FuelProps {
  scannedMeals: ScannedMeal[]
  setScannedMeals: React.Dispatch<React.SetStateAction<ScannedMeal[]>>
  macroTargets: { kcal: number; protein: number; carbs: number; fat: number; water: number }
  checks: Record<string, boolean>
  toggle: (id: string) => void
  mealPlan: MealPlan[]
  profile: import('../lib/profile').UserProfile | null
  wkLog: import('../lib/types').WorkoutLog
  plan: import('../lib/types').Plan
}

type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snacks'

const MEAL_LABELS: Record<MealSlot, string> = {
  breakfast: 'Desayuno',
  lunch: 'Almuerzo',
  dinner: 'Cena',
  snacks: 'Snacks',
}

const MEAL_ICONS: Record<MealSlot, string> = {
  breakfast: '\u2600\uFE0F',
  lunch: '\uD83C\uDF5D',
  dinner: '\uD83C\uDF19',
  snacks: '\uD83C\uDF6A',
}

const SEPARATOR = { borderBottom: '0.5px solid rgba(255,255,255,0.06)' }

type ModalView = 'search' | 'barcode' | 'quickadd' | 'ai-scan' | 'food-detail'

export function Fuel({ scannedMeals, setScannedMeals, macroTargets, checks, toggle, mealPlan, profile, wkLog: _wkLog, plan }: FuelProps) {
  const TODAY_LOCAL = new Date().toLocaleDateString('sv')

  const [nutritionBriefing, setNutritionBriefing] = useState<string | null>(null)
  const [nbLoading, setNbLoading] = useState(false)

  // ── Diary state ──
  const [diary, setDiary] = useState<DiaryEntry[]>([])

  // ── Add food modal ──
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMeal, setModalMeal] = useState<MealSlot>('breakfast')
  const [modalView, setModalView] = useState<ModalView>('search')

  // ── Search ──
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<FoodItem[]>([])
  const [searching, setSearching] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Barcode scanner ──
  const scannerRef = useRef<any>(null)
  const [scannerActive, setScannerActive] = useState(false)

  // ── Food detail / confirm ──
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null)
  const [servings, setServings] = useState(1)

  // ── Quick add ──
  const [quickKcal, setQuickKcal] = useState('')
  const [quickProtein, setQuickProtein] = useState('')
  const [quickCarbs, setQuickCarbs] = useState('')
  const [quickFat, setQuickFat] = useState('')

  // ── AI scan ──
  const [aiScanning, setAiScanning] = useState(false)
  const [aiPreview, setAiPreview] = useState<string | null>(null)
  const [aiDesc, setAiDesc] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // ── Recent foods ──
  const [recentFoods, setRecentFoods] = useState<FoodItem[]>([])

  // ── Load diary from storage ──
  useEffect(() => {
    load<DiaryEntry[]>('food-diary', []).then(d => {
      setDiary(d)
      setRecentFoods(getRecentFoods(d))
    })
  }, [])

  // ── Save diary helper ──
  const saveDiary = useCallback(async (updated: DiaryEntry[]) => {
    setDiary(updated)
    setRecentFoods(getRecentFoods(updated))
    await save('food-diary', updated)
  }, [])

  // ── Week day selector (computed early so activeDayMacros is available) ──
  const [dayOffset, setDayOffset] = useState(() => {
    const now = new Date()
    const dow = now.getDay()
    return dow === 0 ? 6 : dow - 1
  })

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - d.getDay() + 1 + i)
    const dateStr = d.toISOString().slice(0, 10)
    const dayOfWeek = d.getDay()
    const isRest = dayOfWeek === 0
    const splits = ['REST', 'PUSH', 'PULL', 'LEGS', 'PUSH', 'PULL', 'LEGS']
    const split = splits[dayOfWeek === 0 ? 0 : dayOfWeek]
    const isToday = dateStr === TODAY_LOCAL
    return { date: dateStr, dayNum: d.getDate(), dayLabel: ['D','L','M','X','J','V','S'][dayOfWeek], isTraining: !isRest, split, isToday, index: i }
  })
  const selectedDay = weekDays[dayOffset] || weekDays.find(d => d.isToday) || weekDays[0]
  const isViewingToday = selectedDay.isToday
  const activeDayMacros = selectedDay.isTraining ? macroTargets : {
    kcal: Math.round(macroTargets.kcal * 0.85),
    protein: macroTargets.protein,
    carbs: Math.round(macroTargets.carbs * 0.7),
    fat: Math.round(macroTargets.fat * 1.1),
    water: macroTargets.water,
  }

  // Dynamic meal plan for the selected day — different meals per day
  const selectedDayOfWeek = (() => {
    const d = new Date()
    d.setDate(d.getDate() - d.getDay() + 1 + (dayOffset ?? 0))
    return d.getDay()
  })()

  const dayMealPlan = useMemo(() => {
    if (!profile) return mealPlan
    const dayMacros = computeMacros(profile, plan.phase, selectedDay.isTraining)
    return generateMealPlan(profile, dayMacros, selectedDay.isTraining, selectedDayOfWeek)
  }, [profile, selectedDay.isTraining, plan.phase, selectedDayOfWeek, mealPlan])

  useEffect(() => {
    if (!hasApiKey() || nutritionBriefing || !activeDayMacros.kcal) return
    setNbLoading(true)
    const mealsDone = mealPlan.filter((_, i) => checks[`meal-${i}`]).length
    callClaude(
      [{ role: 'user', content: `BRIEFING NUTRICIONAL. Objetivo: ${activeDayMacros.kcal}kcal, ${activeDayMacros.protein}P, ${activeDayMacros.carbs}C, ${activeDayMacros.fat}G. Comidas completadas: ${mealsDone}/${mealPlan.length}. Día ${selectedDay.isTraining ? 'de entrenamiento' : 'de descanso'}. Dame 3 bullets de prioridad nutricional para el resto del día. 60 palabras máx.` }],
      'Eres un nutricionista deportivo élite. Ultra-conciso.',
      250
    ).then(t => { setNutritionBriefing(t); setNbLoading(false) })
      .catch(() => setNbLoading(false))
  }, [activeDayMacros.kcal, selectedDay.isTraining])

  // ── Today's diary entries ──
  const todayEntries = diary.filter(e => e.date === TODAY_LOCAL)
  const todayTotals = getDiaryTotals(diary, TODAY_LOCAL)

  // ── Also include scanned meals in totals ──
  const todayScanned = scannedMeals.filter(m => m.date === TODAY_LOCAL)
  const scannedTotals = todayScanned.reduce(
    (acc, m) => ({ kcal: acc.kcal + m.kcal, protein: acc.protein + m.protein, carbs: acc.carbs + m.carbs, fat: acc.fat + m.fat }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  )

  // Checked meal plan totals
  const checkedMealTotals = mealPlan.reduce(
    (acc, meal, i) => {
      if (meal.type !== 'meal' || !checks[`meal-${i}`] || !meal.kcalPct) return acc
      const mealKcal = Math.round((meal.kcalPct / 100) * activeDayMacros.kcal)
      return {
        kcal: acc.kcal + mealKcal,
        protein: acc.protein + Math.round((meal.kcalPct / 100) * activeDayMacros.protein),
        carbs: acc.carbs + Math.round((meal.kcalPct / 100) * activeDayMacros.carbs),
        fat: acc.fat + Math.round((meal.kcalPct / 100) * activeDayMacros.fat),
      }
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  )

  const totalKcal = todayTotals.kcal + scannedTotals.kcal + checkedMealTotals.kcal
  const totalProtein = todayTotals.protein + scannedTotals.protein + checkedMealTotals.protein
  const totalCarbs = todayTotals.carbs + scannedTotals.carbs + checkedMealTotals.carbs
  const totalFat = todayTotals.fat + scannedTotals.fat + checkedMealTotals.fat

  const remaining = Math.max(0, activeDayMacros.kcal - totalKcal)
  const kcalPct = activeDayMacros.kcal > 0 ? (totalKcal / activeDayMacros.kcal) * 100 : 0

  // Budget bar color
  const budgetColor = kcalPct > 100 ? '#ff453a' : kcalPct > 85 ? '#ff9f0a' : '#30d158'

  // Water tracker
  const [waterLog, setWaterLog] = useState<{ml: number, time: string}[]>([])
  const [customMl, setCustomMl] = useState(250)

  useEffect(() => {
    load<{ml: number, time: string}[]>('water-' + TODAY_LOCAL, []).then(setWaterLog)
  }, [])

  const waterTotal = waterLog.reduce((a, e) => a + e.ml, 0)
  const waterPct = Math.min(100, Math.round(waterTotal / (activeDayMacros.water * 1000) * 100))

  const addWater = async (ml: number) => {
    const entry = { ml, time: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) }
    const updated = [...waterLog, entry]
    setWaterLog(updated)
    await save('water-' + TODAY_LOCAL, updated)
  }

  // ── Search with debounce ──
  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (!q.trim()) { setSearchResults([]); return }
    searchTimer.current = setTimeout(async () => {
      setSearching(true)
      const results = await searchFoods(q)
      setSearchResults(results)
      setSearching(false)
    }, 400)
  }, [])

  // ── Add entry to diary ──
  const addEntry = useCallback(async (food: FoodItem, meal: MealSlot, numServings = 1) => {
    const entry: DiaryEntry = {
      food,
      servings: numServings,
      meal,
      date: TODAY_LOCAL,
      time: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }),
    }
    const updated = [...diary, entry]
    await saveDiary(updated)
  }, [diary, saveDiary])

  // ── Delete entry ──
  const deleteEntry = useCallback(async (index: number) => {
    const todayIdx = diary.reduce<number[]>((acc, e, i) => {
      if (e.date === TODAY_LOCAL) acc.push(i)
      return acc
    }, [])
    if (index >= todayIdx.length) return
    const updated = [...diary]
    updated.splice(todayIdx[index], 1)
    await saveDiary(updated)
  }, [diary, saveDiary])

  // openAddFood removed — modal opens inline via setModalOpen(true)

  // ── Barcode scanner ──
  const startScanner = async () => {
    setModalView('barcode')
    setScannerActive(true)
    // Wait for DOM
    await new Promise(r => setTimeout(r, 300))
    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      const scanner = new Html5Qrcode('barcode-reader')
      scannerRef.current = scanner
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        async (decodedText: string) => {
          try { await scanner.stop() } catch { /* */ }
          setScannerActive(false)
          setSearching(true)
          const food = await lookupBarcode(decodedText)
          setSearching(false)
          if (food) {
            setSelectedFood(food)
            setServings(1)
            setModalView('food-detail')
          } else {
            setModalView('search')
            setSearchQuery(decodedText)
          }
        },
        () => { /* ignore */ }
      )
    } catch {
      setScannerActive(false)
      setModalView('search')
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop() } catch { /* */ }
      scannerRef.current = null
    }
    setScannerActive(false)
  }

  // ── AI scan ──
  const aiScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !hasApiKey()) return
    setAiScanning(true)
    const b64 = await fileToBase64(file)
    const mt = file.type || 'image/jpeg'
    setAiPreview(`data:${mt};base64,${b64}`)

    try {
      const text = await callClaude(
        [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mt, data: b64 } },
            { type: 'text', text: `Analiza comida. ${aiDesc || ''}. Solo JSON.` },
          ] as any,
        }],
        'Nutricionista experto. Analiza foto comida. SOLO JSON: {"description":"...","kcal":N,"protein":N,"carbs":N,"fat":N,"confidence":"high|medium|low","notes":"..."}',
      )
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
      const food: FoodItem = {
        id: 'ai-' + Date.now(),
        name: parsed.description || 'Comida escaneada',
        brand: 'IA Scan',
        serving: '1 porcion',
        kcal: parsed.kcal || 0,
        protein: parsed.protein || 0,
        carbs: parsed.carbs || 0,
        fat: parsed.fat || 0,
        image: `data:${mt};base64,${b64}`,
        source: 'custom',
      }
      setSelectedFood(food)
      setServings(1)
      setModalView('food-detail')

      // Also save to scannedMeals for backward compat
      const meal: ScannedMeal = {
        ...parsed,
        date: TODAY_LOCAL,
        time: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }),
        photo: `data:${mt};base64,${b64}`,
      }
      let updated: ScannedMeal[] = []
      setScannedMeals(prev => { updated = [...prev, meal]; return updated })
      await save('scanned-meals', updated)
    } catch {
      /* error */
    }
    setAiScanning(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  // ── Close modal cleanup ──
  const closeModal = async () => {
    await stopScanner()
    setModalOpen(false)
  }

  // ── Confirm add from food detail ──
  const confirmAdd = async () => {
    if (!selectedFood) return
    await addEntry(selectedFood, modalMeal, servings)
    closeModal()
  }

  // ── Quick add confirm ──
  const confirmQuickAdd = async () => {
    const k = parseInt(quickKcal) || 0
    if (k <= 0) return
    const food = quickAddFood(k, parseInt(quickProtein) || 0, parseInt(quickCarbs) || 0, parseInt(quickFat) || 0)
    await addEntry(food, modalMeal)
    closeModal()
  }

  // ── Macro rows ──
  const macroRows = [
    { label: 'Proteina', current: totalProtein, target: activeDayMacros.protein, color: '#64d2ff', unit: 'g' },
    { label: 'Carbos', current: totalCarbs, target: activeDayMacros.carbs, color: '#ff9f0a', unit: 'g' },
    { label: 'Grasa', current: totalFat, target: activeDayMacros.fat, color: '#ffd60a', unit: 'g' },
  ]

  // ── Swipe-to-delete state ──
  const [swipingIdx, setSwipingIdx] = useState<number | null>(null)

  return (
    <div className="pb-28 space-y-3">

      {/* ── Week Selector ── */}
      <div className="mb-4">
        <div className="text-[13px] text-zinc-500 mb-2 px-1">Planificacion semanal</div>
        <div className="grid grid-cols-7 gap-1.5">
          {weekDays.map((day, i) => (
            <button
              key={i}
              onClick={() => setDayOffset(i)}
              className="press py-2 rounded-xl text-center transition-all"
              style={{
                background: dayOffset === i ? '#4ade80' : day.isToday ? '#4ade8015' : '#1c1c1e',
                border: day.isToday && dayOffset !== i ? '1px solid #4ade8030' : '1px solid transparent',
              }}
            >
              <div className="text-[10px] font-medium" style={{ color: dayOffset === i ? '#fff' : '#8e8e93' }}>
                {day.dayLabel}
              </div>
              <div className="text-[15px] font-bold" style={{ color: dayOffset === i ? '#fff' : day.isToday ? '#4ade80' : '#fff' }}>
                {day.dayNum}
              </div>
              <div className="text-[8px] mono mt-0.5" style={{ color: dayOffset === i ? '#ffffffaa' : day.isTraining ? '#30d158' : '#8e8e93' }}>
                {day.split}
              </div>
            </button>
          ))}
        </div>

        {/* Day info */}
        <div className="flex items-center justify-between mt-2 px-1">
          <div className="text-[13px] text-zinc-400">
            {isViewingToday ? 'Hoy' : selectedDay.date} · <span style={{ color: selectedDay.isTraining ? '#30d158' : '#8e8e93' }}>{selectedDay.split}</span>
          </div>
          <div className="text-[13px] mono" style={{ color: selectedDay.isTraining ? '#30d158' : '#ff9f0a' }}>
            {activeDayMacros.kcal} kcal
          </div>
        </div>
      </div>

      {/* Future day planning banner */}
      {!isViewingToday && (
        <div className="bg-[#4ade8015] border border-[#4ade8030] rounded-2xl px-4 py-3 mb-1">
          <div className="text-[13px] text-[#4ade80]">
            Planificando {selectedDay.dayLabel} {selectedDay.dayNum} — prepara las comidas con antelacion
          </div>
        </div>
      )}

      {/* ═══════════════════ CALORIE BUDGET BAR ═══════════════════ */}
      <div className="glass-card px-5 pt-5 pb-4">
        <div className="text-center mb-1">
          <div className="text-[44px] font-black mono leading-none" style={{ color: budgetColor }}>
            {remaining.toLocaleString()}
          </div>
          <div className="text-[13px] text-zinc-500 mt-1">restantes</div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 mb-2">
          <div className="h-[8px] rounded-full bg-white/5 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: budgetColor }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(kcalPct, 100)}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[13px] text-zinc-500 mono">{totalKcal.toLocaleString()} consumidas</span>
          <span className="text-[13px] text-zinc-500 mono">{activeDayMacros.kcal.toLocaleString()} objetivo</span>
        </div>

        {/* Sub-row: consumed / burned / net */}
        <div className="flex items-center justify-center gap-6 mt-3">
          {[
            { label: 'Objetivo', val: activeDayMacros.kcal, icon: '\uD83C\uDFAF' },
            { label: 'Comida', val: totalKcal, icon: '\uD83C\uDF74' },
            { label: 'Restante', val: remaining, icon: '\uD83D\uDD25' },
          ].map(item => (
            <div key={item.label} className="text-center">
              <div className="text-[11px] text-zinc-600">{item.icon} {item.label}</div>
              <div className="text-[15px] font-semibold mono text-white">{item.val.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════ MACRO SUMMARY ═══════════════════ */}
      <div className="glass-card px-4 py-3 space-y-2.5">
        {macroRows.map(row => {
          const pct = row.target > 0 ? Math.min((row.current / row.target) * 100, 100) : 0
          return (
            <div key={row.label}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[13px] text-zinc-400">{row.label}</span>
                <span className="text-[13px] mono" style={{ color: row.color }}>
                  {row.current}{row.unit} / {row.target}{row.unit}
                </span>
              </div>
              <div className="h-[5px] rounded-full bg-white/5 overflow-hidden">
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

      {/* AI Nutrition Briefing */}
      {(nutritionBriefing || nbLoading) && (
        <div className="glass-card p-4 mb-4">
          <div className="text-[13px] text-zinc-500 mb-2">IA · Briefing Nutricional</div>
          {nbLoading ? (
            <div className="text-[13px] text-zinc-600 animate-pulse">Analizando nutrición...</div>
          ) : (
            <div className="text-[14px] text-zinc-300 leading-relaxed whitespace-pre-wrap">{nutritionBriefing}</div>
          )}
        </div>
      )}

      {/* ═══════════════════ PLANNED MEALS FOR SELECTED DAY ═══════════════════ */}
      <div className="mb-4">
        <div className="text-[20px] font-bold text-white mb-3">
          Plan {isViewingToday ? 'de Hoy' : `${selectedDay.dayLabel} ${selectedDay.dayNum}`}
        </div>
        <div className="glass-card overflow-hidden">
          {dayMealPlan.map((meal, i, arr) => {
            // For training entries, compute exercise prescriptions
            const isTrainingEntry = meal.icon === '🏋️' && selectedDay.isTraining
            const daySplit = selectedDay.split
            const dayExercises = isTrainingEntry ? (WORKOUTS[daySplit] || []) : []

            return (
              <div
                key={i}
                className="px-4 py-3"
                style={{ borderBottom: i < arr.length - 1 ? '0.5px solid rgba(255,255,255,0.06)' : 'none' }}
              >
                <div className="flex items-center gap-3">
                  {meal.type === 'meal' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); toggle(`meal-${i}`) }}
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                      style={{
                        borderColor: checks[`meal-${i}`] ? '#30d158' : 'rgba(255,255,255,0.2)',
                        background: checks[`meal-${i}`] ? '#30d158' : 'transparent',
                      }}
                    >
                      {checks[`meal-${i}`] && (
                        <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  )}
                  <span className="text-xl flex-shrink-0">{meal.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-[15px] font-medium ${checks[`meal-${i}`] ? 'text-zinc-500 line-through' : 'text-white'}`}>{meal.title}</span>
                      <span className="text-[12px] mono text-zinc-500">{meal.time}</span>
                    </div>
                    <div className="text-[13px] text-zinc-500 mt-0.5 leading-snug">{meal.desc}</div>
                  </div>
                  {meal.type === 'meal' && meal.kcalPct && (
                    <span className="text-[11px] mono px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: '#30d15815', color: '#30d158' }}>
                      ~{Math.round((meal.kcalPct / 100) * activeDayMacros.kcal)}
                    </span>
                  )}
                </div>

                {/* Training day — brief summary */}
                {isTrainingEntry && dayExercises.length > 0 && (
                  <div className="mt-2 ml-9">
                    <span className="text-[12px] mono px-2.5 py-1 rounded-full" style={{ background: '#4ade8015', color: '#4ade80' }}>
                      {daySplit} · {dayExercises.length} ejercicios → ver en Entreno
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <div className="text-[12px] text-zinc-600 mt-2 px-1">
          {selectedDay.isTraining ? '🏋️ Día de entrenamiento — surplus calórico activo' : '🔄 Día de descanso — macros ajustados'}
        </div>
      </div>

      {/* ═══════════════════ FOOD DIARY (unified) ═══════════════════ */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[20px] font-bold text-white">Registro</div>
          <button
            onClick={() => { setModalMeal('breakfast'); setModalOpen(true); setModalView('search') }}
            className="press px-3 py-1.5 rounded-full text-[13px] font-semibold flex items-center gap-1.5"
            style={{ background: '#30d15820', color: '#30d158' }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Añadir
          </button>
        </div>

        {/* Meal type selector in add modal will let user pick Desayuno/Almuerzo/Cena/Snack */}

        {todayEntries.length > 0 ? (
          <div className="glass-card overflow-hidden">
            {todayEntries.map((entry, idx, arr) => {
              const prevMeal = idx > 0 ? arr[idx - 1].meal : null
              const showHeader = entry.meal !== prevMeal
              return (
                <div key={idx}>
                  {showHeader && (
                    <div className="px-4 pt-3 pb-1 flex items-center gap-2" style={idx > 0 ? { borderTop: '0.5px solid rgba(255,255,255,0.06)' } : undefined}>
                      <span className="text-[14px]">{MEAL_ICONS[entry.meal as MealSlot]}</span>
                      <span className="text-[13px] font-semibold text-zinc-400">{MEAL_LABELS[entry.meal as MealSlot]}</span>
                      <span className="text-[12px] mono text-zinc-600 ml-auto">
                        {arr.filter(e => e.meal === entry.meal).reduce((a, e) => a + Math.round(e.food.kcal * e.servings), 0)} kcal
                      </span>
                    </div>
                  )}
                  <div
                    style={{ borderBottom: idx < arr.length - 1 && arr[idx + 1]?.meal === entry.meal ? '0.5px solid rgba(255,255,255,0.06)' : 'none' }}
                  >
                    <div
                      className="flex items-center px-4 py-2.5 active:bg-white/5 transition-colors"
                      onClick={() => setSwipingIdx(swipingIdx === idx ? null : idx)}
                    >
                      {entry.food.image && (
                        <img src={entry.food.image} alt="" className="w-9 h-9 rounded-lg object-cover mr-3 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] text-white truncate">{entry.food.name}</div>
                        <div className="text-[12px] text-zinc-500 truncate">
                          {entry.food.brand ? `${entry.food.brand} · ` : ''}{entry.food.serving}{entry.servings > 1 ? ` x${entry.servings}` : ''}
                        </div>
                      </div>
                      <div className="text-[14px] mono text-zinc-300 ml-2 flex-shrink-0">{Math.round(entry.food.kcal * entry.servings)}</div>
                    </div>
                    <AnimatePresence>
                      {swipingIdx === idx && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                          <button onClick={() => deleteEntry(idx)} className="w-full py-2 text-center text-[13px] font-semibold press" style={{ background: '#ff453a20', color: '#ff453a' }}>
                            Eliminar
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="glass-card p-6 text-center">
            <div className="text-[28px] mb-2">🍽</div>
            <div className="text-[14px] text-zinc-500">Sin registros hoy</div>
            <div className="text-[12px] text-zinc-600 mt-1">Pulsa "Añadir" para registrar comida</div>
          </div>
        )}
      </div>

      {/* ═══════════════════ WATER TRACKER ═══════════════════ */}
      <div className="mt-6">
        <div className="text-[20px] font-bold text-white mb-3">Hidratación</div>
        <div className="glass-card p-4">
          {/* Progress */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[28px] font-black mono" style={{ color: '#64d2ff' }}>
                {(waterTotal / 1000).toFixed(1)}L
              </div>
              <div className="text-[13px] text-zinc-500">
                de {activeDayMacros.water}L objetivo
              </div>
            </div>
            <div className="w-16 h-16">
              <Ring pct={waterPct} size={64} strokeWidth={6} color="#64d2ff">
                <span className="text-[11px] font-bold mono" style={{ color: '#64d2ff' }}>
                  {waterPct}%
                </span>
              </Ring>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-4">
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #64d2ff, #4ade80)' }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(waterPct, 100)}%` }}
              transition={{ duration: 0.6 }}
            />
          </div>

          {/* Quick add buttons */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { icon: '🥤', label: 'Vaso', ml: 250 },
              { icon: '🧴', label: 'Botella', ml: 500 },
              { icon: '💧', label: 'Grande', ml: 1500 },
            ].map(opt => (
              <button
                key={opt.ml}
                onClick={() => addWater(opt.ml)}
                className="press bg-white/[0.04] rounded-xl py-3 text-center"
              >
                <div className="text-xl">{opt.icon}</div>
                <div className="text-[13px] text-white font-medium">{opt.label}</div>
                <div className="text-[11px] text-zinc-500 mono">{opt.ml}ml</div>
              </button>
            ))}
          </div>

          {/* Custom slider */}
          <div className="flex items-center gap-3 mb-3">
            <input
              type="range"
              min="50"
              max="1000"
              step="50"
              value={customMl}
              onChange={e => setCustomMl(parseInt(e.target.value))}
              className="flex-1 h-1.5 rounded-full appearance-none"
              style={{
                background: `linear-gradient(to right, #64d2ff ${(customMl - 50) / 950 * 100}%, rgba(255,255,255,0.08) ${(customMl - 50) / 950 * 100}%)`,
              }}
            />
            <button
              onClick={() => addWater(customMl)}
              className="press px-3 py-2 rounded-xl text-[13px] font-semibold"
              style={{ background: '#64d2ff', color: '#000' }}
            >
              +{customMl}ml
            </button>
          </div>

          {/* Today's log */}
          {waterLog.length > 0 && (
            <div className="mt-3" style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
              <div className="pt-3 flex flex-wrap gap-1.5">
                {waterLog.map((entry, i) => (
                  <span key={i} className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: '#64d2ff15', color: '#64d2ff' }}>
                    {entry.time} · {entry.ml >= 1000 ? `${(entry.ml/1000).toFixed(1)}L` : `${entry.ml}ml`}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════ DAILY SUMMARY ═══════════════════ */}
      <div className="glass-card p-4">
        <div className="text-[13px] font-semibold text-zinc-400 uppercase tracking-wider mb-3">
          Resumen del Dia
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Kcal', value: totalKcal, color: '#30d158' },
            { label: 'Prot', value: `${totalProtein}g`, color: '#64d2ff' },
            { label: 'Carbs', value: `${totalCarbs}g`, color: '#ff9f0a' },
            { label: 'Grasa', value: `${totalFat}g`, color: '#ffd60a' },
          ].map(item => (
            <div key={item.label} className="text-center">
              <div className="text-[20px] font-bold mono" style={{ color: item.color }}>{item.value}</div>
              <div className="text-[11px] text-zinc-500">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* No API key warning */}
      {!hasApiKey() && (
        <div className="glass-card p-4 text-center">
          <div className="text-[13px] text-zinc-500">
            Configura tu API key en ajustes para usar el scanner IA
          </div>
        </div>
      )}

      {/* ═══════════════════ ADD FOOD MODAL ═══════════════════ */}
      <AnimatePresence>
        {modalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40"
              onClick={closeModal}
            />

            {/* Bottom sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 glass-card rounded-t-[20px] max-h-[92vh] flex flex-col"
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-2.5 pb-1">
                <div className="w-9 h-1 rounded-full bg-white/20" />
              </div>

              {/* Modal header */}
              <div className="flex items-center justify-between px-4 pb-3" style={SEPARATOR}>
                <button onClick={closeModal} className="text-[16px]" style={{ color: '#4ade80' }}>
                  Cancelar
                </button>
                <span className="text-[16px] font-semibold text-white">
                  {MEAL_LABELS[modalMeal]}
                </span>
                <div className="w-16" />
              </div>

              {/* Meal type selector */}
              <div className="flex gap-1.5 px-4 pb-3">
                {(['breakfast', 'lunch', 'dinner', 'snacks'] as MealSlot[]).map(slot => (
                  <button
                    key={slot}
                    onClick={() => setModalMeal(slot)}
                    className="press flex-1 py-2 rounded-xl text-center transition-all"
                    style={{
                      background: modalMeal === slot ? '#4ade80' : 'rgba(255,255,255,0.04)',
                      color: modalMeal === slot ? '#fff' : '#8e8e93',
                    }}
                  >
                    <div className="text-[14px]">{MEAL_ICONS[slot]}</div>
                    <div className="text-[10px] font-medium mt-0.5">{MEAL_LABELS[slot]}</div>
                  </button>
                ))}
              </div>

              {/* Modal content */}
              <div className="flex-1 overflow-y-auto overscroll-contain pb-8">

                {/* ── SEARCH VIEW ── */}
                {modalView === 'search' && (
                  <div>
                    {/* Search input */}
                    <div className="px-4 py-3">
                      <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2.5">
                        <svg className="w-4 h-4 text-zinc-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                          autoFocus
                          value={searchQuery}
                          onChange={e => handleSearch(e.target.value)}
                          placeholder="Buscar alimento..."
                          className="flex-1 bg-transparent text-white text-[15px] outline-none placeholder:text-zinc-600"
                        />
                        {searchQuery && (
                          <button onClick={() => { setSearchQuery(''); setSearchResults([]) }}>
                            <svg className="w-4 h-4 text-zinc-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="px-4 pb-3 grid grid-cols-3 gap-2">
                      <button
                        onClick={startScanner}
                        className="flex flex-col items-center gap-1 py-3 rounded-xl active:scale-95 transition-transform"
                        style={{ backgroundColor: 'rgba(74,222,128,0.1)' }}
                      >
                        <svg className="w-6 h-6" style={{ color: '#4ade80' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
                        </svg>
                        <span className="text-[11px] font-medium" style={{ color: '#4ade80' }}>Codigo</span>
                      </button>
                      <button
                        onClick={() => setModalView('quickadd')}
                        className="flex flex-col items-center gap-1 py-3 rounded-xl active:scale-95 transition-transform"
                        style={{ backgroundColor: 'rgba(74,222,128,0.1)' }}
                      >
                        <svg className="w-6 h-6" style={{ color: '#4ade80' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.545 5.975 5.975 0 01-2.133-1.001A3.75 3.75 0 0012 18z" />
                        </svg>
                        <span className="text-[11px] font-medium" style={{ color: '#4ade80' }}>Rapida</span>
                      </button>
                      <button
                        onClick={() => {
                          setModalView('ai-scan')
                          setTimeout(() => fileRef.current?.click(), 100)
                        }}
                        className="flex flex-col items-center gap-1 py-3 rounded-xl active:scale-95 transition-transform"
                        style={{ backgroundColor: 'rgba(191,90,242,0.1)' }}
                      >
                        <svg className="w-6 h-6" style={{ color: '#bf5af2' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                        </svg>
                        <span className="text-[11px] font-medium" style={{ color: '#bf5af2' }}>IA Scan</span>
                      </button>
                    </div>

                    <div style={SEPARATOR} />

                    {/* Searching indicator */}
                    {searching && (
                      <div className="py-6 text-center">
                        <div className="text-[14px] text-zinc-500 animate-pulse">Buscando...</div>
                      </div>
                    )}

                    {/* Search results */}
                    {searchResults.length > 0 && (
                      <div>
                        <div className="px-4 pt-3 pb-1">
                          <span className="text-[12px] font-semibold text-zinc-500 uppercase tracking-wider">Resultados</span>
                        </div>
                        {searchResults.map((food, i) => (
                          <button
                            key={food.id + i}
                            className="w-full flex items-center px-4 py-2.5 active:bg-white/5 transition-colors"
                            style={i < searchResults.length - 1 ? SEPARATOR : undefined}
                            onClick={() => { setSelectedFood(food); setServings(1); setModalView('food-detail') }}
                          >
                            {food.image ? (
                              <img src={food.image} alt="" className="w-10 h-10 rounded-lg object-cover mr-3 flex-shrink-0" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-white/5 mr-3 flex-shrink-0 flex items-center justify-center">
                                <span className="text-zinc-600 text-[16px]">{MEAL_ICONS[modalMeal]}</span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0 text-left">
                              <div className="text-[14px] text-white truncate">{food.name}</div>
                              <div className="text-[12px] text-zinc-500 truncate">
                                {food.brand ? `${food.brand} · ` : ''}{food.serving}
                              </div>
                            </div>
                            <span className="text-[14px] mono text-zinc-400 ml-2">{food.kcal}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Recent foods (when no search) */}
                    {!searchQuery && !searching && recentFoods.length > 0 && (
                      <div>
                        <div className="px-4 pt-3 pb-1">
                          <span className="text-[12px] font-semibold text-zinc-500 uppercase tracking-wider">Recientes</span>
                        </div>
                        {recentFoods.slice(0, 10).map((food, i) => (
                          <button
                            key={food.id + i}
                            className="w-full flex items-center px-4 py-2.5 active:bg-white/5 transition-colors"
                            style={i < Math.min(recentFoods.length, 10) - 1 ? SEPARATOR : undefined}
                            onClick={() => { setSelectedFood(food); setServings(1); setModalView('food-detail') }}
                          >
                            {food.image ? (
                              <img src={food.image} alt="" className="w-10 h-10 rounded-lg object-cover mr-3 flex-shrink-0" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-white/5 mr-3 flex-shrink-0 flex items-center justify-center">
                                <span className="text-zinc-600 text-[16px]">{MEAL_ICONS[modalMeal]}</span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0 text-left">
                              <div className="text-[14px] text-white truncate">{food.name}</div>
                              <div className="text-[12px] text-zinc-500 truncate">
                                {food.brand ? `${food.brand} · ` : ''}{food.serving}
                              </div>
                            </div>
                            <span className="text-[14px] mono text-zinc-400 ml-2">{food.kcal}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Empty state */}
                    {!searchQuery && !searching && recentFoods.length === 0 && searchResults.length === 0 && (
                      <div className="py-10 text-center">
                        <div className="text-[32px] mb-2">{MEAL_ICONS[modalMeal]}</div>
                        <div className="text-[14px] text-zinc-500">Busca un alimento o escanea un codigo</div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── BARCODE VIEW ── */}
                {modalView === 'barcode' && (
                  <div className="px-4 py-4">
                    <div className="text-center mb-3">
                      <span className="text-[15px] font-semibold text-white">Escanear codigo de barras</span>
                    </div>
                    <div
                      id="barcode-reader"
                      className="w-full rounded-xl overflow-hidden bg-black"
                      style={{ minHeight: 280 }}
                    />
                    {scannerActive && (
                      <div className="text-center mt-3">
                        <div className="text-[13px] text-zinc-500 animate-pulse">Apunta al codigo de barras...</div>
                      </div>
                    )}
                    {searching && (
                      <div className="text-center mt-3">
                        <div className="text-[14px] text-zinc-400 animate-pulse">Buscando producto...</div>
                      </div>
                    )}
                    <button
                      onClick={() => { stopScanner(); setModalView('search') }}
                      className="w-full mt-4 py-3 rounded-xl text-[15px] font-medium text-center"
                      style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#4ade80' }}
                    >
                      Cancelar escaneo
                    </button>
                  </div>
                )}

                {/* ── QUICK ADD VIEW ── */}
                {modalView === 'quickadd' && (
                  <div className="px-4 py-4 space-y-4">
                    <div className="text-center mb-1">
                      <span className="text-[15px] font-semibold text-white">Adicion rapida</span>
                      <div className="text-[13px] text-zinc-500 mt-1">Ingresa calorias y macros manualmente</div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-[12px] text-zinc-500 uppercase tracking-wider mb-1 block">Calorias *</label>
                        <input
                          type="number"
                          value={quickKcal}
                          onChange={e => setQuickKcal(e.target.value)}
                          placeholder="0"
                          autoFocus
                          className="w-full bg-white/5 rounded-xl px-4 py-3 text-white text-[17px] mono outline-none placeholder:text-zinc-700 text-center"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[12px] text-zinc-500 uppercase tracking-wider mb-1 block text-center">Prot (g)</label>
                          <input
                            type="number"
                            value={quickProtein}
                            onChange={e => setQuickProtein(e.target.value)}
                            placeholder="0"
                            className="w-full bg-white/5 rounded-xl px-3 py-2.5 text-white text-[15px] mono outline-none placeholder:text-zinc-700 text-center"
                          />
                        </div>
                        <div>
                          <label className="text-[12px] text-zinc-500 uppercase tracking-wider mb-1 block text-center">Carbs (g)</label>
                          <input
                            type="number"
                            value={quickCarbs}
                            onChange={e => setQuickCarbs(e.target.value)}
                            placeholder="0"
                            className="w-full bg-white/5 rounded-xl px-3 py-2.5 text-white text-[15px] mono outline-none placeholder:text-zinc-700 text-center"
                          />
                        </div>
                        <div>
                          <label className="text-[12px] text-zinc-500 uppercase tracking-wider mb-1 block text-center">Grasa (g)</label>
                          <input
                            type="number"
                            value={quickFat}
                            onChange={e => setQuickFat(e.target.value)}
                            placeholder="0"
                            className="w-full bg-white/5 rounded-xl px-3 py-2.5 text-white text-[15px] mono outline-none placeholder:text-zinc-700 text-center"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={confirmQuickAdd}
                      disabled={!quickKcal || parseInt(quickKcal) <= 0}
                      className="w-full py-3.5 rounded-2xl text-[15px] font-semibold transition-all active:scale-[0.98] disabled:opacity-30"
                      style={{ background: 'linear-gradient(135deg, #30d158, #28a745)', color: '#fff' }}
                    >
                      Agregar {quickKcal ? `${quickKcal} kcal` : ''}
                    </button>

                    <button
                      onClick={() => setModalView('search')}
                      className="w-full py-2.5 text-[14px]"
                      style={{ color: '#4ade80' }}
                    >
                      Volver a busqueda
                    </button>
                  </div>
                )}

                {/* ── AI SCAN VIEW ── */}
                {modalView === 'ai-scan' && (
                  <div className="px-4 py-4 space-y-4">
                    <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={aiScan} className="hidden" />

                    <div className="text-center">
                      <span className="text-[15px] font-semibold text-white">Escanear con IA</span>
                      <div className="text-[13px] text-zinc-500 mt-1">Toma una foto de tu comida</div>
                    </div>

                    {aiPreview && (
                      <img src={aiPreview} alt="" className="w-full h-48 object-cover rounded-xl" />
                    )}

                    <input
                      value={aiDesc}
                      onChange={e => setAiDesc(e.target.value)}
                      placeholder="Descripcion opcional..."
                      className="w-full bg-white/5 text-white px-4 py-3 text-[15px] rounded-xl outline-none placeholder:text-zinc-600"
                    />

                    {aiScanning && (
                      <div className="py-4 text-center">
                        <div className="text-[14px] font-semibold animate-pulse" style={{ color: '#4ade80' }}>
                          Analizando comida con IA...
                        </div>
                      </div>
                    )}

                    {!aiScanning && (
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => fileRef.current?.click()}
                          className="py-3 rounded-xl text-[14px] font-medium active:scale-95 transition-transform"
                          style={{ backgroundColor: 'rgba(191,90,242,0.15)', color: '#bf5af2' }}
                        >
                          Tomar foto
                        </button>
                        <button
                          onClick={() => {
                            const inp = document.createElement('input')
                            inp.type = 'file'
                            inp.accept = 'image/*'
                            inp.onchange = aiScan as any
                            inp.click()
                          }}
                          className="py-3 rounded-xl text-[14px] font-medium active:scale-95 transition-transform"
                          style={{ backgroundColor: 'rgba(191,90,242,0.15)', color: '#bf5af2' }}
                        >
                          Galeria
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => setModalView('search')}
                      className="w-full py-2.5 text-[14px]"
                      style={{ color: '#4ade80' }}
                    >
                      Volver a busqueda
                    </button>
                  </div>
                )}

                {/* ── FOOD DETAIL VIEW ── */}
                {modalView === 'food-detail' && selectedFood && (
                  <div className="px-4 py-4 space-y-4">
                    {/* Food info card */}
                    <div className="bg-white/5 rounded-xl overflow-hidden">
                      {selectedFood.image && (
                        <img src={selectedFood.image} alt="" className="w-full h-40 object-cover" />
                      )}
                      <div className="p-4">
                        <div className="text-[17px] font-semibold text-white">{selectedFood.name}</div>
                        {selectedFood.brand && (
                          <div className="text-[13px] text-zinc-500 mt-0.5">{selectedFood.brand}</div>
                        )}
                        <div className="text-[13px] text-zinc-500 mt-0.5">{selectedFood.serving}</div>
                      </div>
                    </div>

                    {/* Nutrition grid */}
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { l: 'KCAL', v: Math.round(selectedFood.kcal * servings), c: '#30d158' },
                        { l: 'PROT', v: `${Math.round(selectedFood.protein * servings)}g`, c: '#64d2ff' },
                        { l: 'CARB', v: `${Math.round(selectedFood.carbs * servings)}g`, c: '#ff9f0a' },
                        { l: 'FAT', v: `${Math.round(selectedFood.fat * servings)}g`, c: '#ffd60a' },
                      ].map((m, i) => (
                        <div key={i} className="text-center bg-white/5 rounded-xl py-3">
                          <div className="text-[18px] font-bold mono" style={{ color: m.c }}>{m.v}</div>
                          <div className="text-[11px] text-zinc-500 mt-0.5">{m.l}</div>
                        </div>
                      ))}
                    </div>

                    {/* Servings control */}
                    <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
                      <span className="text-[14px] text-zinc-400">Porciones</span>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => setServings(Math.max(0.5, servings - 0.5))}
                          className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                          style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                        >
                          <span className="text-white text-[18px] font-light">-</span>
                        </button>
                        <span className="text-[17px] mono font-semibold text-white min-w-[2rem] text-center">{servings}</span>
                        <button
                          onClick={() => setServings(servings + 0.5)}
                          className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                          style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                        >
                          <span className="text-white text-[18px] font-light">+</span>
                        </button>
                      </div>
                    </div>

                    {/* Confirm button */}
                    <button
                      onClick={confirmAdd}
                      className="w-full py-3.5 rounded-2xl text-[15px] font-semibold transition-all active:scale-[0.98]"
                      style={{ background: 'linear-gradient(135deg, #30d158, #28a745)', color: '#fff' }}
                    >
                      Agregar a {MEAL_LABELS[modalMeal]}
                    </button>

                    {/* Back */}
                    <button
                      onClick={() => { setSelectedFood(null); setModalView('search') }}
                      className="w-full py-2.5 text-[14px]"
                      style={{ color: '#4ade80' }}
                    >
                      Volver a busqueda
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
