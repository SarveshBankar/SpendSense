import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { FileText, RefreshCw, AlertCircle } from 'lucide-react'
import UploadZone from '../components/statements/UploadZone'
import StatementCard from '../components/statements/StatementCard'
import EmptyState from '../components/ui/EmptyState'
import { SkeletonCard } from '../components/ui/Skeleton'
import { statementApi, type Statement } from '../services/api'
import { useToast } from '../hooks/useToast'
import ToastContainer from '../components/ui/ToastContainer'

export default function Statements() {
  const [statements, setStatements] = useState<Statement[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
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
      await statementApi.upload(file)
      addToast('Statement uploaded successfully', 'success')
      fetchStatements()
    } catch {
      addToast('Failed to upload statement', 'error')
    }
  }

  const handleParse = async (id: string) => {
    try {
      await statementApi.parse(id)
      addToast('Statement parsed successfully', 'success')
      fetchStatements()
    } catch {
      addToast('Failed to parse statement', 'error')
    }
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
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
          <AlertCircle size={28} className="text-red-400" />
        </div>
        <p className="text-gray-400 text-sm max-w-xs">{fetchError}</p>
        <button onClick={fetchStatements} className="btn-premium !px-5 !py-2.5 !text-xs">
          <RefreshCw size={14} />
          Retry
        </button>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      <div>
        <h1 className="hero-title text-white mb-2">Statements</h1>
        <p className="text-gray-500 text-lg">Upload and manage your bank statements for automatic parsing</p>
      </div>

      <UploadZone onUpload={handleUpload} />

      <div>
        <h2 className="section-title text-white mb-4">
          Uploaded Statements
          {statements.length > 0 && (
            <span className="ml-2 text-gray-500 font-normal">{statements.length}</span>
          )}
        </h2>
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : statements.length === 0 ? (
          <EmptyState
            icon={<FileText size={24} className="text-gray-500" />}
            title="No statements uploaded yet"
            description="Upload your first PDF bank statement above to get started."
          />
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
            className="space-y-3"
          >
            {statements.map((s, i) => (
              <StatementCard
                key={s.id}
                statement={s}
                onDelete={handleDelete}
                onParse={handleParse}
                deleting={deleting === s.id}
                index={i}
              />
            ))}
          </motion.div>
        )}
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </motion.div>
  )
}
