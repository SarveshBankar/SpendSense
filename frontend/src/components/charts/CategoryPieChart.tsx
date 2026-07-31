import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { Transaction } from '../../services/api'

const COLORS = [
  '#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16',
  '#64748b', '#a855f7',
]

interface CatData { name: string; value: number }

export default function CategoryPieChart({ transactions = [] }: { transactions?: Transaction[] }) {
  const data = buildCategoryData(transactions ?? [])
  if (data.length === 0) return null

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-200 mb-4">Expense by Category</h3>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={54}
            outerRadius={84}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', background: '#16161D', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
            formatter={(v: number, n: string) => [`₹${v.toLocaleString('en-IN')}`, n]}
            labelStyle={{ color: '#e5e7eb' }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 8, color: '#9ca3af' }}
            iconType="circle"
            iconSize={8}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

function buildCategoryData(txs: Transaction[]): CatData[] {
  const map: Record<string, number> = {}
  txs.forEach((tx) => {
    if (tx.transaction_type === 'debit') {
      const cat = tx.category || 'Others'
      map[cat] = (map[cat] || 0) + tx.amount
    }
  })
  return Object.entries(map)
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value)
}
