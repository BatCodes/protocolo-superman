import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from './hooks/useApp'
import { Ring } from './components/ui/Ring'
import type { TabId } from './lib/types'
import { Dashboard } from './pages/Dashboard'
import { Combat } from './pages/Combat'
import { Fuel } from './pages/Fuel'
import { Recon } from './pages/Recon'
import { Intel } from './pages/Intel'
import { Settings } from './pages/Settings'
import { Onboarding } from './pages/Onboarding'

export default function App() {
  const app = useApp()
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
    return <Onboarding onComplete={app.saveProfile} />
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
                mealPlan={app.mealPlan}
                macros={app.macros}
              />
            )}
            {app.tab === 'combat' && (
              <Combat plan={app.plan} wkLog={app.wkLog} setWkLog={app.setWkLog} decision={app.decision} />
            )}
            {app.tab === 'fuel' && (
              <Fuel
                scannedMeals={app.scannedMeals}
                setScannedMeals={app.setScannedMeals}
                macroTargets={app.macros}
                checks={app.checks}
                toggle={app.toggle}
                mealPlan={app.mealPlan}
              />
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

      {/* Tab Bar — iOS Native */}
      <div className="fixed bottom-0 left-0 right-0 z-50 frosted border-t border-white/[0.06] safe-bottom">
        <div className="grid grid-cols-5 pt-2 pb-1">
          {([
            { id: 'cmd' as TabId, label: 'Resumen', icon: (c: string) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg> },
            { id: 'combat' as TabId, label: 'Entreno', icon: (c: string) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 6.5L17.5 17.5M6.5 17.5L17.5 6.5"/><circle cx="12" cy="12" r="9"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2"/></svg> },
            { id: 'fuel' as TabId, label: 'Nutrición', icon: (c: string) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M12 6v6l4 2"/></svg> },
            { id: 'recon' as TabId, label: 'Salud', icon: (c: string) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0L12 5.34l-.77-.76a5.4 5.4 0 0 0-7.65 0 5.4 5.4 0 0 0 0 7.65L12 20.65l8.42-8.42a5.4 5.4 0 0 0 0-7.65z"/></svg> },
            { id: 'intel' as TabId, label: 'Intel', icon: (c: string) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
          ]).map(t => {
            const active = app.tab === t.id
            const color = active ? '#ffd60a' : '#48484a'
            return (
              <button
                key={t.id}
                onClick={() => app.setTab(t.id)}
                className="flex flex-col items-center gap-1 press"
              >
                {t.icon(color)}
                <span
                  className="text-[10px]"
                  style={{ color, fontWeight: active ? 600 : 400 }}
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
