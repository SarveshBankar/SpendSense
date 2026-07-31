import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import type { Transaction } from '../../services/api'

interface MonthlyData {
  month: string
  expense: number
}

export default function ExpenseLineChart({ transactions = [] }: { transactions?: Transaction[] }) {
  const data = buildMonthlyExpenses(transactions ?? [])
  if (data.length === 0) return null

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-200 mb-4">Monthly Expenses</h3>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data}>
          <defs>
            <linearGradient id="expenseGrad2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.12} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', background: '#16161D', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
            formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Expense']}
            labelStyle={{ color: '#e5e7eb' }}
          />
          <Line
            type="monotone"
            dataKey="expense"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ r: 2.5, fill: '#10b981', strokeWidth: 0 }}
            activeDot={{ r: 4, fill: '#10b981', stroke: '#0F0F14', strokeWidth: 2 }}
            fill="url(#expenseGrad2)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
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
