import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { FileText, RefreshCw, AlertCircle } from 'lucide-react'
import UploadZone from '../components/statements/UploadZone'
import StatementCard from '../components/statements/StatementCard'
import PasswordModal from '../components/statements/PasswordModal'
import EmptyState from '../components/ui/EmptyState'
import { SkeletonCard } from '../components/ui/Skeleton'
import { statementApi, type Statement, type ParseErrorDetail } from '../services/api'
import { useToast } from '../hooks/useToast'
import ToastContainer from '../components/ui/ToastContainer'

export default function Statements() {
  const [statements, setStatements] = useState<Statement[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [parsing, setParsing] = useState<string | null>(null)
  const [passwordStatement, setPasswordStatement] = useState<Statement | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSubmitting, setPasswordSubmitting] = useState(false)
  const { toasts, addToast, removeToast } = useToast()

  const fetchStatements = useCallback(async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const { data } = await statementApi.list()
      setStatements(data.statements || [])
    } catch {
      setFetchError('Failed to load statements')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatements()
  }, [fetchStatements])

  const handleUpload = async (file: File) => {
    try {
      const res = await statementApi.upload(file)
      addToast('Statement uploaded successfully', 'success')
      if (res.data.warning) {
        addToast(res.data.warning, 'info')
      }
      fetchStatements()
    } catch {
      addToast('Failed to upload statement', 'error')
    }
  }

  const parseErrorDetail = (err: unknown): ParseErrorDetail | null => {
    const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail
    if (typeof detail === 'object' && detail !== null) return detail as ParseErrorDetail
    return null
  }

  const runParse = async (id: string, password?: string) => {
    setParsing(id)
    try {
      const res = await statementApi.parse(id, password)
      if (res.data.status === 'completed') {
        addToast(
          res.data.successful > 0
            ? `Statement parsed: ${res.data.successful} transaction${res.data.successful === 1 ? '' : 's'}`
            : 'Statement parsed successfully',
          'success',
        )
      } else {
        const msg = res.data.errors?.[0] || 'No transactions could be extracted'
        addToast(`Parse failed: ${msg}`, 'error')
      }
      setPasswordStatement(null)
      setPasswordError(null)
      fetchStatements()
      return true
    } catch (err) {
      const detail = parseErrorDetail(err)
      if (detail?.code === 'PASSWORD_REQUIRED') {
        const stmt = statements.find((s) => s.id === id)
        setPasswordStatement(stmt ?? null)
        setPasswordError(null)
        return false
      }
      if (detail?.code === 'INCORRECT_PASSWORD') {
        setPasswordError(detail.message || 'Incorrect password. Please try again.')
        return false
      }
      addToast('Failed to parse statement', 'error')
      setPasswordStatement(null)
      setPasswordError(null)
      return false
    } finally {
      setParsing(null)
    }
  }

  const handleParse = (id: string) => {
    const stmt = statements.find((s) => s.id === id)
    if (stmt?.password_protected) {
      setPasswordStatement(stmt)
      setPasswordError(null)
      return
    }
    runParse(id)
  }

  const handlePasswordSubmit = async (password: string) => {
    if (!passwordStatement) return
    setPasswordSubmitting(true)
    setPasswordError(null)
    const ok = await runParse(passwordStatement.id, password)
    if (!ok) setPasswordSubmitting(false)
  }

  const closePasswordModal = () => {
    if (passwordSubmitting) return
    setPasswordStatement(null)
    setPasswordError(null)
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      await statementApi.delete(id)
      addToast('Statement deleted', 'success')
      fetchStatements()
    } catch {
      addToast('Failed to delete statement', 'error')
    } finally {
      setDeleting(null)
    }
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/15">
          <AlertCircle size={24} className="text-red-400" />
        </div>
        <p className="text-gray-400 text-sm max-w-xs">{fetchError}</p>
        <button onClick={fetchStatements} className="btn-premium !px-4 !py-2 !text-xs">
          <RefreshCw size={13} />
          Retry
        </button>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-5"
    >
      <div>
        <h1 className="hero-title text-white mb-1">Statements</h1>
        <p className="text-gray-500 text-sm">Upload and manage your bank statements for automatic parsing</p>
      </div>

      <UploadZone onUpload={handleUpload} />

      <div>
        <h2 className="section-title text-white mb-3">
          Uploaded Statements
          {statements.length > 0 && (
            <span className="ml-1.5 text-gray-500 font-normal text-sm">{statements.length}</span>
          )}
        </h2>
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : statements.length === 0 ? (
          <EmptyState
            icon={<FileText size={22} className="text-gray-500" />}
            title="No statements uploaded yet"
            description="Upload your first PDF bank statement above to get started."
          />
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }}
            className="space-y-2"
          >
            {statements.map((s, i) => (
              <StatementCard
                key={s.id}
                statement={s}
                onDelete={handleDelete}
                onParse={handleParse}
                deleting={deleting === s.id}
                parsing={parsing === s.id}
                index={i}
              />
            ))}
          </motion.div>
        )}
      </div>

      <PasswordModal
        open={passwordStatement !== null}
        fileName={passwordStatement?.original_file_name ?? ''}
        submitting={passwordSubmitting}
        error={passwordError}
        onClose={closePasswordModal}
        onSubmit={handlePasswordSubmit}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </motion.div>
  )
}
