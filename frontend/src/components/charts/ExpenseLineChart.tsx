import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import Card from '../ui/Card'
import type { Transaction } from '../../services/api'

interface MonthlyData {
  month: string
  expense: number
}

export default function ExpenseLineChart({ transactions = [] }: { transactions?: Transaction[] }) {
  const data = buildMonthlyExpenses(transactions ?? [])
  if (data.length === 0) return null
  return (
    <Card className="p-6">
      <h3 className="text-sm font-semibold text-slate-800 mb-5">Monthly Expenses</h3>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data}>
          <defs>
            <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}
            formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Expense']}
          />
          <Line
            type="monotone"
            dataKey="expense"
            stroke="#10b981"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
            fill="url(#expenseGrad)"
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  )
}

function buildMonthlyExpenses(txs: Transaction[]): MonthlyData[] {
  const map: Record<string, number> = {}
  txs.forEach((tx) => {
    if (tx.transaction_type === 'debit') {
      const month = tx.date.slice(0, 7)
      map[month] = (map[month] || 0) + tx.amount
    }
  })
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, expense]) => ({ month, expense: Math.round(expense) }))
}
