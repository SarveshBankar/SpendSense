import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, AlertCircle } from 'lucide-react'
import TransactionFilters, { type FiltersState } from '../components/transactions/TransactionFilters'
import TransactionTable from '../components/transactions/TransactionTable'
import { SkeletonCard } from '../components/ui/Skeleton'
import { transactionApi, type Transaction } from '../services/api'

const PAGE_SIZE = 25

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<string[]>([])

  const [filters, setFilters] = useState<FiltersState>({
    search: '',
    type: '',
    category: '',
    from: '',
    to: '',
    sort_by: 'date',
    sort_order: 'desc',
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params: Record<string, any> = {
        limit: PAGE_SIZE,
        skip: (page - 1) * PAGE_SIZE,
        sort_by: filters.sort_by,
        sort_order: filters.sort_order,
      }
      if (filters.search) params.search = filters.search
      if (filters.type) params.transaction_type = filters.type
      if (filters.category) params.category = filters.category
      if (filters.from && filters.to && filters.from > filters.to) {
        params.from = filters.to
        params.to = filters.from
      } else {
        if (filters.from) params.from = filters.from
        if (filters.to) params.to = filters.to
      }

      const res = await transactionApi.list(params)
      const d = res?.data ?? {}
      const txns = d?.transactions ?? []
      setTransactions(txns)
      setTotalPages(Math.ceil((d?.total ?? 0) / PAGE_SIZE) || 1)
      setCategories([...new Set(txns.map((t: Transaction) => t.category).filter(Boolean))] as string[])
    } catch {
      setError('Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }, [page, filters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/15">
          <AlertCircle size={24} className="text-red-400" />
        </div>
        <p className="text-gray-400 text-sm max-w-xs">{error}</p>
        <button onClick={() => fetchData()} className="btn-premium !px-4 !py-2 !text-xs">
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
        <h1 className="hero-title text-white mb-1">Transactions</h1>
        <p className="text-gray-500 text-sm">Search, filter, and browse all your financial transactions</p>
      </div>

      <TransactionFilters filters={filters} onChange={(f) => { setFilters(f); setPage(1) }} categories={categories} />

      <div className="card-premium p-5">
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <SkeletonCard />
              </div>
            ))}
          </div>
        ) : (
          <TransactionTable
            transactions={transactions}
            loading={false}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      </div>
    </motion.div>
  )
}
