interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  children: React.ReactNode
  className?: string
}

export default function Badge({ variant = 'neutral', children, className = '' }: BadgeProps) {
  const variants = {
    success: 'bg-primary-500/10 text-primary-400 border border-primary-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    danger: 'bg-red-500/10 text-red-400 border border-red-500/20',
    info: 'bg-accent-500/10 text-accent-400 border border-accent-500/20',
    neutral: 'bg-white/5 text-gray-400 border border-white/10',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-semibold ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}
