import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from './hooks/useApp'
import { TABS } from './lib/constants'
import { Ring } from './components/ui/Ring'
import { Dashboard } from './pages/Dashboard'
import { Combat } from './pages/Combat'
import { Fuel } from './pages/Fuel'
import { Recon } from './pages/Recon'
import { Intel } from './pages/Intel'
import { Settings } from './pages/Settings'

const TODAY = new Date().toISOString().slice(0, 10)

export default function App() {
  const app = useApp()
  const [sDate, setSDate] = useState(TODAY)
  const [showSettings, setShowSettings] = useState(false)

  // Loading
  if (!app.loaded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div
            className="w-16 h-16 mx-auto mb-5 rounded-[16px] flex items-center justify-center"
            style={{ background: 'linear-gradient(145deg, #ffd60a, #ff9f0a)' }}
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-2xl font-black text-black">S</span>
          </motion.div>
          <div className="text-[14px] text-zinc-500">Cargando...</div>
        </motion.div>
      </div>
    )
  }

  // Onboarding
  if (app.setup) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="w-full max-w-sm text-center"
        >
          <motion.div
            className="w-24 h-24 mx-auto mb-8 rounded-[24px] flex items-center justify-center"
            style={{
              background: 'linear-gradient(145deg, #ffd60a, #ff9f0a)',
              boxShadow: '0 12px 40px -8px rgba(255, 214, 10, 0.25)',
            }}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <span className="text-4xl font-black text-black">S</span>
          </motion.div>

          <h1 className="text-[34px] font-bold text-white tracking-tight leading-tight">
            Protocolo Superman
          </h1>
          <p className="text-[15px] text-zinc-500 mt-2 mb-10 leading-relaxed">
            Selecciona la fecha en la que empezaste o vas a empezar el protocolo.
          </p>

          <input
            type="date"
            value={sDate}
            onChange={e => setSDate(e.target.value)}
            className="w-full bg-[#1c1c1e] text-white px-5 py-4 text-[17px] rounded-2xl outline-none text-center mb-4 mono"
          />

          <button
            onClick={() => app.startProtocol(sDate)}
            className="w-full py-4 rounded-2xl text-[17px] font-semibold press"
            style={{
              background: 'linear-gradient(135deg, #ffd60a, #ff9f0a)',
              color: '#000',
            }}
          >
            Comenzar
          </button>
        </motion.div>
      </div>
    )
  }

  if (showSettings) {
    return <Settings onClose={() => setShowSettings(false)} />
  }

  const readyColor = app.readiness.score >= 70 ? '#30d158' : app.readiness.score >= 50 ? '#ff9f0a' : '#ff453a'

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div
        className="sticky top-0 z-50 frosted border-b border-white/[0.06]"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="px-4 py-2 flex justify-between items-center">
          <div>
            <div className="text-[11px] text-zinc-500 font-medium">
              Día {app.plan.day} · Semana {app.plan.week}
            </div>
            <div className="text-[17px] font-bold" style={{ color: '#ffd60a' }}>
              {app.plan.phaseName}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 -m-1 rounded-full press text-zinc-500"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
            <Ring pct={app.readiness.score} size={32} strokeWidth={3} color={readyColor}>
              <span className="text-[11px] font-bold mono" style={{ color: readyColor }}>
                {app.readiness.score}
              </span>
            </Ring>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-2 pt-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={app.tab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {app.tab === 'cmd' && (
              <Dashboard
                plan={app.plan}
                readiness={app.readiness}
                decision={app.decision}
                injury={app.injury}
                blood={app.blood}
                predictions={app.predictions}
                hd={app.hd}
                briefing={app.briefing}
                briefingLoading={app.briefingLoading}
                wkLog={app.wkLog}
                checks={app.checks}
                toggle={app.toggle}
                scannedMeals={app.scannedMeals}
              />
            )}
            {app.tab === 'combat' && (
              <Combat plan={app.plan} wkLog={app.wkLog} setWkLog={app.setWkLog} decision={app.decision} />
            )}
            {app.tab === 'fuel' && (
              <Fuel scannedMeals={app.scannedMeals} setScannedMeals={app.setScannedMeals} />
            )}
            {app.tab === 'recon' && (
              <Recon hd={app.hd} setHd={app.setHd} medReports={app.medReports} setMedReports={app.setMedReports} />
            )}
            {app.tab === 'intel' && (
              <Intel plan={app.plan} hd={app.hd} checks={app.checks} scannedMeals={app.scannedMeals} wkLog={app.wkLog} readiness={app.readiness} decision={app.decision} injury={app.injury} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Tab Bar — iOS Style */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 frosted border-t border-white/[0.06] safe-bottom"
      >
        <div className="grid grid-cols-5 pt-1.5 pb-0.5">
          {TABS.map(t => {
            const active = app.tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => app.setTab(t.id)}
                className="py-1 flex flex-col items-center gap-0.5 press"
              >
                <span className="text-[20px]">{t.icon}</span>
                <span
                  className="text-[10px] font-medium"
                  style={{ color: active ? '#ffd60a' : '#636366' }}
                >
                  {t.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
