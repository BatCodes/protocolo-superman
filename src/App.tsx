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

  // Loading screen — Apple-style minimal
  if (!app.loaded) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-center"
        >
          <motion.div
            className="w-16 h-16 mx-auto mb-6 rounded-[18px] flex items-center justify-center"
            style={{
              background: 'linear-gradient(145deg, #c9a227, #8b6914)',
              boxShadow: '0 8px 32px -4px rgba(201, 162, 39, 0.25)',
            }}
            animate={{ rotate: [0, 3, -3, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <span className="text-2xl font-black text-black mono">S</span>
          </motion.div>
          <motion.div
            className="text-[10px] mono tracking-[0.4em] text-[#c9a227]/70"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            CARGANDO
          </motion.div>
        </motion.div>
      </div>
    )
  }

  // Setup screen — Apple onboarding style
  if (app.setup) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="w-full max-w-sm text-center"
        >
          {/* App icon */}
          <motion.div
            className="w-20 h-20 mx-auto mb-6 rounded-[22px] flex items-center justify-center"
            style={{
              background: 'linear-gradient(145deg, #c9a227, #8b6914)',
              boxShadow: '0 12px 40px -8px rgba(201, 162, 39, 0.3)',
            }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <span className="text-3xl font-black text-black mono">S</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h1 className="text-[28px] font-bold text-white tracking-tight mb-1">
              Protocolo Superman
            </h1>
            <p className="text-[13px] text-zinc-500 mb-8 leading-relaxed">
              Selecciona la fecha en la que empezaste o vas a empezar el protocolo.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <input
              type="date"
              value={sDate}
              onChange={e => setSDate(e.target.value)}
              className="w-full frosted border border-white/[0.08] text-zinc-200 px-5 py-4 text-[15px] mono rounded-2xl outline-none text-center mb-4 focus:border-[#c9a227]/30 transition-all"
            />

            <button
              onClick={() => app.startProtocol(sDate)}
              className="w-full py-4 rounded-2xl text-[15px] font-semibold tracking-wide press"
              style={{
                background: 'linear-gradient(135deg, #c9a227, #a88620)',
                color: '#000',
                boxShadow: '0 4px 24px -4px rgba(201,162,39,0.35)',
              }}
            >
              Comenzar
            </button>
          </motion.div>
        </motion.div>
      </div>
    )
  }

  // Settings overlay
  if (showSettings) {
    return <Settings onClose={() => setShowSettings(false)} />
  }

  const readyColor = app.readiness.score >= 70 ? '#16a34a' : app.readiness.score >= 50 ? '#ea580c' : '#dc2626'

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-200">
      {/* Header — Apple frosted navigation bar */}
      <div
        className="sticky top-0 z-50 frosted-heavy border-b border-white/[0.04]"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="px-4 py-2.5 flex justify-between items-center">
          <div>
            <div className="text-[7px] text-zinc-600 mono tracking-[0.4em] uppercase">
              Protocolo Superman
            </div>
            <div className="text-[13px] font-bold mono" style={{ color: '#c9a227' }}>
              DÍA {app.plan.day} · SEM {app.plan.week} · {app.plan.phaseName}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Settings button */}
            <button
              onClick={() => setShowSettings(true)}
              className="text-zinc-600 hover:text-zinc-400 transition-colors p-1.5 -m-1 rounded-full press"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
            {/* Readiness indicator */}
            <div className="text-right">
              <div className="text-[8px] mono font-bold" style={{ color: readyColor }}>
                READY {app.readiness.score}
              </div>
              <div className="text-[7px] text-zinc-600 mono">
                ACWR {app.readiness.acwr.toFixed(2)}
              </div>
            </div>
            <Ring pct={app.readiness.score} size={30} strokeWidth={3} color={readyColor} />
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="px-3.5 pt-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={app.tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
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
              <Combat
                plan={app.plan}
                wkLog={app.wkLog}
                setWkLog={app.setWkLog}
                decision={app.decision}
              />
            )}
            {app.tab === 'fuel' && (
              <Fuel
                scannedMeals={app.scannedMeals}
                setScannedMeals={app.setScannedMeals}
              />
            )}
            {app.tab === 'recon' && (
              <Recon
                hd={app.hd}
                setHd={app.setHd}
                medReports={app.medReports}
                setMedReports={app.setMedReports}
              />
            )}
            {app.tab === 'intel' && (
              <Intel
                plan={app.plan}
                hd={app.hd}
                checks={app.checks}
                scannedMeals={app.scannedMeals}
                wkLog={app.wkLog}
                readiness={app.readiness}
                decision={app.decision}
                injury={app.injury}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Tab Bar — Apple iOS Tab Bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 frosted-heavy border-t border-white/[0.04] safe-bottom"
      >
        <div className="grid grid-cols-5 pt-1">
          {TABS.map(t => {
            const active = app.tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => app.setTab(t.id)}
                className="py-1.5 flex flex-col items-center gap-0.5 relative press"
              >
                {/* Icon */}
                <motion.span
                  className="text-[17px]"
                  animate={active ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                  transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
                >
                  {t.icon}
                </motion.span>
                {/* Label */}
                <span
                  className="text-[10px] mono transition-colors duration-200"
                  style={{
                    color: active ? '#c9a227' : '#52525b',
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {t.label}
                </span>
                {/* Active dot indicator — Apple style */}
                {active && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -top-0.5 w-5 h-[2px] rounded-full"
                    style={{ background: '#c9a227' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
