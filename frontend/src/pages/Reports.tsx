import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { FileText, Download, CheckCircle2, AlertCircle } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { reportApi, type ReportResponse } from '../services/api'
import { SkeletonCard } from '../components/ui/Skeleton'

function formatCurrency(v: number) {
  return `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

export default function Reports() {
  const [report, setReport] = useState<ReportResponse | null>(null)
  const [generating, setGenerating] = useState(false)
  const [reportType, setReportType] = useState<'monthly' | 'yearly' | 'custom'>('monthly')
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    reportApi.list().catch(() => {})
  }, [])

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 4000)
  }

  const generateReport = useCallback(async () => {
    setGenerating(true)
    setReport(null)
    try {
      let res
      if (reportType === 'monthly') {
        res = await reportApi.monthly(selectedMonth, selectedYear)
      } else if (reportType === 'yearly') {
        res = await reportApi.yearly(selectedYear)
      } else {
        if (!startDate || !endDate) { showMsg('error', 'Select date range'); setGenerating(false); return }
        res = await reportApi.custom(startDate, endDate)
      }
      setReport(res.data)
    } catch {
      showMsg('error', 'Failed to generate report')
    } finally {
      setGenerating(false)
    }
  }, [reportType, selectedMonth, selectedYear, startDate, endDate])

  const download = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      const params = reportType === 'monthly' ? { month: selectedMonth, year: selectedYear }
        : reportType === 'yearly' ? { year: selectedYear }
          : {}
      let res
      if (format === 'csv') res = await reportApi.exportCsv(params.month, params.year)
      else if (format === 'excel') res = await reportApi.exportExcel(params.month, params.year)
      else res = await reportApi.exportPdf(params.month, params.year)

      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `spendsense_${format}_${selectedYear}_${selectedMonth}.${format === 'pdf' ? 'pdf' : format === 'excel' ? 'xlsx' : 'csv'}`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      showMsg('error', `Failed to download ${format.toUpperCase()}`)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      <div>
        <h1 className="hero-title text-white mb-2">Reports</h1>
        <p className="text-gray-500 text-lg">Generate financial reports from your data</p>
      </div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-medium ${
            message.type === 'success' ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card hover className="space-y-5">
          <h3 className="section-title text-white">Generate Report</h3>

          <div className="flex gap-2">
            {(['monthly', 'yearly', 'custom'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setReportType(t)}
                className={`flex-1 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  reportType === t
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-glow'
                    : 'bg-white/[0.03] text-gray-400 hover:bg-white/[0.06]'
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {reportType === 'monthly' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
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
                <label className="text-xs font-medium text-gray-500 mb-1 block">Year</label>
                <input
                  type="number"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="input-premium"
                />
              </div>
            </div>
          )}

          {reportType === 'yearly' && (
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Year</label>
              <input
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="input-premium"
              />
            </div>
          )}

          {reportType === 'custom' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input-premium"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="input-premium"
                />
              </div>
            </div>
          )}

          <Button variant="premium" onClick={generateReport} disabled={generating} className="w-full">
            {generating ? 'Generating...' : 'Generate Report'}
          </Button>

          {report && (
            <div className="pt-3 border-t border-[rgba(255,255,255,0.06)]">
              <p className="text-xs font-medium text-gray-500 mb-3">Download</p>
              <div className="flex gap-2">
                <button onClick={() => download('csv')} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white/[0.03] text-gray-400 text-xs font-medium rounded-2xl hover:bg-white/[0.06] transition-colors">
                  <Download size={12} /> CSV
                </button>
                <button onClick={() => download('excel')} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white/[0.03] text-gray-400 text-xs font-medium rounded-2xl hover:bg-white/[0.06] transition-colors">
                  <Download size={12} /> Excel
                </button>
                <button onClick={() => download('pdf')} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white/[0.03] text-gray-400 text-xs font-medium rounded-2xl hover:bg-white/[0.06] transition-colors">
                  <Download size={12} /> PDF
                </button>
              </div>
            </div>
          )}
        </Card>

        <div className="lg:col-span-2 space-y-6">
          {generating ? (
            <div className="space-y-4">
              <SkeletonCard />
            </div>
          ) : report ? (
            <>
              <Card hover>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="section-title text-white mb-0">
                    {report?.report?.summary?.period ?? 'Financial'} Report
                  </h3>
                  <span className="text-[10px] text-gray-500">
                    Generated: {new Date(report?.generated_at ?? new Date()).toLocaleString()}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="bg-white/[0.03] rounded-2xl p-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Income</p>
                    <p className="text-sm font-bold text-primary-400">{formatCurrency(report?.report?.summary?.total_income ?? 0)}</p>
                  </div>
                  <div className="bg-white/[0.03] rounded-2xl p-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Expense</p>
                    <p className="text-sm font-bold text-red-400">{formatCurrency(report?.report?.summary?.total_expense ?? 0)}</p>
                  </div>
                  <div className="bg-white/[0.03] rounded-2xl p-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Net</p>
                    <p className={`text-sm font-bold ${(report?.report?.summary?.net_savings ?? 0) >= 0 ? 'text-primary-400' : 'text-red-400'}`}>
                      {formatCurrency(report?.report?.summary?.net_savings ?? 0)}
                    </p>
                  </div>
                  <div className="bg-white/[0.03] rounded-2xl p-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Savings Rate</p>
                    <p className="text-sm font-bold text-accent-400">{report?.report?.summary?.savings_rate ?? 0}%</p>
                  </div>
                  <div className="bg-white/[0.03] rounded-2xl p-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Txns</p>
                    <p className="text-sm font-bold text-gray-200">{report?.report?.summary?.total_transactions ?? 0}</p>
                  </div>
                  <div className="bg-white/[0.03] rounded-2xl p-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Health</p>
                    <p className="text-sm font-bold text-purple-400">{report?.report?.summary?.health_score ?? 0}/100</p>
                  </div>
                </div>
              </Card>

              <Card hover>
                <h3 className="section-title text-white mb-4">Category Breakdown</h3>
                <div className="space-y-3">
                    {(report?.report?.category_breakdown ?? []).slice(0, 10).map((cat: any) => {
                      const total = report?.report?.summary?.total_expense ?? 0
                      const pct = total > 0 ? ((cat.amount / total) * 100).toFixed(1) : 0
                    return (
                      <div key={cat.category}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-gray-300">{cat.category}</span>
                          <span className="text-gray-500">{formatCurrency(cat.amount)} ({pct}%)</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-600"
                            style={{ width: `${Math.min(Number(pct), 100)}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>

              <Card hover>
                  <h3 className="section-title text-white mb-4">Monthly Breakdown</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-gray-500 border-b border-[rgba(255,255,255,0.06)]">
                          <th className="text-left py-2 font-medium">Month</th>
                          <th className="text-right py-2 font-medium">Income</th>
                          <th className="text-right py-2 font-medium">Expense</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(report?.report?.monthly_breakdown ?? []).map((m: any) => (
                        <tr key={m.month} className="border-b border-[rgba(255,255,255,0.04)]">
                          <td className="py-2 font-medium text-gray-300">{m.month}</td>
                          <td className="py-2 text-right font-semibold text-primary-400">{formatCurrency(m.income)}</td>
                          <td className="py-2 text-right font-semibold text-red-400">{formatCurrency(m.expense)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {(report?.report?.top_recommendations?.length ?? 0) > 0 && (
                <Card hover>
                  <h3 className="section-title text-white mb-3">Recommendations</h3>
                  <ul className="space-y-2">
                      {(report?.report?.top_recommendations ?? []).map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </>
          ) : (
            <Card className="p-12 text-center">
              <div className="w-16 h-16 rounded-3xl bg-white/[0.03] flex items-center justify-center mx-auto mb-4 border border-[rgba(255,255,255,0.06)]">
                <FileText size={28} className="text-gray-500" />
              </div>
              <h3 className="text-base font-semibold text-gray-200 mb-1">No report generated</h3>
              <p className="text-sm text-gray-500">Select a report type and click generate</p>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  )
}
