import { motion } from 'framer-motion'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  glowColor?: string
  onClick?: () => void
}

export function GlassCard({ children, className = '', glowColor, onClick }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      onClick={onClick}
      className={`
        relative overflow-hidden
        frosted
        border border-white/[0.06]
        rounded-2xl
        ${onClick ? 'cursor-pointer press' : ''}
        ${className}
      `}
      style={glowColor ? {
        boxShadow: `
          0 0 0 0.5px ${glowColor}08,
          0 2px 16px -4px ${glowColor}12,
          inset 0 0.5px 0 0 rgba(255,255,255,0.04)
        `,
      } : {
        boxShadow: 'inset 0 0.5px 0 0 rgba(255,255,255,0.04)',
      }}
    >
      {/* Top highlight — Apple glass effect */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06) 50%, transparent)' }}
      />
      {/* Ambient glow */}
      {glowColor && (
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{ background: `radial-gradient(ellipse at 50% -20%, ${glowColor}, transparent 70%)` }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </motion.div>
  )
}
