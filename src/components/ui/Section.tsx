interface SectionProps {
  title: string
  color?: string
  right?: string
}

export function Section({ title, color = '#c9a227', right }: SectionProps) {
  return (
    <div className="flex items-center gap-2 my-3">
      <div className="h-px flex-1 bg-white/10" />
      <span
        className="text-[9px] font-mono font-bold tracking-[0.2em]"
        style={{ color }}
      >
        {title}
      </span>
      {right && (
        <span className="text-[9px] font-mono text-zinc-500">{right}</span>
      )}
      <div className="h-px flex-1 bg-white/10" />
    </div>
  )
}
