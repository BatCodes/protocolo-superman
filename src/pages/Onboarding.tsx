import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { UserProfile } from '../lib/profile'
import { DIETARY_OPTIONS, INJURY_OPTIONS } from '../lib/profile'

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void
}

const TODAY = new Date().toISOString().slice(0, 10)

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1) // 1 = forward, -1 = back

  // Form state
  const [name, setName] = useState('')
  const [sex, setSex] = useState<'male' | 'female'>('male')
  const [age, setAge] = useState('')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [weightGoal, setWeightGoal] = useState('')
  const [experience, setExperience] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner')
  const [diet, setDiet] = useState<string[]>([])
  const [injuries, setInjuries] = useState<string[]>([])
  const [startDate, setStartDate] = useState(TODAY)

  const totalSteps = 6

  const next = () => { setDir(1); setStep(s => Math.min(s + 1, totalSteps - 1)) }
  const back = () => { setDir(-1); setStep(s => Math.max(s - 1, 0)) }

  const toggleItem = (arr: string[], setArr: (v: string[]) => void, item: string) => {
    if (item === 'Ninguna') {
      setArr(arr.includes('Ninguna') ? [] : ['Ninguna'])
      return
    }
    const without = arr.filter(i => i !== 'Ninguna')
    setArr(without.includes(item) ? without.filter(i => i !== item) : [...without, item])
  }

  const finish = () => {
    const profile: UserProfile = {
      name: name || 'Usuario',
      age: parseInt(age) || 25,
      height: parseInt(height) || 175,
      weight: parseFloat(weight) || 75,
      weightGoal: parseFloat(weightGoal) || 85,
      sex,
      experience,
      dietaryRestrictions: diet.filter(d => d !== 'Ninguna'),
      injuries: injuries.filter(i => i !== 'Ninguna'),
      location: '',
      startDate,
    }
    onComplete(profile)
  }

  const canNext = () => {
    switch(step) {
      case 0: return name.trim().length > 0
      case 1: return age && height && weight && weightGoal
      case 2: return true // experience always has default
      case 3: return true // diet can be empty
      case 4: return true // injuries can be empty
      case 5: return true // date has default
      default: return true
    }
  }

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -300 : 300, opacity: 0 }),
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 pt-14 pb-6 px-4">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className="h-1 rounded-full transition-all duration-300"
            style={{
              width: i === step ? 24 : 8,
              background: i <= step ? '#ffd60a' : 'rgba(255,255,255,0.1)',
            }}
          />
        ))}
      </div>

      {/* Back button */}
      {step > 0 && (
        <button onClick={back} className="press px-4 py-2 self-start text-[17px]" style={{ color: '#64d2ff' }}>
          ← Atrás
        </button>
      )}

      {/* Content */}
      <div className="flex-1 px-6 overflow-hidden">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="h-full"
          >
            {/* Step 0: Welcome */}
            {step === 0 && (
              <div className="pt-4">
                <h1 className="text-[34px] font-bold text-white leading-tight">¿Cómo te llamas?</h1>
                <p className="text-[15px] text-zinc-500 mt-2 mb-8">Personaliza tu protocolo.</p>

                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Tu nombre"
                  autoFocus
                  className="w-full bg-[#1c1c1e] text-white text-[20px] px-5 py-4 rounded-2xl outline-none mb-4"
                />

                <p className="text-[13px] font-semibold text-zinc-400 uppercase tracking-wider mb-3 mt-6">Sexo biológico</p>
                <div className="grid grid-cols-2 gap-3">
                  {(['male', 'female'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => setSex(s)}
                      className="press py-4 rounded-2xl text-[17px] font-semibold transition-all"
                      style={{
                        background: sex === s ? '#ffd60a1a' : '#1c1c1e',
                        color: sex === s ? '#ffd60a' : '#fff',
                        border: sex === s ? '2px solid #ffd60a' : '2px solid transparent',
                      }}
                    >
                      {s === 'male' ? '♂ Masculino' : '♀ Femenino'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 1: Body */}
            {step === 1 && (
              <div className="pt-4">
                <h1 className="text-[34px] font-bold text-white leading-tight">Tu cuerpo</h1>
                <p className="text-[15px] text-zinc-500 mt-2 mb-8">Para calcular tus macros y objetivos.</p>

                <div className="space-y-3">
                  {[
                    { label: 'Edad', value: age, set: setAge, unit: 'años', ph: '25' },
                    { label: 'Altura', value: height, set: setHeight, unit: 'cm', ph: '175' },
                    { label: 'Peso actual', value: weight, set: setWeight, unit: 'kg', ph: '72' },
                    { label: 'Peso objetivo', value: weightGoal, set: setWeightGoal, unit: 'kg', ph: '85' },
                  ].map(f => (
                    <div key={f.label} className="bg-[#1c1c1e] rounded-2xl px-5 py-3 flex items-center justify-between">
                      <span className="text-[15px] text-zinc-400">{f.label}</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={f.value}
                          onChange={e => f.set(e.target.value)}
                          placeholder={f.ph}
                          className="w-20 bg-transparent text-right text-[20px] font-semibold text-white mono outline-none"
                        />
                        <span className="text-[13px] text-zinc-600 w-8">{f.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Experience */}
            {step === 2 && (
              <div className="pt-4">
                <h1 className="text-[34px] font-bold text-white leading-tight">Experiencia</h1>
                <p className="text-[15px] text-zinc-500 mt-2 mb-8">Tu nivel determina la progresión del programa.</p>

                <div className="space-y-3">
                  {([
                    { id: 'beginner' as const, title: 'Principiante', desc: 'Menos de 1 año entrenando' },
                    { id: 'intermediate' as const, title: 'Intermedio', desc: '1-3 años entrenando consistente' },
                    { id: 'advanced' as const, title: 'Avanzado', desc: 'Más de 3 años, conoce técnica' },
                  ]).map(exp => (
                    <button
                      key={exp.id}
                      onClick={() => setExperience(exp.id)}
                      className="press w-full text-left px-5 py-4 rounded-2xl transition-all"
                      style={{
                        background: experience === exp.id ? '#ffd60a1a' : '#1c1c1e',
                        border: experience === exp.id ? '2px solid #ffd60a' : '2px solid transparent',
                      }}
                    >
                      <div className="text-[17px] font-semibold" style={{ color: experience === exp.id ? '#ffd60a' : '#fff' }}>
                        {exp.title}
                      </div>
                      <div className="text-[13px] text-zinc-500 mt-0.5">{exp.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Diet */}
            {step === 3 && (
              <div className="pt-4">
                <h1 className="text-[34px] font-bold text-white leading-tight">Alimentación</h1>
                <p className="text-[15px] text-zinc-500 mt-2 mb-8">¿Alguna restricción dietética?</p>

                <div className="grid grid-cols-2 gap-2">
                  {DIETARY_OPTIONS.map(d => {
                    const selected = diet.includes(d)
                    return (
                      <button
                        key={d}
                        onClick={() => toggleItem(diet, setDiet, d)}
                        className="press px-4 py-3.5 rounded-2xl text-[15px] text-left transition-all"
                        style={{
                          background: selected ? '#ffd60a1a' : '#1c1c1e',
                          color: selected ? '#ffd60a' : '#fff',
                          border: selected ? '2px solid #ffd60a' : '2px solid transparent',
                        }}
                      >
                        {d}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Step 4: Injuries */}
            {step === 4 && (
              <div className="pt-4">
                <h1 className="text-[34px] font-bold text-white leading-tight">Lesiones</h1>
                <p className="text-[15px] text-zinc-500 mt-2 mb-8">Adaptaremos los ejercicios para protegerte.</p>

                <div className="grid grid-cols-2 gap-2">
                  {INJURY_OPTIONS.map(inj => {
                    const selected = injuries.includes(inj)
                    return (
                      <button
                        key={inj}
                        onClick={() => toggleItem(injuries, setInjuries, inj)}
                        className="press px-4 py-3.5 rounded-2xl text-[15px] text-left transition-all"
                        style={{
                          background: selected ? '#ff453a1a' : '#1c1c1e',
                          color: selected ? '#ff453a' : '#fff',
                          border: selected ? '2px solid #ff453a' : '2px solid transparent',
                        }}
                      >
                        {inj}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Step 5: Start Date */}
            {step === 5 && (
              <div className="pt-4">
                <h1 className="text-[34px] font-bold text-white leading-tight">Fecha de inicio</h1>
                <p className="text-[15px] text-zinc-500 mt-2 mb-8">¿Cuándo empezaste o vas a empezar?</p>

                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full bg-[#1c1c1e] text-white text-[20px] px-5 py-4 rounded-2xl outline-none text-center mono"
                />

                <div className="mt-6 bg-[#1c1c1e] rounded-2xl p-4">
                  <div className="text-[13px] text-zinc-500 leading-relaxed">
                    El sistema calculará automáticamente tu día, semana, fase y milestones desde esta fecha.
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom button */}
      <div className="px-6 pb-10 pt-4">
        <button
          onClick={step === totalSteps - 1 ? finish : next}
          disabled={!canNext()}
          className="press w-full py-4 rounded-2xl text-[17px] font-semibold transition-all disabled:opacity-30"
          style={{
            background: canNext() ? 'linear-gradient(135deg, #ffd60a, #ff9f0a)' : '#1c1c1e',
            color: canNext() ? '#000' : '#666',
          }}
        >
          {step === totalSteps - 1 ? 'Comenzar Protocolo' : 'Continuar'}
        </button>
      </div>
    </div>
  )
}
