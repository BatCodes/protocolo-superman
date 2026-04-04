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
import Report from './pages/Report'
import { computeHealthScore } from './engines/healthScore'
import { generateInsights, generateWeeklyReportData } from './engines/digitalTwin'
import {
  LayoutGrid,
  Dumbbell,
  UtensilsCrossed,
  Heart,
  MessageCircle,
  Settings as SettingsIcon,
  FileText,
} from 'lucide-react'

export default function App() {
  const app = useApp()
  const [showSettings, setShowSettings] = useState(false)
  const [showReport, setShowReport] = useState(false)

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
            className="w-[60px] h-[60px] mx-auto mb-5 rounded-[14px] flex items-center justify-center"
            style={{ background: 'linear-gradient(145deg, #ffd60a, #ff9f0a)' }}
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-[22px] font-black text-black">S</span>
          </motion.div>
          <motion.div
            className="flex gap-1 justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-zinc-600"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>
    )
  }

  // Onboarding
  if (app.setup) {
    return <Onboarding onComplete={app.saveProfile} />
  }

  const healthScore = computeHealthScore(app.hd, app.wkLog, app.checks, app.profile?.age || 25, app.readiness.score)
  const insights = generateInsights(app.hd, app.wkLog, healthScore, app.readiness, app.plan)
  const weeklyReport = generateWeeklyReportData(app.hd, app.wkLog, healthScore, app.plan)

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

  const readyColor = app.readiness.score >= 70 ? '#30d158' : app.readiness.score >= 50 ? '#ff9f0a' : '#ff453a'

  const tabs: { id: TabId; label: string; Icon: typeof LayoutGrid }[] = [
    { id: 'cmd', label: 'Resumen', Icon: LayoutGrid },
    { id: 'combat', label: 'Entreno', Icon: Dumbbell },
    { id: 'fuel', label: 'Nutrición', Icon: UtensilsCrossed },
    { id: 'recon', label: 'Salud', Icon: Heart },
    { id: 'intel', label: 'Intel', Icon: MessageCircle },
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      {/* ─── Navigation Bar ─── */}
      <div
        className="sticky top-0 z-50 frosted"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          borderBottom: '0.33px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="px-4 h-11 flex justify-between items-center">
          <div>
            <div className="text-[11px] text-zinc-500 leading-none">
              Día {app.plan.day} · Semana {app.plan.week}
            </div>
            <div className="text-[17px] font-semibold leading-tight" style={{ color: '#ffd60a' }}>
              {app.plan.phaseName}
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowReport(true)}
              className="w-[30px] h-[30px] rounded-full flex items-center justify-center press"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            >
              <FileText size={15} strokeWidth={1.8} className="text-zinc-400" />
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="w-[30px] h-[30px] rounded-full flex items-center justify-center press"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            >
              <SettingsIcon size={15} strokeWidth={1.8} className="text-zinc-400" />
            </button>
            <Ring pct={app.readiness.score} size={30} strokeWidth={3} color={readyColor}>
              <span className="text-[10px] font-bold mono" style={{ color: readyColor }}>
                {app.readiness.score}
              </span>
            </Ring>
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
            transition={{ duration: 0.12 }}
          >
            {app.tab === 'cmd' && (
              <Dashboard
                plan={app.plan} readiness={app.readiness} decision={app.decision}
                injury={app.injury} blood={app.blood} predictions={app.predictions}
                hd={app.hd} briefing={app.briefing} briefingLoading={app.briefingLoading}
                wkLog={app.wkLog} checks={app.checks} toggle={app.toggle}
                scannedMeals={app.scannedMeals} mealPlan={app.mealPlan} macros={app.macros}
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
              />
            )}
            {app.tab === 'recon' && (
              <Recon hd={app.hd} setHd={app.setHd} medReports={app.medReports} setMedReports={app.setMedReports} />
            )}
            {app.tab === 'intel' && (
              <Intel plan={app.plan} hd={app.hd} checks={app.checks} scannedMeals={app.scannedMeals}
                wkLog={app.wkLog} readiness={app.readiness} decision={app.decision} injury={app.injury}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ─── Tab Bar (iOS) ─── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 frosted safe-bottom"
        style={{ borderTop: '0.33px solid rgba(255,255,255,0.08)' }}
      >
        <div className="grid grid-cols-5 pt-1.5 pb-0.5">
          {tabs.map(({ id, label, Icon }) => {
            const active = app.tab === id
            const color = active ? '#0a84ff' : '#48484a'
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
