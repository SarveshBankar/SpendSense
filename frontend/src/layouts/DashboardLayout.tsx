import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Home, List, Upload, User, LogOut,
  Menu, ChevronDown, Search, Bell, Sparkles,
  ChevronLeft, Target, BarChart3, FileText, Settings,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Background from '../components/ui/Background'
import { notificationApi } from '../services/api'

const navItems = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/transactions', label: 'Transactions', icon: List },
  { to: '/statements', label: 'Statements', icon: Upload },
  { to: '/budgets', label: 'Budgets', icon: Target },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/reports', label: 'Reports', icon: FileText },
  { to: '/copilot', label: 'Copilot', icon: Sparkles },
]

const bottomItems = [
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/settings', label: 'Settings', icon: Settings },
]

function SidebarItem({ to, label, icon: Icon, collapsed, onClick }: {
  to: string
  label: string
  icon: any
  collapsed: boolean
  onClick?: () => void
}) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      onClick={onClick}
      className={({ isActive }) =>
        `relative flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-300 ${
          collapsed ? 'justify-center px-0 w-12 mx-auto' : ''
        } ${
          isActive
            ? 'text-primary-400 bg-primary-500/[0.08] shadow-[0_0_0_1px_rgba(16,185,129,0.15)]'
            : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <div className="relative">
            <Icon size={collapsed ? 20 : 18} className="shrink-0" />
            {isActive && !collapsed && (
              <motion.div
                layoutId="active-nav"
                className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full bg-primary-500 shadow-glow-sm"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
          </div>
          {!collapsed && <span>{label}</span>}
          {isActive && collapsed && (
            <motion.div
              layoutId="active-nav-collapsed"
              className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full bg-primary-500 shadow-glow-sm"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}
          {collapsed && (
            <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-[#1A1A1E] text-gray-200 text-xs rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 border border-[rgba(255,255,255,0.06)] shadow-glass-lg">
              {label}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    let active = true
    notificationApi
      .list({ limit: 1 })
      .then((res) => {
        if (active) setUnreadCount(res.data.unread_count)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [location.pathname])

  const handleLogout = () => {
    setProfileOpen(false)
    logout()
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-surface">
      <Background />

      {mobileOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* ── Floating Sidebar ── */}
      <aside
        className={`fixed top-4 bottom-4 left-4 z-50 rounded-3xl bg-[#111113]/90 backdrop-blur-2xl border border-[rgba(255,255,255,0.06)] shadow-glass-xl transition-all duration-500 hidden lg:flex flex-col ${
          collapsed ? 'w-[68px]' : 'w-56'
        }`}
      >
        {/* Logo */}
        <div className={`flex items-center h-16 px-4 border-b border-[rgba(255,255,255,0.04)] ${collapsed ? 'justify-center px-0' : 'justify-between'}`}>
          {collapsed ? (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-glow-sm">
              <LayoutDashboard size={15} className="text-white" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-glow-sm">
                  <LayoutDashboard size={15} className="text-white" />
                </div>
                <span className="font-bold text-base text-white tracking-tight">SpendSense</span>
              </div>
              <button onClick={() => setCollapsed(!collapsed)} className="p-1 rounded-lg hover:bg-white/[0.04] text-gray-500 hover:text-gray-300 transition-colors">
                <ChevronLeft size={15} />
              </button>
            </>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
          {navItems.map((item) => (
            <SidebarItem key={item.to} {...item} collapsed={collapsed} />
          ))}
          <div className="my-2 border-t border-[rgba(255,255,255,0.04)]" />
          {bottomItems.map((item) => (
            <SidebarItem key={item.to} {...item} collapsed={collapsed} />
          ))}
        </nav>

        {/* Profile */}
        <div className={`border-t border-[rgba(255,255,255,0.04)] p-3 ${collapsed ? 'text-center' : ''}`}>
          {collapsed ? (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white text-xs font-bold shadow-lg mx-auto">
              {user?.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
          ) : (
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white text-xs font-bold shadow-lg shrink-0">
                {user?.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-200 truncate">{user?.full_name || 'User'}</p>
                <p className="text-xs text-gray-500 truncate">Free Plan</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ── Mobile Header ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 z-30 glass border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between px-4">
        <button className="p-2 rounded-xl hover:bg-white/[0.04] text-gray-400" onClick={() => setMobileOpen(true)}>
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
            <LayoutDashboard size={13} className="text-white" />
          </div>
          <span className="font-bold text-sm text-white">SpendSense</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white text-[10px] font-bold">
          {user?.full_name?.charAt(0).toUpperCase() || 'U'}
        </div>
      </div>

      {/* ── Mobile Sidebar ── */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-[#111113]/95 backdrop-blur-2xl border-r border-[rgba(255,255,255,0.06)] transition-transform duration-400 lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-[rgba(255,255,255,0.04)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
              <LayoutDashboard size={15} className="text-white" />
            </div>
            <span className="font-bold text-base text-white">SpendSense</span>
          </div>
          <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg hover:bg-white/[0.04] text-gray-500">
            <ChevronLeft size={18} />
          </button>
        </div>
        <nav className="p-3 space-y-1">
          {[...navItems, ...bottomItems].map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'text-primary-400 bg-primary-500/[0.08]'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* ── Main Content ── */}
      <div
  className="transition-all duration-500"
  style={{
    paddingLeft: collapsed ? "84px" : "240px",
  }}
>
        <header className="h-16 flex items-center justify-between px-6 lg:px-8 sticky top-0 z-20 bg-surface/80 backdrop-blur-2xl border-b border-[rgba(255,255,255,0.04)]">
          <div className="hidden lg:flex relative">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search anything..."
              className="w-72 lg:w-96 pl-10 pr-4 py-2.5 bg-[#1A1A1E] border border-[rgba(255,255,255,0.06)] rounded-2xl text-sm placeholder:text-gray-600 text-gray-200 focus:border-primary-500/30 focus:ring-1 focus:ring-primary-500/15 transition-all duration-300"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-600 font-medium px-1.5 py-0.5 rounded-md bg-white/[0.04] border border-[rgba(255,255,255,0.06)]">
              ⌘K
            </div>
          </div>

          <div className="lg:hidden" />

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/notifications')}
              className="relative p-2.5 rounded-xl hover:bg-white/[0.04] text-gray-500 hover:text-gray-300 transition-colors"
              title="Notifications"
            >
              <Bell size={17} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-primary-500 rounded-full text-[9px] font-bold text-white ring-2 ring-surface flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl hover:bg-white/[0.04] transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white text-[11px] font-bold shadow-lg">
                  {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <ChevronDown size={13} className={`text-gray-500 transition-transform duration-300 ${profileOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute right-0 top-full mt-2 w-60 bg-[#1A1A1E] rounded-3xl border border-[rgba(255,255,255,0.08)] shadow-glass-xl p-2"
                  >
                    <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.04)] mb-1">
                      <p className="text-sm font-semibold text-gray-200">{user?.full_name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>
                    </div>
                    <div onClick={() => { navigate('/profile'); setProfileOpen(false) }} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-400 hover:text-gray-200 hover:bg-white/[0.04] rounded-xl transition-colors cursor-pointer">
                      <User size={14} /> Profile
                    </div>
                    <div onClick={() => { navigate('/settings'); setProfileOpen(false) }} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-400 hover:text-gray-200 hover:bg-white/[0.04] rounded-xl transition-colors cursor-pointer">
                      <Settings size={14} /> Settings
                    </div>
                    <div onClick={() => { navigate('/reports'); setProfileOpen(false) }} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-400 hover:text-gray-200 hover:bg-white/[0.04] rounded-xl transition-colors cursor-pointer">
                      <FileText size={14} /> Reports
                    </div>
                    <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors mt-1">
                      <LogOut size={14} /> Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main className="p-6 lg:p-8 xl:p-10 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
