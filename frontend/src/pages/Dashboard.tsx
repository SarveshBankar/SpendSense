import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp, TrendingDown,
  Upload, List, ArrowRight, AlertCircle, Info,
  CheckCircle2, AlertTriangle, Shield, BarChart3,
  Target, Sparkles, Zap, Plus, RefreshCw,
  Wallet, CreditCard,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Card from '../components/ui/Card'
import ProgressRing from '../components/ui/ProgressRing'
import { SkeletonCard, SkeletonChart } from '../components/ui/Skeleton'
import { transactionApi, insightApi, budgetApi, goalApi, type Transaction, type InsightsResponse, type BudgetListResponse, type GoalListResponse } from '../services/api'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [txns, setTxns] = useState<Transaction[]>([])
  const [insights, setInsights] = useState<InsightsResponse | null>(null)
  const [budgetData, setBudgetData] = useState<BudgetListResponse | null>(null)
  const [goalData, setGoalData] = useState<GoalListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = () => {
    setLoading(true)
    setError(null)
    Promise.all([
      transactionApi.list({ limit: 500 }),
      insightApi.get(),
      budgetApi.list(),
      goalApi.list(),
    ])
      .then(([txRes, insRes, budRes, goalRes]) => {
        setTxns(txRes?.data?.transactions ?? [])
        setInsights(insRes?.data ?? null)
        setBudgetData(budRes?.data ?? null)
        setGoalData(goalRes?.data ?? null)
      })
      .catch(() => setError('Failed to load dashboard data'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/15">
          <AlertCircle size={24} className="text-red-400" />
        </div>
        <p className="text-gray-400 text-sm max-w-xs">{error}</p>
        <button onClick={fetchData} className="btn-premium !px-4 !py-2 !text-xs">
          <RefreshCw size={13} />
          Retry
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <div>
          <div className="h-8 w-52 bg-white/5 rounded-2xl shimmer-overlay" />
          <div className="h-3 w-64 bg-white/5 rounded-2xl mt-2 shimmer-overlay" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map((i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <SkeletonChart height={260} />
          <SkeletonChart height={260} />
        </div>
      </div>
    )
  }

  const stats = insights?.statistics
  const scoreData = insights?.financial_score
  const score = scoreData?.score ?? 0
  const recentTxns = txns.slice(0, 5)
  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F0F14] to-[#16161D] border border-[rgba(255,255,255,0.05)] p-6"
      >
        <div className="blob w-[300px] h-[300px] bg-primary-500/8 top-[-30%] right-[-10%] absolute animate-blob" />
        <div className="blob w-[250px] h-[250px] bg-accent-500/6 bottom-[-20%] left-[-5%] absolute animate-blob-reverse" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="hero-title text-white mb-1">
              {greeting}, {user?.full_name?.split(' ')[0] || 'there'}
            </h1>
            <p className="text-gray-500 text-sm max-w-xl">
              {insights?.summary || "Here's your financial snapshot"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/statements')} className="btn-premium !px-4 !py-2">
              <Upload size={14} />
              Upload
            </button>
            <button onClick={() => navigate('/analytics')} className="btn-outline !px-4 !py-2">
              <Sparkles size={14} />
              Insights
            </button>
          </div>
        </div>
      </motion.div>

      {/* KPI Grid */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <Card glow="primary" className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-primary-500/8 to-primary-600/4 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <p className="card-title">Total Income</p>
              <div className="w-8 h-8 rounded-xl bg-primary-500/10 flex items-center justify-center">
                <TrendingUp size={14} className="text-primary-400" />
              </div>
            </div>
            <p className="kpi-number text-white">₹{(stats?.total_income ?? 0).toLocaleString('en-IN')}</p>
          </div>
        </Card>

        <Card glow="accent" className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-red-500/8 to-red-600/4 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <p className="card-title">Total Expenses</p>
              <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center">
                <TrendingDown size={14} className="text-red-400" />
              </div>
            </div>
            <p className="kpi-number text-white">₹{(stats?.total_expense ?? 0).toLocaleString('en-IN')}</p>
          </div>
        </Card>

        <Card glow="primary" className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-primary-500/8 to-primary-600/4 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <p className="card-title">Net Savings</p>
              <div className="w-8 h-8 rounded-xl bg-primary-500/10 flex items-center justify-center">
                <Wallet size={14} className="text-primary-400" />
              </div>
            </div>
            <p className="kpi-number text-white">₹{(stats?.net_savings ?? 0).toLocaleString('en-IN')}</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <TrendingUp size={10} className="text-primary-400" />
              <span className="text-[11px] text-primary-400 font-medium">{stats?.savings_rate ?? 0}% savings rate</span>
            </div>
          </div>
        </Card>

        <Card glow="accent" className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-accent-500/8 to-accent-600/4 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <p className="card-title">Transactions</p>
              <div className="w-8 h-8 rounded-xl bg-accent-500/10 flex items-center justify-center">
                <CreditCard size={14} className="text-accent-400" />
              </div>
            </div>
            <p className="kpi-number text-white">{(stats?.total_transactions ?? 0).toLocaleString('en-IN')}</p>
          </div>
        </Card>
      </motion.div>

      {/* Charts + Score */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="xl:col-span-2"
        >
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="section-title text-white mb-0">Income vs Expense</h3>
              <button onClick={() => navigate('/analytics')} className="text-[11px] font-medium text-primary-400 hover:text-primary-300 transition-colors">
                Detailed View →
              </button>
            </div>
            <div className="text-white p-6">Chart temporarily disabled</div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card glow="primary" className="h-full">
            <div className="flex flex-col items-center">
              <h3 className="section-title text-white mb-4">Financial Health</h3>
              <ProgressRing
                value={score}
                size={120}
                strokeWidth={7}
                color={score >= 70 ? '#10B981' : score >= 40 ? '#F59E0B' : '#EF4444'}
              />
              <p className="card-title text-gray-400 mt-2">
                {score >= 70 ? 'Excellent shape' : score >= 40 ? 'Room to improve' : 'Needs attention'}
              </p>

              <div className="w-full space-y-3 mt-4">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-500">Savings Rate</span>
                    <span className={`font-semibold ${(stats?.savings_rate ?? 0) >= 20 ? 'text-primary-400' : 'text-amber-400'}`}>
                      {stats?.savings_rate ?? 0}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(stats?.savings_rate ?? 0, 100)}%` }}
                      transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-500">Categorized</span>
                    <span className="font-semibold text-accent-400">{stats?.categorized_pct ?? 0}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-accent-500 to-accent-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${stats?.categorized_pct ?? 0}%` }}
                      transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* AI Insights */}
      {(insights?.insights?.length ?? 0) > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={15} className="text-accent-400" />
            <h2 className="section-title text-white mb-0">AI Insights</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {insights?.insights?.slice(0, 4).map((card, i) => {
              const Icon = card.severity === 'success' ? CheckCircle2 : card.severity === 'warning' ? AlertTriangle : card.severity === 'danger' ? AlertCircle : Info
              const cfg = {
                success: { color: 'text-primary-400', bg: 'bg-primary-500/8', border: 'border-primary-500/15' },
                info: { color: 'text-accent-400', bg: 'bg-accent-500/8', border: 'border-accent-500/15' },
                warning: { color: 'text-amber-400', bg: 'bg-amber-500/8', border: 'border-amber-500/15' },
                danger: { color: 'text-red-400', bg: 'bg-red-500/8', border: 'border-red-500/15' },
              }[card.severity] || { color: 'text-gray-400', bg: 'bg-white/5', border: 'border-white/10' }
              return (
                <motion.div
                  key={card.type}
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: i * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="card-premium p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center shrink-0`}>
                      <Icon size={14} className={cfg.color} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-0.5">{card.label}</p>
                      <p className="text-sm font-bold text-white truncate">{card.value}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{card.detail}</p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Recommendations */}
      {(insights?.recommendations?.length ?? 0) > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card gradient>
            <div className="flex items-center gap-2 mb-4">
              <Shield size={15} className="text-accent-400" />
              <h2 className="section-title text-white mb-0">Recommendations</h2>
            </div>
            <div className="space-y-2">
              {insights?.recommendations?.slice(0, 3).map((rec, i) => (
                <motion.div
                  key={rec.type + i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-[rgba(255,255,255,0.04)]"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-gray-200">{rec.title}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-semibold ${
                        rec.priority === 'high' ? 'bg-red-500/10 text-red-400' :
                        rec.priority === 'medium' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-accent-500/10 text-accent-400'
                      }`}>
                        {rec.priority}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{rec.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Budget + Goals + Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card glow="primary">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target size={14} className="text-primary-400" />
                <h3 className="section-title text-white mb-0">Budget Summary</h3>
              </div>
              <button onClick={() => navigate('/budgets')} className="text-[11px] font-medium text-primary-400 hover:text-primary-300 transition-colors">
                Manage →
              </button>
            </div>
            {budgetData && budgetData.total > 0 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white/[0.03] rounded-2xl p-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Budgeted</p>
                    <p className="text-sm font-bold text-white mt-0.5">₹{budgetData.total_budgeted.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-white/[0.03] rounded-2xl p-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Spent</p>
                    <p className="text-sm font-bold text-red-400 mt-0.5">₹{budgetData.total_spent.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-white/[0.03] rounded-2xl p-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Remaining</p>
                    <p className="text-sm font-bold text-primary-400 mt-0.5">₹{budgetData.total_remaining.toLocaleString('en-IN')}</p>
                  </div>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-primary-500 via-amber-500 to-red-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(budgetData.overall_utilization, 100)}%` }}
                    transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
                <p className="text-xs text-gray-500">{budgetData.overall_utilization}% utilized across {budgetData.total} budget{budgetData.total !== 1 ? 's' : ''}</p>
                {(budgetData?.budgets ?? []).slice(0, 3).map((b) => (
                  <div key={b.id} className="flex items-center gap-3 py-1">
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-gray-300">{b.category || 'Overall'}</span>
                        <span className="text-gray-500">{b.utilization_pct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${b.utilization_pct >= 100 ? 'bg-red-500' : b.utilization_pct >= 80 ? 'bg-amber-500' : 'bg-primary-500'}`}
                          style={{ width: `${Math.min(b.utilization_pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-3xl bg-white/[0.03] flex items-center justify-center mx-auto mb-3 border border-[rgba(255,255,255,0.06)]">
                  <Target size={20} className="text-gray-500" />
                </div>
                <p className="text-sm text-gray-500 mb-3">No budgets set yet</p>
                <button onClick={() => navigate('/budgets')} className="btn-premium text-xs">
                  <Plus size={13} />
                  Create Budget
                </button>
              </div>
            )}
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card glow="accent">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={14} className="text-accent-400" />
              <h3 className="section-title text-white mb-0">Savings Goals</h3>
            </div>
            {goalData && goalData.total > 0 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/[0.03] rounded-2xl p-3 text-center">
                    <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Total Saved</p>
                    <p className="text-sm font-bold text-primary-400 mt-0.5">₹{goalData.total_saved.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-white/[0.03] rounded-2xl p-3 text-center">
                    <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Progress</p>
                    <p className="text-sm font-bold text-accent-400 mt-0.5">{goalData.overall_progress}%</p>
                  </div>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-accent-500 to-purple-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(goalData.overall_progress, 100)}%` }}
                    transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
                {(goalData?.goals ?? []).slice(0, 3).map((g) => (
                  <div key={g.id} className="flex items-center gap-3 py-1.5">
                    <ProgressRing value={g.progress_pct} size={40} strokeWidth={3} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-200 truncate">{g.goal_name}</p>
                      <p className="text-xs text-gray-500">₹{g.current_amount.toLocaleString('en-IN')} / ₹{g.target_amount.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-3xl bg-white/[0.03] flex items-center justify-center mx-auto mb-3 border border-[rgba(255,255,255,0.06)]">
                  <Zap size={20} className="text-gray-500" />
                </div>
                <p className="text-sm text-gray-500">No savings goals yet</p>
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Charts + Recent */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.36, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="xl:col-span-2"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Card>Charts temporarily disabled</Card>
           <Card>Charts temporarily disabled</Card>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-4"
        >
          <Card gradient>
            <h3 className="section-title text-white mb-3">Quick Actions</h3>
            <div className="space-y-1">
              {[
                { icon: Upload, label: 'Upload Statement', desc: 'Import new bank data', path: '/statements', color: 'text-primary-400', bg: 'bg-primary-500/8' },
                { icon: List, label: 'View Transactions', desc: 'Browse all entries', path: '/transactions', color: 'text-accent-400', bg: 'bg-accent-500/8' },
                { icon: Target, label: 'Manage Budgets', desc: 'Set spending limits', path: '/budgets', color: 'text-amber-400', bg: 'bg-amber-500/8' },
                { icon: BarChart3, label: 'View Analytics', desc: 'Deep dive into data', path: '/analytics', color: 'text-accent-400', bg: 'bg-accent-500/8' },
              ].map(({ icon: Icon, label, desc, path, color, bg }) => (
                <button key={path} onClick={() => navigate(path)} className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-white/[0.03] transition-colors">
                  <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center`}>
                    <Icon size={13} className={color} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-200">{label}</p>
                    <p className="text-[10px] text-gray-500">{desc}</p>
                  </div>
                  <ArrowRight size={13} className="text-gray-600" />
                </button>
              ))}
            </div>
          </Card>

          {recentTxns.length > 0 && (
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h3 className="section-title text-white mb-0">Recent</h3>
                <button onClick={() => navigate('/transactions')} className="text-[11px] font-medium text-primary-400 hover:text-primary-300 transition-colors">
                  View all →
                </button>
              </div>
              <div className="space-y-0.5">
                {recentTxns.map((tx, i) => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.25 }}
                    className="flex items-center gap-3 py-2 border-b border-[rgba(255,255,255,0.04)] last:border-0"
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      tx.transaction_type === 'credit' ? 'bg-primary-500/10' : 'bg-red-500/10'
                    }`}>
                      {tx.transaction_type === 'credit'
                        ? <TrendingUp size={13} className="text-primary-400" />
                        : <TrendingDown size={13} className="text-red-400" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-200 truncate">{tx.description}</p>
                      <p className="text-[10px] text-gray-500">{tx.date}</p>
                    </div>
                    <span className={`text-sm font-semibold ${
                      tx.transaction_type === 'credit' ? 'text-primary-400' : 'text-red-400'
                    }`}>
                      {tx.transaction_type === 'credit' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                    </span>
                  </motion.div>
                ))}
              </div>
            </Card>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}
