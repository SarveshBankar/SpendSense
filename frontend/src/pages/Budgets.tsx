import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Edit3, Trash2, DollarSign, AlertCircle,
  CheckCircle2, Calendar, PieChart,
} from 'lucide-react'
import Card from '../components/ui/Card'
import ProgressRing from '../components/ui/ProgressRing'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import {
  budgetApi,
  type Budget,
  type BudgetListResponse,
} from '../services/api'
import { SkeletonCard } from '../components/ui/Skeleton'

function BudgetModal({
  open, onClose, onSave, initial,
}: {
  open: boolean
  onClose: () => void
  onSave: (data: any) => void
  initial?: Budget | null
}) {
  const [form, setForm] = useState({
    category: '',
    monthly_budget: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  })

  useEffect(() => {
    if (initial) {
      setForm({
        category: initial.category || '',
        monthly_budget: String(initial.monthly_budget),
        month: initial.month,
        year: initial.year,
      })
    } else {
      setForm({
        category: '',
        monthly_budget: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      })
    }
  }, [initial, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload: any = {
      monthly_budget: parseFloat(form.monthly_budget),
      month: form.month,
      year: form.year,
    }
    if (form.category.trim()) payload.category = form.category.trim()
    onSave(payload)
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit Budget' : 'Create Budget'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1.5 block">Category (optional)</label>
          <input
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            placeholder="e.g. Food, Transport..."
            className="input-premium"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1.5 block">Monthly Budget (₹)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            required
            value={form.monthly_budget}
            onChange={(e) => setForm({ ...form, monthly_budget: e.target.value })}
            placeholder="50000"
            className="input-premium"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Month</label>
            <select
              value={form.month}
              onChange={(e) => setForm({ ...form, month: Number(e.target.value) })}
              className="input-premium"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Year</label>
            <input
              type="number"
              min="2020"
              max="2100"
              value={form.year}
              onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
              className="input-premium"
            />
          </div>
        </div>
        <Button variant="premium" type="submit" className="w-full">
          {initial ? 'Update Budget' : 'Create Budget'}
        </Button>
      </form>
    </Modal>
  )
}

function DeleteConfirm({
  open, onClose, onConfirm, name,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  name: string
}) {
  if (!open) return null
  return (
    <Modal open={open} onClose={onClose} title="Delete Budget">
      <div className="text-center">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={22} className="text-red-400" />
        </div>
        <p className="text-sm text-gray-400 mb-5">
          Are you sure you want to delete the budget for <strong className="text-gray-200">{name}</strong>?
        </p>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
          <Button variant="danger" onClick={onConfirm} className="flex-1">Delete</Button>
        </div>
      </div>
    </Modal>
  )
}

export default function Budgets() {
  const [data, setData] = useState<BudgetListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editBudget, setEditBudget] = useState<Budget | null>(null)
  const [deleteBudget, setDeleteBudget] = useState<Budget | null>(null)
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const res = await budgetApi.list({ month, year })
      setData(res.data)
    } catch {
      setMessage({ type: 'error', text: 'Failed to load budgets' })
    } finally {
      setLoading(false)
    }
  }, [month, year])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 4000)
  }

  const handleSave = async (payload: any) => {
    try {
      if (editBudget) {
        await budgetApi.update(editBudget.id, payload)
        showMessage('success', 'Budget updated successfully')
      } else {
        await budgetApi.create(payload)
        showMessage('success', 'Budget created successfully')
      }
      setModalOpen(false)
      setEditBudget(null)
      fetchData()
    } catch (err: any) {
      showMessage('error', err.response?.data?.detail || 'Failed to save budget')
    }
  }

  const handleDelete = async () => {
    if (!deleteBudget) return
    try {
      await budgetApi.delete(deleteBudget.id)
      showMessage('success', 'Budget deleted')
      setDeleteBudget(null)
      fetchData()
    } catch {
      showMessage('error', 'Failed to delete budget')
    }
  }

  const categoryColors: Record<string, string> = {
    Food: 'from-orange-500 to-orange-600', Groceries: 'from-primary-500 to-primary-600',
    Transport: 'from-blue-500 to-blue-600', Utilities: 'from-purple-500 to-purple-600',
    Entertainment: 'from-pink-500 to-pink-600', Shopping: 'from-cyan-500 to-cyan-600',
    Health: 'from-red-500 to-red-600', Education: 'from-accent-500 to-accent-600',
    Rent: 'from-amber-500 to-amber-600', Bills: 'from-yellow-500 to-yellow-600',
    Salary: 'from-green-500 to-green-600', Investment: 'from-teal-500 to-teal-600',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="hero-title text-white mb-2">Budgets</h1>
          <p className="text-gray-500 text-lg">Set monthly spending limits and track progress</p>
        </div>
        <Button variant="premium" onClick={() => { setEditBudget(null); setModalOpen(true) }}>
          <Plus size={15} />
          New Budget
        </Button>
      </div>

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-medium ${
              message.type === 'success'
                ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20'
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Calendar size={15} className="text-gray-500" />
          <select
            value={month}
            onChange={(e) => { setMonth(Number(e.target.value)); setLoading(true) }}
            className="input-premium !w-auto"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={year}
            onChange={(e) => { setYear(Number(e.target.value)); setLoading(true) }}
            className="input-premium !w-20"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : data && (data?.budgets?.length ?? 0) > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card hover glow="primary">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total Budgeted</p>
              <p className="text-xl font-bold text-white">₹{(data?.total_budgeted ?? 0).toLocaleString('en-IN')}</p>
            </Card>
            <Card hover glow="accent">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total Spent</p>
              <p className="text-xl font-bold text-red-400">₹{(data?.total_spent ?? 0).toLocaleString('en-IN')}</p>
            </Card>
            <Card hover glow="primary">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Remaining</p>
              <p className="text-xl font-bold text-primary-400">₹{(data?.total_remaining ?? 0).toLocaleString('en-IN')}</p>
            </Card>
            <Card hover glow="accent">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Utilization</p>
              <p className="text-xl font-bold text-accent-400">{data?.overall_utilization ?? 0}%</p>
              <div className="w-full h-1.5 bg-white/5 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary-500 to-amber-500"
                  style={{ width: `${Math.min(data?.overall_utilization ?? 0, 100)}%` }}
                />
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {(data?.budgets ?? []).map((b) => {
              const color = b.category ? categoryColors[b.category] || 'from-accent-500 to-accent-600' : 'from-gray-500 to-gray-600'
              const isOver = b.utilization_pct >= 100
              const isWarning = b.utilization_pct >= 80 && b.utilization_pct < 100
              return (
                <motion.div
                  key={b.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card-premium p-5 space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center`}>
                        <PieChart size={18} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-200">{b.category || 'Overall Budget'}</h3>
                        <p className="text-xs text-gray-500">{new Date(b.year, b.month - 1).toLocaleString('default', { month: 'long' })} {b.year}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => { setEditBudget(b); setModalOpen(true) }}
                        className="p-1.5 rounded-xl hover:bg-white/5 text-gray-500 hover:text-accent-400 transition-colors"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteBudget(b)}
                        className="p-1.5 rounded-xl hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <ProgressRing value={b.utilization_pct} size={64} strokeWidth={5} color={isOver ? '#EF4444' : isWarning ? '#F59E0B' : '#10B981'} />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Spent</span>
                        <span className="font-semibold text-gray-200">₹{b.current_spent.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isOver ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-primary-500'
                          }`}
                          style={{ width: `${Math.min(b.utilization_pct, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">of ₹{b.monthly_budget.toLocaleString('en-IN')}</span>
                        <span className="text-gray-500">₹{b.remaining_budget.toLocaleString('en-IN')} left</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="bg-white/[0.03] rounded-2xl p-3">
                      <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Daily Allowance</p>
                      <p className="text-sm font-bold text-gray-200 mt-0.5">₹{b.daily_allowance.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="bg-white/[0.03] rounded-2xl p-3">
                      <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Predicted End</p>
                      <p className={`text-sm font-bold mt-0.5 ${b.overspending ? 'text-red-400' : 'text-primary-400'}`}>
                        ₹{b.predicted_end.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>

                  {b.overspending && (
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-2xl">
                      <AlertCircle size={14} className="text-red-400 shrink-0" />
                      <p className="text-xs font-medium text-red-400">
                        On track to exceed budget by ₹{(b.predicted_end - b.monthly_budget).toLocaleString('en-IN')}
                      </p>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </>
      ) : (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 rounded-3xl bg-white/[0.03] flex items-center justify-center mx-auto mb-4 border border-[rgba(255,255,255,0.06)]">
            <DollarSign size={28} className="text-gray-500" />
          </div>
          <h3 className="text-base font-semibold text-gray-200 mb-1">No budgets yet</h3>
          <p className="text-sm text-gray-500 mb-5">Create your first budget to track spending</p>
          <Button variant="premium" onClick={() => { setEditBudget(null); setModalOpen(true) }}>
            <Plus size={15} />
            Create Budget
          </Button>
        </Card>
      )}

      <BudgetModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditBudget(null) }}
        onSave={handleSave}
        initial={editBudget}
      />
      <DeleteConfirm
        open={!!deleteBudget}
        onClose={() => setDeleteBudget(null)}
        onConfirm={handleDelete}
        name={deleteBudget?.category || 'Overall Budget'}
      />
    </motion.div>
  )
}
