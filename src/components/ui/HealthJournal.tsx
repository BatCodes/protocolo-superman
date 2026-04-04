import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { load, save } from '../../lib/storage'
import { BookOpen, Plus, ChevronDown } from 'lucide-react'

interface JournalEntry {
  date: string
  time: string
  mood: number      // 1-5
  energy: number    // 1-5
  stress: number    // 1-5
  notes: string
  tags: string[]
}

const MOODS = ['😫', '😔', '😐', '🙂', '😁']
const TAGS = ['Bien dormido', 'Cansado', 'Motivado', 'Estresado', 'Dolor muscular', 'Enfermo', 'Viaje', 'Mentalidad fuerte', 'Día libre', 'PR']

const TODAY = new Date().toISOString().slice(0, 10)

export function HealthJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [mood, setMood] = useState(3)
  const [energy, setEnergy] = useState(3)
  const [stress, setStress] = useState(3)
  const [notes, setNotes] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    load<JournalEntry[]>('health-journal', []).then(setEntries)
  }, [])

  const todayEntries = entries.filter(e => e.date === TODAY)

  const saveEntry = async () => {
    const entry: JournalEntry = {
      date: TODAY,
      time: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }),
      mood,
      energy,
      stress,
      notes: notes.trim(),
      tags,
    }
    const updated = [...entries, entry]
    setEntries(updated)
    await save('health-journal', updated)
    setShowForm(false)
    setNotes('')
    setTags([])
    setMood(3)
    setEnergy(3)
    setStress(3)
  }

  const toggleTag = (tag: string) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-[20px] font-bold text-white">Diario de Salud</div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="press w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: showForm ? '#ff453a' : '#0a84ff' }}
        >
          <Plus size={16} color="#fff" style={{ transform: showForm ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>
      </div>

      {/* New entry form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="bg-[#1c1c1e] rounded-2xl p-4 space-y-4">
              {/* Mood/Energy/Stress sliders */}
              {[
                { label: 'Estado de ánimo', value: mood, set: setMood, icons: MOODS },
                { label: 'Nivel de energía', value: energy, set: setEnergy, icons: ['⚡', '⚡', '⚡', '⚡', '⚡'] },
                { label: 'Nivel de estrés', value: stress, set: setStress, icons: ['😌', '😌', '😐', '😰', '🤯'] },
              ].map(slider => (
                <div key={slider.label}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[13px] text-zinc-400">{slider.label}</span>
                    <span className="text-xl">{slider.icons[slider.value - 1]}</span>
                  </div>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map(v => (
                      <button
                        key={v}
                        onClick={() => slider.set(v)}
                        className="press flex-1 h-8 rounded-lg transition-all"
                        style={{
                          background: v <= slider.value
                            ? slider.label.includes('estrés')
                              ? v >= 4 ? '#ff453a30' : v >= 3 ? '#ff9f0a30' : '#30d15830'
                              : v >= 4 ? '#30d15830' : v >= 3 ? '#ffd60a30' : '#ff453a30'
                            : '#2c2c2e',
                          border: v === slider.value ? '2px solid ' + (slider.label.includes('estrés')
                            ? v >= 4 ? '#ff453a' : '#ffd60a'
                            : v >= 4 ? '#30d158' : v >= 3 ? '#ffd60a' : '#ff453a')
                            : '2px solid transparent',
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {/* Tags */}
              <div>
                <div className="text-[13px] text-zinc-400 mb-2">Tags</div>
                <div className="flex gap-1.5 flex-wrap">
                  {TAGS.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className="press text-[12px] px-2.5 py-1 rounded-full transition-all"
                      style={{
                        background: tags.includes(tag) ? '#0a84ff20' : '#2c2c2e',
                        color: tags.includes(tag) ? '#0a84ff' : '#8e8e93',
                        border: tags.includes(tag) ? '1px solid #0a84ff40' : '1px solid transparent',
                      }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <div className="text-[13px] text-zinc-400 mb-2">Notas</div>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="¿Cómo te sientes hoy? Cualquier observación..."
                  className="w-full bg-[#2c2c2e] text-white text-[14px] p-3 rounded-xl outline-none resize-none leading-relaxed"
                  rows={3}
                />
              </div>

              <button
                onClick={saveEntry}
                className="press w-full py-3 rounded-xl text-[15px] font-semibold"
                style={{ background: '#0a84ff', color: '#fff' }}
              >
                Guardar entrada
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Today's entries */}
      {todayEntries.length > 0 && (
        <div className="bg-[#1c1c1e] rounded-2xl overflow-hidden">
          {todayEntries.map((entry, i) => (
            <div
              key={i}
              className="px-4 py-3"
              style={{ borderBottom: i < todayEntries.length - 1 ? '0.33px solid rgba(255,255,255,0.08)' : 'none' }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{MOODS[entry.mood - 1]}</span>
                  <span className="text-[13px] text-zinc-400 mono">{entry.time}</span>
                </div>
                <div className="flex gap-1">
                  {entry.tags.slice(0, 3).map(t => (
                    <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-zinc-500">{t}</span>
                  ))}
                </div>
              </div>
              {entry.notes && (
                <div className="text-[13px] text-zinc-300 leading-relaxed">{entry.notes}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Previous entries (collapsible) */}
      {entries.filter(e => e.date !== TODAY).length > 0 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="press w-full mt-3 flex items-center justify-center gap-1 py-2 text-[13px] text-zinc-500"
        >
          <BookOpen size={14} />
          <span>Entradas anteriores ({entries.filter(e => e.date !== TODAY).length})</span>
          <ChevronDown size={14} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>
      )}

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-[#1c1c1e] rounded-2xl overflow-hidden mt-2">
              {entries.filter(e => e.date !== TODAY).slice(-10).reverse().map((entry, i, arr) => (
                <div
                  key={i}
                  className="px-4 py-3"
                  style={{ borderBottom: i < arr.length - 1 ? '0.33px solid rgba(255,255,255,0.08)' : 'none' }}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span>{MOODS[entry.mood - 1]}</span>
                    <span className="text-[13px] text-zinc-400 mono">{entry.date} · {entry.time}</span>
                  </div>
                  {entry.notes && <div className="text-[13px] text-zinc-400">{entry.notes}</div>}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
