import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import Card from '../ui/Card'
import type { Transaction } from '../../services/api'

interface MonthlyData { month: string; income: number; expense: number }

export default function IncomeExpenseBarChart({ transactions = [] }: { transactions?: Transaction[] }) {
  const data = buildMonthly(transactions ?? [])
  if (data.length === 0) return null
  return (
    <Card className="p-6">
      <h3 className="text-sm font-semibold text-slate-800 mb-5">Income vs Expense</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} barGap={4}>
          <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}
            formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, undefined]}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} iconType="circle" iconSize={8} />
          <Bar dataKey="income" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={32} />
          <Bar dataKey="expense" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
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
