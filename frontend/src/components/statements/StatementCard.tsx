import { motion } from 'framer-motion'
import { FileText, Trash2, CheckCircle2, AlertCircle, Clock, Play } from 'lucide-react'
import type { Statement } from '../../services/api'

interface Props {
  statement: Statement
  onDelete: (id: string) => void
  onParse: (id: string) => void
  deleting?: boolean
  index?: number
}

const STATUS_MAP: Record<string, string> = {
  uploaded: 'pending',
  completed: 'parsed',
  failed: 'failed',
}

const statusConfig: Record<string, { icon: any; label: string; class: string }> = {
  pending: { icon: Clock, label: 'Pending', class: 'badge-premium-warning' },
  parsed: { icon: CheckCircle2, label: 'Parsed', class: 'badge-premium-success' },
  failed: { icon: AlertCircle, label: 'Failed', class: 'badge-premium-danger' },
}

export default function StatementCard({ statement, onDelete, onParse, deleting, index = 0 }: Props) {
  const mappedStatus = STATUS_MAP[statement.status] || statement.status
  const status = statusConfig[mappedStatus] || statusConfig.pending
  const StatusIcon = status.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="card-premium-hover p-4 flex items-center justify-between gap-4 group"
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-500/10 to-accent-600/10 flex items-center justify-center flex-shrink-0 border border-accent-500/20">
          <FileText size={20} className="text-accent-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-200 truncate">{statement.original_file_name}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={status.class}>
              <StatusIcon size={11} />
              {status.label}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(statement.uploaded_at).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {mappedStatus === 'pending' && (
          <button
            onClick={() => onParse(statement.id)}
            disabled={deleting}
            className="btn-ghost-premium !p-2.5"
            title="Parse statement"
          >
            <Play size={15} className="text-primary-400" />
          </button>
        )}
        <button
          onClick={() => onDelete(statement.id)}
          disabled={deleting}
          className="btn-ghost-premium !p-2.5 !border-red-500/20 hover:!bg-red-500/10 hover:!border-red-500/30"
          title="Delete statement"
        >
          <Trash2 size={15} className="text-red-400" />
        </button>
      </div>
    </motion.div>
  )
}
