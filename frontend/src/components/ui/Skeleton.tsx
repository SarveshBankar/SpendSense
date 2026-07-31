import { motion } from 'framer-motion'

interface SkeletonProps {
  className?: string
  style?: React.CSSProperties
}

export default function Skeleton({ className = '', style }: SkeletonProps) {
  return (
    <motion.div
      className={`relative overflow-hidden bg-white/[0.03] rounded-2xl ${className}`}
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
    <div className="card-premium p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-5 w-32" />
        </div>
      </div>
      <Skeleton className="h-1.5 w-full rounded-full" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-12 rounded-2xl" />
        <Skeleton className="h-12 rounded-2xl" />
      </div>
    </div>
  )
}

export function SkeletonChart({ height = 260 }: { height?: number }) {
  return <Skeleton className="w-full rounded-3xl" style={{ height }} />
}
