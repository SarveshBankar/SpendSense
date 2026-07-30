import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle, X } from 'lucide-react'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

interface Props {
  toasts: Toast[]
  onRemove: (id: number) => void
}

export default function ToastContainer({ toasts, onRemove }: Props) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-glass-xl backdrop-blur-2xl border text-sm font-medium ${
              t.type === 'success'
                ? 'bg-primary-500/10 border-primary-500/20 text-primary-400'
                : t.type === 'error'
                ? 'bg-red-500/10 border-red-500/20 text-red-400'
                : 'bg-accent-500/10 border-accent-500/20 text-accent-400'
            }`}
          >
            {t.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{t.message}</span>
            <button onClick={() => onRemove(t.id)} className="ml-2 opacity-50 hover:opacity-100 transition-opacity">
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
