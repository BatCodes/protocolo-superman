import { useState } from 'react'
import { motion } from 'framer-motion'
import { getApiKey, setApiKey } from '../lib/api'

interface SettingsProps {
  onClose: () => void
}

export function Settings({ onClose }: SettingsProps) {
  const [key, setKey] = useState(getApiKey() || '')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setApiKey(key.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="sticky top-0 z-50 backdrop-blur-xl px-4 py-3 flex items-center justify-between" style={{ background: 'rgba(0,0,0,0.85)' }}>
        <button onClick={onClose} className="press text-[17px] font-normal" style={{ color: '#64d2ff' }}>
          ← Volver
        </button>
        <span className="text-[17px] font-semibold text-white">Ajustes</span>
        <div className="w-16" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 py-6 space-y-6"
      >
        {/* API Key Section */}
        <div>
          <p className="text-[13px] font-semibold text-zinc-400 uppercase tracking-wider px-4 mb-2">
            API Anthropic
          </p>
          <div className="bg-[#1c1c1e] rounded-2xl p-4 space-y-3">
            <div className="text-[13px] text-zinc-500 leading-relaxed">
              Tu API key se guarda localmente en tu dispositivo. Nunca se envia a ningun servidor excepto la API de Anthropic directamente.
            </div>
            <input
              type="password"
              value={key}
              onChange={e => setKey(e.target.value)}
              placeholder="sk-ant-..."
              className="w-full bg-[#2c2c2e] text-white px-4 py-3 text-[15px] mono rounded-xl outline-none"
            />
            <button
              onClick={handleSave}
              className="press w-full py-3.5 rounded-2xl text-[15px] font-semibold transition-all active:scale-[0.98]"
              style={{
                background: saved
                  ? 'linear-gradient(135deg, #30d158, #28a745)'
                  : 'linear-gradient(135deg, #ffd60a, #ff9f0a)',
                color: '#000',
              }}
            >
              {saved ? 'Guardada' : 'Guardar API Key'}
            </button>
          </div>
        </div>

        {/* AI Features Section */}
        <div>
          <p className="text-[13px] font-semibold text-zinc-400 uppercase tracking-wider px-4 mb-2">
            Funciones IA
          </p>
          <div className="bg-[#1c1c1e] rounded-2xl overflow-hidden">
            {[
              { color: '#30d158', title: 'Briefing automatico', desc: 'Analisis diario de tu estado con recomendaciones' },
              { color: '#64d2ff', title: 'Meal Scanner', desc: 'Escanea fotos de comida para analizar macros' },
              { color: '#bf5af2', title: 'Intel Chat', desc: 'Consultor IA con contexto completo de tu protocolo' },
              { color: '#ff453a', title: 'Lab Analysis', desc: 'Analiza PDFs de analiticas sanguineas' },
            ].map((item, i) => (
              <div
                key={i}
                className="px-4 py-3 flex items-start gap-3"
                style={i < 3 ? { borderBottom: '0.33px solid rgba(255,255,255,0.08)' } : undefined}
              >
                <div
                  className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                  style={{ background: item.color }}
                />
                <div>
                  <div className="text-[15px] text-white">{item.title}</div>
                  <div className="text-[13px] text-zinc-500">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Install Instructions Section */}
        <div>
          <p className="text-[13px] font-semibold text-zinc-400 uppercase tracking-wider px-4 mb-2">
            Instalar en iPhone
          </p>
          <div className="bg-[#1c1c1e] rounded-2xl overflow-hidden">
            {[
              'Abre esta web en Safari en tu iPhone',
              'Pulsa el boton Compartir (cuadrado con flecha)',
              'Selecciona "Anadir a pantalla de inicio"',
              'La app funcionara offline como una app nativa',
            ].map((step, i) => (
              <div
                key={i}
                className="px-4 py-3 flex items-center gap-3"
                style={i < 3 ? { borderBottom: '0.33px solid rgba(255,255,255,0.08)' } : undefined}
              >
                <span className="text-[13px] mono flex-shrink-0" style={{ color: '#ffd60a' }}>{i + 1}</span>
                <span className="text-[15px] text-white">{step}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Data Management Section */}
        <div>
          <p className="text-[13px] font-semibold text-zinc-400 uppercase tracking-wider px-4 mb-2">
            Datos
          </p>
          <div className="bg-[#1c1c1e] rounded-2xl p-4 space-y-3">
            <div className="text-[13px] text-zinc-500">
              Todos los datos se guardan localmente en tu dispositivo (IndexedDB).
            </div>
            <button
              onClick={() => {
                if (confirm('Borrar TODOS los datos? Esta accion no se puede deshacer.')) {
                  indexedDB.deleteDatabase('keyval-store')
                  localStorage.clear()
                  window.location.reload()
                }
              }}
              className="press w-full py-3 rounded-2xl text-[15px] font-semibold transition-all active:scale-[0.98]"
              style={{ background: 'rgba(255,69,58,0.12)', color: '#ff453a' }}
            >
              Borrar Todos los Datos
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-6">
          <div className="text-[11px] text-zinc-600">PROTOCOLO SUPERMAN</div>
          <div className="text-[11px] text-zinc-600">v5 ELITE · PWA</div>
        </div>
      </motion.div>
    </div>
  )
}
