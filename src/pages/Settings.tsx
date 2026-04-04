import { useState } from 'react'
import { motion } from 'framer-motion'
import { getApiKey, setApiKey } from '../lib/api'
import { GlassCard } from '../components/ui/GlassCard'
import { Section } from '../components/ui/Section'

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
    <div className="min-h-screen bg-[#050505] text-zinc-200">
      <div className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/[0.04] px-4 py-3 flex items-center justify-between" style={{ background: '#050505ee' }}>
        <button onClick={onClose} className="text-zinc-400 text-sm font-mono">
          ← Volver
        </button>
        <span className="text-[10px] font-mono text-zinc-600 tracking-[0.2em]">AJUSTES</span>
        <div className="w-12" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 py-4 space-y-3"
      >
        <Section title="API ANTHROPIC" color="#c9a227" />
        <GlassCard className="p-4">
          <div className="text-[11px] text-zinc-400 mb-3 leading-relaxed">
            Tu API key se guarda localmente en tu dispositivo. Nunca se envía a ningún servidor excepto la API de Anthropic directamente.
          </div>
          <input
            type="password"
            value={key}
            onChange={e => setKey(e.target.value)}
            placeholder="sk-ant-..."
            className="w-full bg-[#111] border border-white/[0.06] text-zinc-200 px-3.5 py-3 text-[12px] font-mono rounded-xl outline-none focus:border-[#c9a227]/30 transition-colors mb-3"
          />
          <button
            onClick={handleSave}
            className="w-full py-3 rounded-xl text-[11px] font-black font-mono transition-all active:scale-[0.98]"
            style={{
              background: saved ? '#16a34a' : '#c9a227',
              color: '#000',
            }}
          >
            {saved ? '✓ GUARDADA' : 'GUARDAR API KEY'}
          </button>
        </GlassCard>

        <Section title="FUNCIONES IA" color="#06b6d4" />
        <GlassCard className="p-4">
          <div className="space-y-3 text-[11px] text-zinc-400">
            <div className="flex items-start gap-2">
              <span className="text-[#16a34a] font-mono text-xs">■</span>
              <div><strong className="text-zinc-200">Briefing automático</strong> — Análisis diario de tu estado con recomendaciones</div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#06b6d4] font-mono text-xs">■</span>
              <div><strong className="text-zinc-200">Meal Scanner</strong> — Escanea fotos de comida para analizar macros</div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#8b5cf6] font-mono text-xs">■</span>
              <div><strong className="text-zinc-200">Intel Chat</strong> — Consultor IA con contexto completo de tu protocolo</div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#dc2626] font-mono text-xs">■</span>
              <div><strong className="text-zinc-200">Lab Analysis</strong> — Analiza PDFs de analíticas sanguíneas</div>
            </div>
          </div>
        </GlassCard>

        <Section title="INSTALAR EN IPHONE" color="#c9a227" />
        <GlassCard className="p-4">
          <div className="text-[11px] text-zinc-400 leading-relaxed space-y-2">
            <p>1. Abre esta web en <strong className="text-zinc-200">Safari</strong> en tu iPhone</p>
            <p>2. Pulsa el botón <strong className="text-zinc-200">Compartir</strong> (cuadrado con flecha)</p>
            <p>3. Selecciona <strong className="text-zinc-200">"Añadir a pantalla de inicio"</strong></p>
            <p>4. La app funcionará offline como una app nativa</p>
          </div>
        </GlassCard>

        <Section title="DATOS" color="#dc2626" />
        <GlassCard className="p-4">
          <div className="text-[11px] text-zinc-400 mb-3">
            Todos los datos se guardan localmente en tu dispositivo (IndexedDB).
          </div>
          <button
            onClick={() => {
              if (confirm('¿Borrar TODOS los datos? Esta acción no se puede deshacer.')) {
                indexedDB.deleteDatabase('keyval-store')
                localStorage.clear()
                window.location.reload()
              }
            }}
            className="w-full py-2.5 rounded-xl text-[10px] font-bold font-mono border border-red-500/30 text-red-500 bg-red-500/5 transition-all active:scale-[0.98]"
          >
            BORRAR TODOS LOS DATOS
          </button>
        </GlassCard>

        <div className="text-center py-6">
          <div className="text-[8px] text-zinc-700 font-mono tracking-[0.3em]">PROTOCOLO SUPERMAN</div>
          <div className="text-[8px] text-zinc-700 font-mono">v5 ELITE · PWA</div>
        </div>
      </motion.div>
    </div>
  )
}
