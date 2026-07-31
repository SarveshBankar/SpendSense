import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp, TrendingDown, DollarSign,
  Calendar, Download, CheckCircle2,
  BarChart3, Clock, Activity, Award,
  RefreshCw, AlertCircle,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar,
  PieChart, Pie, Cell, Legend,
  Line, ComposedChart,
} from 'recharts'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import {
  analyticsApi,
  type AnalyticsResponse,
  type MerchantSpending,
  type MonthlyTrend,
  type SubscriptionInfo,
  type CalendarDay,
} from '../services/api'
import { SkeletonCard, SkeletonChart } from '../components/ui/Skeleton'

const COLORS = [
  '#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#ec4899', '#14b8a6', '#84cc16',
  '#0ea5e9', '#a855f7',
]

function formatCurrency(v: number) {
  return `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

function kpiLabel(v: number) {
  return v.toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

interface StatCardProps {
  label: string
  value: string
  icon?: React.ReactNode
  color?: string
  trend?: number
}

function StatCard({ label, value, icon, color = 'from-primary-500 to-primary-600', trend }: StatCardProps) {
  return (
    <Card hover className="relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br ${color} opacity-5 blur-3xl -translate-y-1/2 translate-x-1/2`} />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
          <div className={`w-9 h-9 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center`}>
            {icon}
          </div>
        </div>
        <p className="text-xl font-bold text-white">{value}</p>
        {trend != null && (
          <div className={`flex items-center gap-1 mt-1.5 text-xs font-medium ${trend >= 0 ? 'text-primary-400' : 'text-red-400'}`}>
            {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
    </Card>
  )
}

function CustomTooltip({ active, payload, label, formatter }: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
  formatter: (v: number) => string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-900/95 border border-white/10 rounded-xl px-4 py-3 shadow-2xl backdrop-blur-sm">
      <p className="text-xs font-medium text-gray-400 mb-1.5">{label}</p>
      {payload.map((p, i: number) => (
        <div key={i} className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-gray-500">{p.name}: </span>
          <span className="font-semibold text-gray-200">
            {formatter ? formatter(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

function CalendarHeatmap({ data }: { data?: CalendarDay[] }) {
  const safe = data ?? []
  const dayMap = useMemo(() => {
    const m: Record<string, CalendarDay> = {}
    safe.forEach((d) => { if (d?.date) m[d.date] = d })
    return m
  }, [safe])

  const cells = useMemo(() => {
    if (!safe.length) return []
    const dates = safe.map((d) => d.date).sort()
    const start = new Date(dates[0])
    const end = new Date(dates[dates.length - 1])
    const result: { date: string; amount: number; count: number }[] = []
    const current = new Date(start)
    while (current <= end) {
      const key = current.toISOString().slice(0, 10)
      const day = dayMap[key]
      result.push({ date: key, amount: day?.amount ?? 0, count: day?.transaction_count ?? 0 })
      current.setDate(current.getDate() + 1)
    }
    return result
  }, [data, dayMap])

  const maxAmount = Math.max(...cells.map((c) => c.amount), 1)

  if (!cells.length) return null

  const weeks: typeof cells[] = []
  let week: typeof cells = []
  cells.forEach((c) => {
    const dow = new Date(c.date).getDay()
    if (dow === 0 && week.length > 0) { weeks.push(week); week = [] }
    week.push(c)
  })
  if (week.length > 0) weeks.push(week)

  return (
    <Card hover>
      <h3 className="section-title text-white mb-4">Spending Heatmap</h3>
      <div className="overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="w-3 text-center text-[8px] font-medium text-gray-500 mb-1">{d[0]}</div>
          ))}
          <div className="w-2" />
          {weeks.slice(0, 20).map((wk, wi) => (
            <div key={wi} className="flex flex-col gap-0.5">
              {wk.map((c) => {
                const intensity = c.amount > 0 ? Math.min(c.amount / maxAmount, 1) : 0
                const bg = c.amount === 0
                  ? 'bg-white/[0.03]'
                  : intensity > 0.75
                    ? 'bg-primary-600'
                    : intensity > 0.5
                      ? 'bg-primary-500'
                      : intensity > 0.25
                        ? 'bg-primary-300'
                        : 'bg-primary-100'
                return (
                  <div
                    key={c.date}
                    className={`w-3 h-3 rounded-sm ${bg} cursor-pointer`}
                    title={`${c.date}: ₹${c.amount.toLocaleString('en-IN')} (${c.count} txns)`}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3 text-[10px] text-gray-500">
        <span>Less</span>
        <div className="w-3 h-3 rounded-sm bg-white/[0.03]" />
        <div className="w-3 h-3 rounded-sm bg-primary-100" />
        <div className="w-3 h-3 rounded-sm bg-primary-300" />
        <div className="w-3 h-3 rounded-sm bg-primary-500" />
        <div className="w-3 h-3 rounded-sm bg-primary-600" />
        <span>More</span>
      </div>
    </Card>
  )
}

function MerchantTable({ data }: { data?: MerchantSpending[] }) {
  const items = data ?? []
  const [sortKey, setSortKey] = useState<'total' | 'count' | 'avg'>('total')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const sorted = useMemo(() => {
    const arr = [...items]
    arr.sort((a, b) => {
      const mul = sortDir === 'desc' ? -1 : 1
      if (sortKey === 'total') return (a.total - b.total) * mul
      if (sortKey === 'count') return (a.transaction_count - b.transaction_count) * mul
      return (a.avg_amount - b.avg_amount) * mul
    })
    return arr.slice(0, 20)
  }, [items, sortKey, sortDir])

  const toggleSort = (k: typeof sortKey) => {
    if (sortKey === k) setSortDir(sortDir === 'desc' ? 'asc' : 'desc')
    else { setSortKey(k); setSortDir('desc') }
  }

  if (!items.length) return null
  return (
    <Card hover>
      <h3 className="section-title text-white mb-4">Merchant Spending</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-500 border-b border-[rgba(255,255,255,0.06)]">
              <th className="text-left py-2 pr-3 font-medium">Merchant</th>
              <th className="text-right py-2 px-3 font-medium cursor-pointer" onClick={() => toggleSort('total')}>
                Total {sortKey === 'total' && (sortDir === 'desc' ? '↓' : '↑')}
              </th>
              <th className="text-right py-2 px-3 font-medium cursor-pointer" onClick={() => toggleSort('count')}>
                Txns {sortKey === 'count' && (sortDir === 'desc' ? '↓' : '↑')}
              </th>
              <th className="text-right py-2 px-3 font-medium cursor-pointer" onClick={() => toggleSort('avg')}>
                Avg {sortKey === 'avg' && (sortDir === 'desc' ? '↓' : '↑')}
              </th>
              <th className="text-right py-2 pl-3 font-medium">Category</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((m, i) => (
              <tr key={m.merchant} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02] transition-colors">
                <td className="py-2.5 pr-3 font-medium text-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    {m.merchant}
                  </div>
                </td>
                <td className="py-2.5 px-3 text-right font-semibold text-gray-200">{formatCurrency(m.total)}</td>
                <td className="py-2.5 px-3 text-right text-gray-400">{m.transaction_count}</td>
                <td className="py-2.5 px-3 text-right text-gray-400">{formatCurrency(m.avg_amount)}</td>
                <td className="py-2.5 pl-3 text-right">
                  <Badge variant="neutral">{m.category || '—'}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function SubscriptionList({ data }: { data?: SubscriptionInfo[] }) {
  const items = data ?? []
  if (!items.length) return null
  return (
    <Card hover>
      <div className="flex items-center gap-2 mb-4">
        <Activity size={15} className="text-purple-400" />
        <h3 className="section-title text-white mb-0">Detected Subscriptions</h3>
        <Badge variant="info" className="ml-auto">{items.length} found</Badge>
      </div>
      <div className="space-y-3">
        {items.slice(0, 8).map((s) => (
          <div key={s.merchant} className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.04)] last:border-0">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-200 truncate">{s.merchant}</p>
              <p className="text-xs text-gray-500">{s.occurrences} occurrences · Last: {s.last_date || '—'}</p>
            </div>
            <div className="text-right ml-3">
              <p className="text-sm font-bold text-gray-200">{formatCurrency(s.monthly_avg)}<span className="text-[10px] font-normal text-gray-500">/mo</span></p>
              <Badge variant={s.confidence === 'high' ? 'success' : s.confidence === 'medium' ? 'warning' : 'neutral'}>
                {s.confidence}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function PredictionsPanel({ data }: { data: AnalyticsResponse['predictions'] }) {
  return (
    <Card hover glow="primary">
      <h3 className="section-title text-white mb-4">Predictions</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/[0.03] rounded-2xl p-3">
          <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Month-End Spend</p>
          <p className="text-lg font-bold text-white mt-0.5">{formatCurrency(data.expected_month_end_spending)}</p>
        </div>
        <div className="bg-white/[0.03] rounded-2xl p-3">
          <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Month-End Savings</p>
          <p className={`text-lg font-bold mt-0.5 ${data.expected_month_end_savings >= 0 ? 'text-primary-400' : 'text-red-400'}`}>
            {formatCurrency(data.expected_month_end_savings)}
          </p>
        </div>
        <div className="bg-white/[0.03] rounded-2xl p-3">
          <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Budget Risk</p>
          <Badge variant={data.budget_risk_level === 'Low' ? 'success' : data.budget_risk_level === 'Medium' ? 'warning' : 'danger'}>
            {data.budget_risk_level}
          </Badge>
        </div>
        <div className="bg-white/[0.03] rounded-2xl p-3">
          <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Health Next Month</p>
          <p className="text-lg font-bold text-accent-400 mt-0.5">{data.estimated_health_next_month}/100</p>
        </div>
      </div>
    </Card>
  )
}

export default function Analytics() {
  const [data, setData] = useState<AnalyticsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [month, setMonth] = useState<number | ''>('')
  const [year, setYear] = useState<number | ''>('')
  const [category, setCategory] = useState('')
  const [merchant, setMerchant] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [merchants, setMerchants] = useState<string[]>([])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const params: Record<string, number | string> = {}
      if (month) params.month = month
      if (year) params.year = year
      if (category) params.category = category
      if (merchant) params.merchant = merchant
      const res = await analyticsApi.get(params)
      const d = res?.data ?? null
      setData(d)
      const cats = new Set<string>()
      const mers = new Set<string>()
      ;(d?.merchant_spending ?? []).forEach((m: MerchantSpending) => {
        if (m?.category) cats.add(m.category)
        if (m?.merchant) mers.add(m.merchant)
      })
      setCategories(Array.from(cats).sort())
      setMerchants(Array.from(mers).sort())
    } catch {
      setFetchError('Failed to load analytics data')
    }
    finally { setLoading(false) }
  }, [month, year, category, merchant])

  useEffect(() => { fetchData() }, [fetchData])

  const exportCSV = () => {
    if (!data) return
    const rows = [['Metric', 'Value']]
    if (data.kpis) Object.entries(data.kpis).forEach(([key, val]) => rows.push([key, String(val)]))
    rows.push([], ['Monthly Trends'], ['Month', 'Income', 'Expense', 'Net'])
    ;(data.monthly_trends ?? []).forEach((t: MonthlyTrend) => rows.push([t.month, String(t.income), String(t.expense), String(t.net)]))
    rows.push([], ['Merchant Spending'], ['Merchant', 'Total', 'Transactions', 'Avg Amount', 'Category'])
    ;(data.merchant_spending ?? []).forEach((m: MerchantSpending) => rows.push([m.merchant, String(m.total), String(m.transaction_count), String(m.avg_amount), m.category || '']))
    rows.push([], ['Subscriptions'], ['Merchant', 'Monthly Avg', 'Occurrences', 'Confidence'])
    ;(data.subscriptions ?? []).forEach((s: SubscriptionInfo) => rows.push([s.merchant, String(s.monthly_avg), String(s.occurrences), s.confidence]))

    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `spendsense_analytics_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const fmtCurrency = formatCurrency

  const monthlyChartData = data?.monthly_trends ?? []
  const cashFlowData = data?.cash_flow ?? []
  const distData = data?.spending_distribution ?? []
  const weeklyData = data?.weekly_trends ?? []
  const dailyData = data?.daily_trends ?? []
  const catGrowthData = (data?.category_growth ?? []).map((cg) => ({
    category: cg?.category ?? '',
    monthly: cg?.monthly ?? [],
  }))
  const kpis = data?.kpis
  const subs = data?.subscriptions ?? []
  const merchantsData = data?.merchant_spending ?? []
  const predictions = data?.predictions ?? null

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
          <AlertCircle size={28} className="text-red-400" />
        </div>
        <p className="text-gray-400 text-sm max-w-xs">{fetchError}</p>
        <button onClick={fetchData} className="btn-premium !px-5 !py-2.5 !text-xs">
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="hero-title text-white mb-2">Analytics</h1>
          <p className="text-gray-500 text-lg">Deep dive into your financial data</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="btn-ghost-premium">
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      <Card hover>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Calendar size={14} className="text-gray-500" />
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value ? Number(e.target.value) : '')}
              className="input-premium !w-auto"
            >
              <option value="">All Months</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          <input
            type="number"
            placeholder="Year"
            value={year}
            onChange={(e) => setYear(e.target.value ? Number(e.target.value) : '')}
            className="input-premium !w-20"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input-premium !w-auto"
          >
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            className="input-premium !w-auto"
          >
            <option value="">All Merchants</option>
            {merchants.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </Card>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <SkeletonCard key={i} />)}
          </div>
          <SkeletonChart height={300} />
          <SkeletonChart height={300} />
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <StatCard label="Total Income" value={formatCurrency(kpis?.total_income ?? 0)} icon={<TrendingUp size={16} className="text-primary-400" />} color="from-primary-500 to-primary-600" />
            <StatCard label="Total Expense" value={formatCurrency(kpis?.total_expense ?? 0)} icon={<TrendingDown size={16} className="text-red-400" />} color="from-red-500 to-red-600" />
            <StatCard label="Net Savings" value={formatCurrency(kpis?.net_savings ?? 0)} icon={<DollarSign size={16} className="text-primary-400" />} color="from-primary-500 to-primary-600" trend={kpis?.savings_rate ?? 0} />
            <StatCard label="Avg Daily Expense" value={formatCurrency(kpis?.avg_daily_expense ?? 0)} icon={<Clock size={16} className="text-accent-400" />} color="from-accent-500 to-accent-600" />
            <StatCard label="Volatility" value={`${kpis?.volatility_score ?? 0}%`} icon={<Activity size={16} className="text-purple-400" />} color="from-purple-500 to-purple-600" />
            <StatCard label="Transactions" value={kpiLabel(kpis?.total_transactions ?? 0)} icon={<BarChart3 size={16} className="text-amber-400" />} color="from-amber-500 to-amber-600" />
            <StatCard label="Savings Rate" value={`${kpis?.savings_rate ?? 0}%`} icon={<Award size={16} className="text-primary-400" />} color="from-primary-500 to-primary-600" />
            <StatCard label="Categorized" value={`${kpis?.categorized_pct ?? 0}%`} icon={<CheckCircle2 size={16} className="text-cyan-400" />} color="from-cyan-500 to-cyan-600" />
            <StatCard label="Highest Day" value={kpis?.highest_spending_day ? `${formatCurrency(kpis?.highest_spending_amount ?? 0)}` : '—'} icon={<TrendingUp size={16} className="text-red-400" />} color="from-red-500 to-red-600" />
            <StatCard label="Lowest Day" value={kpis?.lowest_spending_day ? `${formatCurrency(kpis?.lowest_spending_amount ?? 0)}` : '—'} icon={<TrendingDown size={16} className="text-primary-400" />} color="from-primary-500 to-primary-600" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              {predictions && <PredictionsPanel data={predictions} />}
            </div>
            <div className="lg:col-span-2">
              <SubscriptionList data={subs} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card hover className="lg:col-span-2">
              <h3 className="section-title text-white mb-5">Monthly Income vs Expense</h3>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={monthlyChartData}>
                  <defs>
                    <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip formatter={fmtCurrency} />} />
                  <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                  <Line type="monotone" dataKey="net" name="Net" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </Card>

            <Card hover>
              <h3 className="section-title text-white mb-5">Spending Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={distData}
                    dataKey="total"
                    nameKey="range_label"
                    cx="50%" cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {distData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend formatter={(value) => <span className="text-xs text-gray-400">{value}</span>} />
                  <Tooltip content={<CustomTooltip formatter={fmtCurrency} />} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card hover>
              <h3 className="section-title text-white mb-5">Category Spending Growth</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={catGrowthData.map((cg) => ({
                  category: cg.category,
                  amount: cg.monthly.length > 0 ? cg.monthly[cg.monthly.length - 1].amount : 0,
                }))}>
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="category" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip formatter={fmtCurrency} />} />
                  <Bar dataKey="amount" name="Spent" radius={[4, 4, 0, 0]}>
                    {catGrowthData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card hover>
              <h3 className="section-title text-white mb-5">Cash Flow</h3>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={cashFlowData}>
                  <defs>
                    <linearGradient id="cfIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="cfExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="cfNet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip formatter={fmtCurrency} />} />
                  <Area type="monotone" dataKey="cumulative_income" name="Income" stroke="#10b981" strokeWidth={2} fill="url(#cfIncome)" />
                  <Area type="monotone" dataKey="cumulative_expense" name="Expense" stroke="#ef4444" strokeWidth={2} fill="url(#cfExpense)" />
                  <Area type="monotone" dataKey="net_position" name="Net Position" stroke="#6366f1" strokeWidth={2} fill="url(#cfNet)" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <Card hover>
            <h3 className="section-title text-white mb-5">Weekly Spending Trends</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="week_start" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip formatter={fmtCurrency} />} />
                <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={12} />
                <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <CalendarHeatmap data={data?.calendar_heatmap} />
          <MerchantTable data={merchantsData} />

          <Card hover>
            <h3 className="section-title text-white mb-5">Daily Spending</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="dailyExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip formatter={fmtCurrency} />} />
                <Area type="monotone" dataKey="expense" name="Expense" stroke="#f59e0b" strokeWidth={2} fill="url(#dailyExp)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </>
      ) : (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 rounded-3xl bg-white/[0.03] flex items-center justify-center mx-auto mb-4 border border-[rgba(255,255,255,0.06)]">
            <BarChart3 size={28} className="text-gray-500" />
          </div>
          <h3 className="text-base font-semibold text-gray-200 mb-1">No data available</h3>
          <p className="text-sm text-gray-500">Upload statements and transactions first</p>
        </Card>
      )}
    </motion.div>
  )
}
