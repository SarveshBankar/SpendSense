import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string
  icon?: React.ReactNode
  trend?: number
  gradient?: string
  delay?: number
}

export default function StatCard({
  label, value, icon, trend, gradient = 'from-primary-500 to-primary-600', delay = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="card-premium p-6 relative overflow-hidden group"
    >
      <div className={`absolute -top-20 -right-20 w-48 h-48 rounded-full bg-gradient-to-br ${gradient} opacity-[0.06] blur-3xl group-hover:opacity-[0.10] transition-opacity duration-700`} />
      <div className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full bg-gradient-to-br ${gradient} opacity-[0.04] blur-2xl" />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <p className="card-title">{label}</p>
          {icon && (
            <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${gradient} bg-opacity-10 flex items-center justify-center shadow-lg`}>
              {icon}
            </div>
          )}
        </div>
        <p className="kpi-number text-white">{value}</p>
        {trend != null && (
          <div className={`flex items-center gap-1.5 mt-2.5 text-xs font-semibold ${trend >= 0 ? 'text-primary-400' : 'text-red-400'}`}>
            <div className={`p-0.5 rounded-full ${trend >= 0 ? 'bg-primary-500/20' : 'bg-red-500/20'}`}>
              {trend >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            </div>
            {Math.abs(trend).toFixed(1)}% vs last month
          </div>
        )}
      </div>
    </motion.div>
  )
}
