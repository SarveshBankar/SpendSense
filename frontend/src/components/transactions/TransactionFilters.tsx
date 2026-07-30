import { Search } from 'lucide-react'

export interface FiltersState {
  search: string
  type: string
  category: string
  from: string
  to: string
  sort_by: string
  sort_order: 'asc' | 'desc'
}

interface Props {
  filters: FiltersState
  onChange: (f: FiltersState) => void
  categories: string[]
}

export default function TransactionFilters({ filters, onChange, categories = [] }: Props) {
  const cats = categories ?? []
  const update = (patch: Partial<FiltersState>) => onChange({ ...filters, ...patch })

  return (
    <div className="card-premium p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            className="input-premium !pl-10"
          />
        </div>

        <select
          value={filters.type}
          onChange={(e) => update({ type: e.target.value })}
          className="input-premium !w-auto"
        >
          <option value="">All Types</option>
          <option value="credit">Credit</option>
          <option value="debit">Debit</option>
        </select>

        <select
          value={filters.category}
          onChange={(e) => update({ category: e.target.value })}
          className="input-premium !w-auto"
        >
          <option value="">All Categories</option>
          {cats.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <input
          type="date"
          value={filters.from}
          onChange={(e) => update({ from: e.target.value })}
          className="input-premium !w-auto"
        />

        <input
          type="date"
          value={filters.to}
          onChange={(e) => update({ to: e.target.value })}
          className="input-premium !w-auto"
        />

        <select
          value={`${filters.sort_by}-${filters.sort_order}`}
          onChange={(e) => {
            const [sort_by, sort_order] = e.target.value.split('-') as [string, 'asc' | 'desc']
            update({ sort_by, sort_order })
          }}
          className="input-premium !w-auto"
        >
          <option value="date-desc">Newest First</option>
          <option value="date-asc">Oldest First</option>
          <option value="amount-desc">Highest Amount</option>
          <option value="amount-asc">Lowest Amount</option>
        </select>
      </div>
    </div>
  )
}
