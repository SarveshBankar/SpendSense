interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  children: React.ReactNode
  className?: string
}

export default function Badge({ variant = 'neutral', children, className = '' }: BadgeProps) {
  const variants = {
    success: 'bg-primary-500/8 text-primary-400 border border-primary-500/15',
    warning: 'bg-amber-500/8 text-amber-400 border border-amber-500/15',
    danger: 'bg-red-500/8 text-red-400 border border-red-500/15',
    info: 'bg-accent-500/8 text-accent-400 border border-accent-500/15',
    neutral: 'bg-white/[0.03] text-gray-500 border border-white/8',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}
