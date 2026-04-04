interface BadgeProps {
  text: string
  color?: string
}

export function Badge({ text, color = '#c9a227' }: BadgeProps) {
  return (
    <span
      className="text-[8px] font-mono font-bold px-1.5 py-0.5 tracking-wide"
      style={{
        background: color + '20',
        color: color,
        border: `1px solid ${color}40`,
      }}
    >
      {text}
    </span>
  )
}
