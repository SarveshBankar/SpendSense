import { motion } from 'framer-motion'
import { ArrowUpRight, ArrowDownLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import EmptyState from '../ui/EmptyState'
import Spinner from '../ui/Spinner'
import type { Transaction } from '../../services/api'

interface Props {
  transactions: Transaction[]
  loading: boolean
  page: number
  totalPages: number
  onPageChange: (p: number) => void
}

export default function TransactionTable({ transactions = [], loading, page, totalPages, onPageChange }: Props) {
  const items = transactions ?? []

  if (loading) return <Spinner />

  if (items.length === 0) {
    return <EmptyState title="No transactions found." description="Try adjusting your filters or upload a new statement." />
  }

  return (
    <div>
      <div className="overflow-x-auto -mx-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[rgba(255,255,255,0.05)]">
              <th className="pb-2.5 px-5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-[0.06em]">Date</th>
              <th className="pb-2.5 px-5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-[0.06em]">Description</th>
              <th className="pb-2.5 px-5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-[0.06em]">Category</th>
              <th className="pb-2.5 px-5 text-right text-[10px] font-semibold text-gray-500 uppercase tracking-[0.06em]">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((tx, i) => (
              <motion.tr
                key={tx.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02, duration: 0.25, ease: 'easeOut' }}
                className="border-b border-[rgba(255,255,255,0.03)] last:border-0 hover:bg-white/[0.02] transition-colors group"
              >
                <td className="py-3 px-5 text-gray-400 whitespace-nowrap text-xs font-medium">{tx.date}</td>
                <td className="py-3 px-5 text-gray-200 font-medium max-w-xs truncate">{tx.description}</td>
                <td className="py-3 px-5">
                  <span className="badge-premium-info">{tx.category || 'Uncategorized'}</span>
                </td>
                <td className="py-3 px-5 text-right whitespace-nowrap">
                  <span className={`inline-flex items-center gap-1 font-semibold text-sm ${
                    tx.transaction_type === 'credit' ? 'text-primary-400' : 'text-red-400'
                  }`}>
                    {tx.transaction_type === 'credit' ? <ArrowUpRight size={13} /> : <ArrowDownLeft size={13} />}
                    ₹{tx.amount.toLocaleString('en-IN')}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-[rgba(255,255,255,0.05)] mt-2">
          <p className="text-xs text-gray-500 font-medium">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-1.5">
            <button
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="btn-ghost-premium !px-2.5 !py-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="btn-ghost-premium !px-2.5 !py-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
