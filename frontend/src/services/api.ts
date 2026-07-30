import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('spendsense_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('spendsense_token')
      localStorage.removeItem('spendsense_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  },
)

export interface RegisterPayload {
  full_name: string
  email: string
  password: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface User {
  id: string
  full_name: string
  email: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  user: User
}

export interface Statement {
  id: string
  original_file_name: string
  stored_file_name: string
  file_type: string
  file_size: number
  status: string
  uploaded_at: string
}

export interface Transaction {
  id: string
  statement_id: string
  date: string
  description: string
  amount: number
  balance: number | null
  transaction_type: string
  merchant: string | null
  payment_mode: string | null
  reference_number: string | null
  raw_text: string | null
  row_index: number
  category: string | null
  confidence_score: number | null
  matched_rule: string | null
  created_at: string
}

export interface ParseResult {
  status: string
  total_rows: number
  successful: number
  failed: number
  errors: string[]
  transactions: Transaction[]
}

export interface CategorizeSummary {
  total_transactions: number
  categorized: number
  uncategorized: number
  category_wise: { category: string; count: number }[]
}

// Auth
export const authApi = {
  register: (data: RegisterPayload) =>
    api.post<TokenResponse>('/auth/register', data),
  login: (data: LoginPayload) =>
    api.post<TokenResponse>('/auth/login', data),
}

// Statements
export const statementApi = {
  list: () => api.get<{ statements: Statement[]; total: number }>('/statements'),
  upload: (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return api.post<{ message: string; statement: Statement; warning?: string }>(
      '/statements/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } }
    )
  },
  parse: (id: string) =>
    api.post<ParseResult>(`/statements/${id}/parse`),
  delete: (id: string) =>
    api.delete<{ message: string }>(`/statements/${id}`),
}

// Insights
export interface InsightCard {
  type: string
  label: string
  value: string
  detail: string
  severity: 'info' | 'success' | 'warning' | 'danger'
}

export interface HealthScore {
  score: number
  savings_rate_score: number
  expense_ratio_score: number
  categorization_score: number
  volume_score: number
  stability_score: number
  breakdown: {
    savings_rate: number
    expense_ratio: number
    categorized_pct: number
    total_transactions: number
  }
}

export interface Recommendation {
  type: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
}

export interface CategoryBreakdown {
  category: string
  amount: number
}

export interface TopMerchant {
  merchant: string
  amount: number
}

export interface Statistics {
  total_transactions: number
  total_income: number
  total_expense: number
  net_savings: number
  savings_rate: number
  expense_ratio: number
  categorized_pct: number
  average_transaction: number
  category_breakdown: CategoryBreakdown[]
  top_merchants: TopMerchant[]
  first_date: string | null
  last_date: string | null
}

export interface InsightsResponse {
  financial_score: HealthScore
  summary: string
  recommendations: Recommendation[]
  insights: InsightCard[]
  statistics: Statistics
}

// Transactions
export const transactionApi = {
  list: (params?: Record<string, any>) =>
    api.get<{ transactions: Transaction[]; total: number }>('/transactions', { params }),
  categorize: () =>
    api.post<CategorizeSummary>('/transactions/categorize'),
}

// Budgets
export interface Budget {
  id: string
  user_id: string
  category: string | null
  monthly_budget: number
  month: number
  year: number
  created_at: string
  current_spent: number
  remaining_budget: number
  utilization_pct: number
  daily_allowance: number
  predicted_end: number
  overspending: boolean
}

export interface BudgetListResponse {
  budgets: Budget[]
  total: number
  total_budgeted: number
  total_spent: number
  total_remaining: number
  overall_utilization: number
}

export interface BudgetCreatePayload {
  category?: string | null
  monthly_budget: number
  month?: number
  year?: number
}

export interface BudgetUpdatePayload {
  category?: string | null
  monthly_budget?: number
  month?: number
  year?: number
}

export const budgetApi = {
  list: (params?: { month?: number; year?: number }) =>
    api.get<BudgetListResponse>('/budgets', { params }),
  create: (data: BudgetCreatePayload) =>
    api.post<Budget>('/budgets', data),
  update: (id: string, data: BudgetUpdatePayload) =>
    api.put<Budget>(`/budgets/${id}`, data),
  delete: (id: string) =>
    api.delete<{ message: string }>(`/budgets/${id}`),
}

// Goals
export interface SavingsGoal {
  id: string
  user_id: string
  goal_name: string
  target_amount: number
  current_amount: number
  target_date: string
  status: string
  created_at: string
  progress_pct: number
  remaining_amount: number
}

export interface GoalListResponse {
  goals: SavingsGoal[]
  total: number
  total_target: number
  total_saved: number
  overall_progress: number
}

export interface GoalCreatePayload {
  goal_name: string
  target_amount: number
  current_amount?: number
  target_date: string
}

export interface GoalUpdatePayload {
  goal_name?: string
  target_amount?: number
  current_amount?: number
  target_date?: string
  status?: string
}

export const goalApi = {
  list: () => api.get<GoalListResponse>('/goals'),
  create: (data: GoalCreatePayload) =>
    api.post<SavingsGoal>('/goals', data),
  update: (id: string, data: GoalUpdatePayload) =>
    api.put<SavingsGoal>(`/goals/${id}`, data),
  delete: (id: string) =>
    api.delete<{ message: string }>(`/goals/${id}`),
}

// Analytics
export interface AnalyticsKPIs {
  total_income: number
  total_expense: number
  net_savings: number
  savings_rate: number
  expense_ratio: number
  total_transactions: number
  avg_daily_expense: number
  avg_monthly_expense: number
  highest_spending_day: string | null
  highest_spending_amount: number
  lowest_spending_day: string | null
  lowest_spending_amount: number
  volatility_score: number
  categorized_pct: number
  first_date: string | null
  last_date: string | null
}

export interface MonthlyTrend {
  month: string
  income: number
  expense: number
  net: number
}

export interface WeeklyTrend {
  week_start: string
  income: number
  expense: number
  net: number
}

export interface DailyTrend {
  date: string
  income: number
  expense: number
  net: number
}

export interface CategoryGrowth {
  category: string
  monthly: { month: string; amount: number }[]
}

export interface MerchantSpending {
  merchant: string
  total: number
  transaction_count: number
  avg_amount: number
  category: string | null
  last_date: string | null
}

export interface SubscriptionInfo {
  merchant: string
  monthly_avg: number
  occurrences: number
  last_date: string | null
  confidence: string
}

export interface IncomeSource {
  description: string
  total: number
  count: number
  last_date: string | null
}

export interface SpendingDistribution {
  range_label: string
  count: number
  total: number
}

export interface CashFlowPoint {
  date: string
  cumulative_income: number
  cumulative_expense: number
  net_position: number
}

export interface Prediction {
  expected_month_end_spending: number
  expected_month_end_savings: number
  budget_risk_level: string
  estimated_health_next_month: number
}

export interface CalendarDay {
  date: string
  amount: number
  transaction_count: number
}

export interface AnalyticsResponse {
  kpis: AnalyticsKPIs
  monthly_trends: MonthlyTrend[]
  weekly_trends: WeeklyTrend[]
  daily_trends: DailyTrend[]
  category_growth: CategoryGrowth[]
  merchant_spending: MerchantSpending[]
  subscriptions: SubscriptionInfo[]
  income_sources: IncomeSource[]
  spending_distribution: SpendingDistribution[]
  cash_flow: CashFlowPoint[]
  predictions: Prediction
  calendar_heatmap: CalendarDay[]
  filters: Record<string, any>
}

export const analyticsApi = {
  get: (params?: Record<string, any>) =>
    api.get<AnalyticsResponse>('/analytics', { params }),
}

// Profile
export interface ProfileResponse {
  id: string
  full_name: string
  email: string
  is_active: boolean
  created_at: string
  updated_at: string
  profile_picture: string | null
  total_transactions: number
  total_statements: number
  total_budgets: number
  total_goals: number
}

export interface ProfileUpdatePayload {
  full_name?: string
  email?: string
}

export interface ChangePasswordPayload {
  current_password: string
  new_password: string
}

export const profileApi = {
  get: () => api.get<ProfileResponse>('/profile'),
  update: (data: ProfileUpdatePayload) =>
    api.put<{ message: string; user: ProfileResponse }>('/profile', data),
  changePassword: (data: ChangePasswordPayload) =>
    api.put<{ message: string }>('/profile/password', data),
}

// Settings
export interface SettingsResponse {
  currency: string
  language: string
  theme: string
  date_format: string
  email_notifications: boolean
  push_notifications: boolean
  weekly_report: boolean
}

export interface SettingsUpdatePayload {
  currency?: string
  language?: string
  theme?: string
  date_format?: string
  email_notifications?: boolean
  push_notifications?: boolean
  weekly_report?: boolean
}

export const settingsApi = {
  get: () => api.get<SettingsResponse>('/settings'),
  update: (data: SettingsUpdatePayload) =>
    api.put<{ message: string; settings: SettingsResponse }>('/settings', data),
}

// Reports
export interface ReportSummary {
  period: string
  total_income: number
  total_expense: number
  net_savings: number
  savings_rate: number
  expense_ratio: number
  total_transactions: number
  categorized_pct: number
  avg_daily_expense: number
  highest_category: string | null
  highest_category_amount: number
  top_merchant: string | null
  top_merchant_amount: number
  health_score: number | null
}

export interface ReportData {
  summary: ReportSummary
  monthly_breakdown: Record<string, any>[]
  category_breakdown: Record<string, any>[]
  merchant_breakdown: Record<string, any>[]
  daily_trends: Record<string, any>[]
  top_recommendations: string[]
}

export interface ReportResponse {
  report: ReportData
  generated_at: string
}

export interface ReportListResponse {
  available_months: string[]
  available_years: number[]
}

export const reportApi = {
  list: () => api.get<ReportListResponse>('/reports/list'),
  monthly: (month: number, year: number) =>
    api.get<ReportResponse>('/reports/monthly', { params: { month, year } }),
  yearly: (year: number) =>
    api.get<ReportResponse>('/reports/yearly', { params: { year } }),
  custom: (start_date: string, end_date: string) =>
    api.get<ReportResponse>('/reports/custom', { params: { start_date, end_date } }),
  exportCsv: (month?: number, year?: number) =>
    api.get('/reports/export/csv', { params: { month, year }, responseType: 'blob' }),
  exportExcel: (month?: number, year?: number) =>
    api.get('/reports/export/excel', { params: { month, year }, responseType: 'blob' }),
  exportPdf: (month?: number, year?: number) =>
    api.get('/reports/export/pdf', { params: { month, year }, responseType: 'blob' }),
}

// Insights
export const insightApi = {
  get: () => api.get<InsightsResponse>('/insights'),
}

export default api
