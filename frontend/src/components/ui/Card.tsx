import { motion } from 'framer-motion'
import { useRef } from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  glow?: 'primary' | 'accent' | 'none'
  gradient?: boolean
  style?: React.CSSProperties
}

export default function Card({ children, className = '', hover, glow = 'none', gradient, style }: CardProps) {
  const ref = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!hover || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    ref.current.style.transform = `perspective(600px) rotateY(${x * 3}deg) rotateX(${-y * 3}deg) translateY(-4px)`
  }

  const handleMouseLeave = () => {
    if (!ref.current) return
    ref.current.style.transform = 'perspective(600px) rotateY(0deg) rotateX(0deg) translateY(0px)'
  }

  const cls = [
    'card-premium p-6',
    gradient ? 'gradient-border' : '',
    glow === 'primary' ? 'shadow-glow border-primary-500/20' : '',
    glow === 'accent' ? 'shadow-glow-accent border-accent-500/20' : '',
    className,
  ].join(' ')

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      onMouseMove={hover ? handleMouseMove : undefined}
      onMouseLeave={hover ? handleMouseLeave : undefined}
      className={cls}
      style={{ transition: 'transform 0.3s ease-out, box-shadow 0.4s ease-out, border-color 0.4s ease-out', ...style }}
    >
      {children}
    </motion.div>
  )
}
