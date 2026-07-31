import { useState } from 'react'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

interface Props {
  open: boolean
  fileName: string
  submitting: boolean
  error: string | null
  onClose: () => void
  onSubmit: (password: string) => void
}

export default function PasswordModal({
  open,
  fileName,
  submitting,
  error,
  onClose,
  onSubmit,
}: Props) {
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim() || submitting) return
    onSubmit(password)
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div className="flex flex-col items-center text-center mb-5">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500/10 to-accent-500/10 flex items-center justify-center border border-primary-500/15 mb-3">
          <Lock size={20} className="text-primary-400" />
        </div>
        <h3 className="text-base font-bold text-white">PDF password required</h3>
        <p className="text-xs text-gray-500 mt-1 max-w-xs">
          This statement is password protected. Enter the PDF password to parse it.
        </p>
        <p className="text-xs font-medium text-gray-400 mt-1.5 truncate max-w-[260px]">{fileName}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <input
            type={show ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="PDF password"
            autoFocus
            disabled={submitting}
            className="w-full bg-white/[0.03] border border-[rgba(255,255,255,0.08)] rounded-2xl px-4 py-2.5 pr-11 text-sm text-white placeholder:text-gray-600 outline-none focus:border-primary-500/40 transition-colors"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-red-400 flex items-center gap-1.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
            {error}
          </motion.p>
        )}

        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            className="flex-1"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="premium"
            className="flex-1"
            disabled={!password.trim() || submitting}
          >
            {submitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Parsing...
              </>
            ) : (
              'Unlock & Parse'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
