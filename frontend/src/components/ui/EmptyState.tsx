import { motion } from 'framer-motion'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="card-premium p-12 text-center"
    >
      {icon && (
        <div className="w-14 h-14 rounded-3xl bg-white/[0.03] flex items-center justify-center mx-auto mb-4 border border-[rgba(255,255,255,0.06)]">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-gray-200 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 mb-5 max-w-sm mx-auto">{description}</p>}
      {action}
    </motion.div>
  )
}
