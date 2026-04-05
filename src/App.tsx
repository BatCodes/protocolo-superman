import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from './hooks/useApp'
import type { TabId } from './lib/types'
import { Dashboard } from './pages/Dashboard'
import { Combat } from './pages/Combat'
import { Fuel } from './pages/Fuel'
import { Recon } from './pages/Recon'
import { Intel } from './pages/Intel'
import { Settings } from './pages/Settings'
import { Onboarding } from './pages/Onboarding'
import Report from './pages/Report'
import {
  LayoutGrid,
  Dumbbell,
  UtensilsCrossed,
  Heart,
  MessageCircle,
  Settings as SettingsIcon,
  FileText,
} from 'lucide-react'

const tabs: { id: TabId; label: string; Icon: typeof LayoutGrid }[] = [
  { id: 'cmd', label: 'Inicio', Icon: LayoutGrid },
  { id: 'combat', label: 'Entreno', Icon: Dumbbell },
  { id: 'fuel', label: 'Nutrición', Icon: UtensilsCrossed },
  { id: 'recon', label: 'Salud', Icon: Heart },
  { id: 'intel', label: 'IA', Icon: MessageCircle },
]

export default function App() {
  const app = useApp()
  const [showSettings, setShowSettings] = useState(false)
  const [showReport, setShowReport] = useState(false)

  // Loading — simple green pulse dot
  if (!app.loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <motion.div
            className="w-3 h-3 rounded-full"
            style={{ background: '#4ade80' }}
            animate={{
              scale: [1, 1.6, 1],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <span className="text-[12px] text-zinc-600 font-medium tracking-wide">
            Cargando
          </span>
        </motion.div>
      </div>
    )
  }

  // Onboarding
  if (app.setup) {
    return <Onboarding onComplete={app.saveProfile} />
  }

  const { healthScore, insights, weeklyReport } = app

  if (showSettings) {
    return <Settings onClose={() => setShowSettings(false)} />
  }

  if (showReport) {
    return <Report
      onClose={() => setShowReport(false)}
      healthScore={healthScore}
      report={weeklyReport}
      insights={insights}
      profile={app.profile}
      hd={app.hd}
      plan={app.plan}
    />
  }

  return (
    <div className="min-h-screen text-white" style={{ background: '#0a0a0a' }}>
      {/* ─── Header ─── */}
      <div
        className="sticky top-0 z-50 glass"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          borderBottom: '0.5px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="px-4 py-2.5 flex justify-between items-center">
          <div>
            <div className="text-[11px] text-zinc-500 leading-none">
              Semana {app.plan.week} · Día {app.plan.day}
            </div>
            <div className="text-[17px] font-semibold leading-tight text-white">
              {app.plan.phaseName}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowReport(true)}
              className="w-[30px] h-[30px] rounded-full flex items-center justify-center press"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              <FileText size={16} strokeWidth={1.8} className="text-zinc-400" />
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="w-[30px] h-[30px] rounded-full flex items-center justify-center press"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              <SettingsIcon size={16} strokeWidth={1.8} className="text-zinc-400" />
            </button>
            {/* Health Score pill */}
            <div
              className="px-2.5 py-1 rounded-full text-[12px] font-semibold mono"
              style={{ background: '#4ade8015', color: '#4ade80' }}
            >
              {healthScore.total}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Page Content ─── */}
      <div className="px-4 pt-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={app.tab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {app.tab === 'cmd' && (
              <Dashboard
                plan={app.plan} readiness={app.readiness} decision={app.decision}
                injury={app.injury} blood={app.blood} predictions={app.predictions}
                hd={app.hd} briefing={app.briefing} briefingLoading={app.briefingLoading}
                wkLog={app.wkLog} checks={app.checks} toggle={app.toggle}
                scannedMeals={app.scannedMeals} mealPlan={app.mealPlan} macros={app.macros}
                healthScore={healthScore}
              />
            )}
            {app.tab === 'combat' && (
              <Combat plan={app.plan} wkLog={app.wkLog} setWkLog={app.setWkLog} decision={app.decision} />
            )}
            {app.tab === 'fuel' && (
              <Fuel
                scannedMeals={app.scannedMeals} setScannedMeals={app.setScannedMeals}
                macroTargets={app.macros} checks={app.checks} toggle={app.toggle}
                mealPlan={app.mealPlan} profile={app.profile}
                wkLog={app.wkLog} plan={app.plan}
              />
            )}
            {app.tab === 'recon' && (
              <Recon hd={app.hd} setHd={app.setHd} medReports={app.medReports} setMedReports={app.setMedReports} />
            )}
            {app.tab === 'intel' && (
              <Intel plan={app.plan} readiness={app.readiness} decision={app.decision} injury={app.injury}
                profile={app.profile}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ─── Tab Bar (Bevel) ─── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 glass safe-bottom"
        style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)' }}
      >
        <div className="grid grid-cols-5 pt-1.5 pb-0.5">
          {tabs.map(({ id, label, Icon }) => {
            const active = app.tab === id
            const color = active ? '#4ade80' : '#525252'
            return (
              <button
                key={id}
                onClick={() => app.setTab(id)}
                className="flex flex-col items-center gap-[2px] py-0.5 press"
              >
                <Icon
                  size={22}
                  strokeWidth={active ? 2 : 1.5}
                  color={color}
                  fill={active && id === 'recon' ? color : 'none'}
                />
                <span
                  className="text-[10px] leading-tight"
                  style={{ color, fontWeight: active ? 600 : 400 }}
                >
                  {label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
