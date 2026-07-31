import { motion } from 'framer-motion'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  glow?: 'primary' | 'accent' | 'none'
  gradient?: boolean
  style?: React.CSSProperties
}

export default function Card({ children, className = '', hover, glow = 'none', gradient, style }: CardProps) {
  const cls = [
    'card-premium p-5',
    gradient ? 'gradient-border' : '',
    glow === 'primary' ? 'shadow-glow border-primary-500/15' : '',
    glow === 'accent' ? 'shadow-glow-accent border-accent-500/15' : '',
    hover ? 'card-premium-hover' : '',
    className,
  ].join(' ')

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={cls}
      style={style}
    >
      {children}
    </motion.div>
  )
}
