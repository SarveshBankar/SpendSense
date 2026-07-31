import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, CheckCheck, AlertTriangle, Info,
  AlertCircle, Loader2,
} from 'lucide-react'
import Card from '../components/ui/Card'
import { notificationApi, type Notification } from '../services/api'

const severityConfig = {
  high: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/15' },
  medium: { icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/15' },
  low: { icon: Info, color: 'text-accent-400', bg: 'bg-accent-500/10', border: 'border-accent-500/15' },
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetch = () => {
    setLoading(true)
    notificationApi.list({ limit: 100 })
      .then((res) => {
        setNotifications(res.data.notifications)
        setUnreadCount(res.data.unread_count)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetch() }, [])

  const markRead = async (id: string) => {
    try {
      await notificationApi.markRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch {}
  }

  const markAllRead = async () => {
    try {
      await notificationApi.markAllRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch {}
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary-500/10 flex items-center justify-center border border-primary-500/15">
            <Loader2 size={20} className="text-primary-400 animate-spin" />
          </div>
          <p className="text-sm text-gray-500">Loading notifications...</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-accent-500/10 flex items-center justify-center border border-accent-500/15">
            <Bell size={15} className="text-accent-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Notifications</h1>
            <p className="text-xs text-gray-500">
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                : 'All caught up'}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn-outline !px-3 !py-1.5 !text-xs">
            <CheckCheck size={12} />
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card className="text-center py-16">
          <div className="w-16 h-16 rounded-3xl bg-white/[0.03] flex items-center justify-center mx-auto mb-4 border border-[rgba(255,255,255,0.06)]">
            <Bell size={28} className="text-gray-500" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">No notifications yet</h3>
          <p className="text-sm text-gray-500">
            Notifications about budgets, anomalies, and health scores will appear here.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {notifications.map((n, i) => {
              const cfg = severityConfig[n.severity as keyof typeof severityConfig] || severityConfig.low
              const Icon = cfg.icon
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => !n.read && markRead(n.id)}
                  className={`card-premium p-4 cursor-pointer transition-all ${
                    !n.read ? 'border-primary-500/20 bg-primary-500/[0.02]' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-2xl ${cfg.bg} border ${cfg.border} flex items-center justify-center shrink-0`}>
                      <Icon size={16} className={cfg.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className={`text-sm font-semibold ${!n.read ? 'text-white' : 'text-gray-400'}`}>
                          {n.title}
                        </p>
                        {!n.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">{n.message}</p>
                      <p className="text-[10px] text-gray-600 mt-1">
                        {new Date(n.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  )
}
