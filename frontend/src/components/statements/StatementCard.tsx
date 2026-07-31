import { motion } from 'framer-motion'
import { FileText, Trash2, CheckCircle2, AlertCircle, Clock, Play, Lock, Loader2, type LucideIcon } from 'lucide-react'
import type { Statement } from '../../services/api'

interface Props {
  statement: Statement
  onDelete: (id: string) => void
  onParse: (id: string) => void
  deleting?: boolean
  parsing?: boolean
  index?: number
}

const STATUS_MAP: Record<string, string> = {
  uploaded: 'pending',
  completed: 'parsed',
  failed: 'failed',
}

const statusConfig: Record<string, { icon: LucideIcon; label: string; class: string }> = {
  pending: { icon: Clock, label: 'Pending', class: 'badge-premium-warning' },
  parsed: { icon: CheckCircle2, label: 'Parsed', class: 'badge-premium-success' },
  failed: { icon: AlertCircle, label: 'Failed', class: 'badge-premium-danger' },
}

export default function StatementCard({ statement, onDelete, onParse, deleting, parsing, index = 0 }: Props) {
  const mappedStatus = STATUS_MAP[statement.status] || statement.status
  const status = statusConfig[mappedStatus] || statusConfig.pending
  const StatusIcon = status.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="card-premium-hover p-4 flex items-center justify-between gap-4 group"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent-500/8 to-accent-600/8 flex items-center justify-center shrink-0 border border-accent-500/15">
          <FileText size={18} className="text-accent-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-200 truncate">{statement.original_file_name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={status.class}>
              <StatusIcon size={10} />
              {status.label}
            </span>
            {statement.password_protected && (
              <span
                className="badge-premium-warning"
                title="Password protected PDF"
              >
                <Lock size={10} />
                Protected
              </span>
            )}
            <span className="text-xs text-gray-500">
              {new Date(statement.uploaded_at).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {mappedStatus === 'pending' && (
          <button
            onClick={() => onParse(statement.id)}
            disabled={deleting || parsing}
            className="btn-ghost-premium !p-2"
            title={statement.password_protected ? 'Parse statement (password required)' : 'Parse statement'}
          >
            {parsing ? (
              <Loader2 size={14} className="text-primary-400 animate-spin" />
            ) : (
              <Play size={14} className="text-primary-400" />
            )}
          </button>
        )}
        <button
          onClick={() => onDelete(statement.id)}
          disabled={deleting || parsing}
          className="btn-ghost-premium !p-2 !border-red-500/15 hover:!bg-red-500/10 hover:!border-red-500/25"
          title="Delete statement"
        >
          <Trash2 size={14} className="text-red-400" />
        </button>
      </div>
    </motion.div>
  )
}
