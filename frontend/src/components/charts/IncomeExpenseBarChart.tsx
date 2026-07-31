import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import type { Transaction } from '../../services/api'

interface MonthlyData { month: string; income: number; expense: number }

export default function IncomeExpenseBarChart({ transactions = [] }: { transactions?: Transaction[] }) {
  const data = buildMonthly(transactions ?? [])
  if (data.length === 0) return null

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-200 mb-4">Income vs Expense</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} barGap={4}>
          <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', background: '#16161D', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
            formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, undefined]}
            labelStyle={{ color: '#e5e7eb' }}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4, color: '#9ca3af' }} iconType="circle" iconSize={8} />
          <Bar dataKey="income" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Bar dataKey="expense" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function buildMonthly(txs: Transaction[]): MonthlyData[] {
  const map: Record<string, { income: number; expense: number }> = {}
  txs.forEach((tx) => {
    const month = tx.date.slice(0, 7)
    if (!map[month]) map[month] = { income: 0, expense: 0 }
    if (tx.transaction_type === 'credit') map[month].income += tx.amount
    else map[month].expense += tx.amount
  })
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({
      month,
      income: Math.round(v.income),
      expense: Math.round(v.expense),
    }))
}
