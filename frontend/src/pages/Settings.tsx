import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Sun, Moon, DollarSign, Globe, Calendar,
  Bell, Mail, CheckCircle2, AlertCircle,
  Smartphone, RefreshCw,
} from 'lucide-react'
import Card from '../components/ui/Card'
import { settingsApi, type SettingsResponse } from '../services/api'
import { SkeletonCard } from '../components/ui/Skeleton'

const currencies = [
  { code: 'INR', label: '₹ INR', symbol: '₹' },
  { code: 'USD', label: '$ USD', symbol: '$' },
  { code: 'EUR', label: '€ EUR', symbol: '€' },
  { code: 'GBP', label: '£ GBP', symbol: '£' },
  { code: 'JPY', label: '¥ JPY', symbol: '¥' },
]

const languages = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
]

const dateFormats = [
  { value: 'YYYY-MM-DD', label: '2026-07-30' },
  { value: 'DD/MM/YYYY', label: '30/07/2026' },
  { value: 'MM/DD/YYYY', label: '07/30/2026' },
  { value: 'DD MMM YYYY', label: '30 Jul 2026' },
]

export default function Settings() {
  const [settings, setSettings] = useState<SettingsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchSettings = () => {
    setLoading(true)
    setFetchError(null)
    settingsApi.get()
      .then((res) => setSettings(res.data))
      .catch(() => setFetchError('Failed to load settings'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchSettings() }, [])

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  const update = async (key: string, value: any) => {
    try {
      const res = await settingsApi.update({ [key]: value })
      setSettings(res.data.settings)
      showMsg('success', `${key.replace(/_/g, ' ')} updated`)
    } catch {
      showMsg('error', 'Failed to update')
    }
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
          <AlertCircle size={28} className="text-red-400" />
        </div>
        <p className="text-gray-400 text-sm max-w-xs">{fetchError}</p>
        <button onClick={fetchSettings} className="btn-premium !px-5 !py-2.5 !text-xs">
          <RefreshCw size={14} />
          Retry
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-white/5 rounded-2xl shimmer-overlay" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    )
  }

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${value ? 'bg-primary-500' : 'bg-white/10'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${value ? 'translate-x-5' : ''}`} />
    </button>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      <div>
        <h1 className="hero-title text-white mb-2">Settings</h1>
        <p className="text-gray-500 text-lg">Customize your experience</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card hover>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 flex items-center justify-center">
              <Sun size={16} className="text-amber-400" />
            </div>
            <h3 className="section-title text-white mb-0">Theme</h3>
          </div>
          <div className="flex gap-3">
            {['light', 'dark'].map((t) => (
              <button
                key={t}
                onClick={() => update('theme', t)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                  settings?.theme === t
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-glow'
                    : 'bg-white/[0.03] text-gray-400 hover:bg-white/[0.06]'
                }`}
              >
                {t === 'light' ? <Sun size={15} /> : <Moon size={15} />}
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </Card>

        <Card hover>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-2xl bg-primary-500/10 flex items-center justify-center">
              <DollarSign size={16} className="text-primary-400" />
            </div>
            <h3 className="section-title text-white mb-0">Currency</h3>
          </div>
          <select
            value={settings?.currency}
            onChange={(e) => update('currency', e.target.value)}
            className="input-premium"
          >
            {currencies.map((c) => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
        </Card>

        <Card hover>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-2xl bg-accent-500/10 flex items-center justify-center">
              <Globe size={16} className="text-accent-400" />
            </div>
            <h3 className="section-title text-white mb-0">Language</h3>
          </div>
          <select
            value={settings?.language}
            onChange={(e) => update('language', e.target.value)}
            className="input-premium"
          >
            {languages.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </Card>

        <Card hover>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-2xl bg-cyan-500/10 flex items-center justify-center">
              <Calendar size={16} className="text-cyan-400" />
            </div>
            <h3 className="section-title text-white mb-0">Date Format</h3>
          </div>
          <select
            value={settings?.date_format}
            onChange={(e) => update('date_format', e.target.value)}
            className="input-premium"
          >
            {dateFormats.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </Card>

        <Card hover className="lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-2xl bg-purple-500/10 flex items-center justify-center">
              <Bell size={16} className="text-purple-400" />
            </div>
            <h3 className="section-title text-white mb-0">Notifications</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Mail size={15} className="text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-300">Email Notifications</p>
                  <p className="text-xs text-gray-500">Receive updates via email</p>
                </div>
              </div>
              <Toggle value={settings?.email_notifications ?? true} onChange={(v) => update('email_notifications', v)} />
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Smartphone size={15} className="text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-300">Push Notifications</p>
                  <p className="text-xs text-gray-500">Receive push notifications</p>
                </div>
              </div>
              <Toggle value={settings?.push_notifications ?? true} onChange={(v) => update('push_notifications', v)} />
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Bell size={15} className="text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-300">Weekly Report</p>
                  <p className="text-xs text-gray-500">Get weekly spending report</p>
                </div>
              </div>
              <Toggle value={settings?.weekly_report ?? false} onChange={(v) => update('weekly_report', v)} />
            </div>
          </div>
        </Card>
      </div>
    </motion.div>
  )
}
