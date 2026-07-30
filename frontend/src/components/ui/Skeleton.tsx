import { motion } from 'framer-motion'

interface SkeletonProps {
  className?: string
  style?: React.CSSProperties
}

export default function Skeleton({ className = '', style }: SkeletonProps) {
  return (
    <motion.div
      className={`relative overflow-hidden bg-white/[0.04] rounded-2xl ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={style}
    >
      <div className="absolute inset-0 shimmer-overlay" />
    </motion.div>
  )
}

export function SkeletonCard() {
  return (
    <div className="card-premium p-6 space-y-5">
      <div className="flex items-center gap-4">
        <Skeleton className="w-12 h-12 rounded-2xl" />
        <div className="flex-1 space-y-2.5">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-6 w-40" />
        </div>
      </div>
      <Skeleton className="h-1.5 w-full rounded-full" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-14 rounded-2xl" />
        <Skeleton className="h-14 rounded-2xl" />
      </div>
    </div>
  )
}

export function SkeletonChart({ height = 280 }: { height?: number }) {
  return <Skeleton className="w-full rounded-3xl" style={{ height }} />
}
