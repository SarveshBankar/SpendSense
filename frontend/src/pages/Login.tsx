import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, LayoutDashboard, ArrowRight, TrendingUp, Shield, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Background from '../components/ui/Background'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email.trim()) { setError('Please enter your email'); return }
    if (!password) { setError('Please enter your password'); return }
    setSubmitting(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex overflow-hidden">
      <Background />

      {/* Left — Brand */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-16">
        <div className="absolute inset-0 bg-mesh-auth" />
        <div className="blob w-[500px] h-[500px] bg-primary-500/15 top-[-15%] left-[-10%] animate-blob" />
        <div className="blob w-[400px] h-[400px] bg-accent-500/12 bottom-[-10%] right-[-5%] animate-blob-reverse" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative text-center max-w-lg"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-4xl bg-white/[0.04] backdrop-blur-xl border border-[rgba(255,255,255,0.08)] mb-10 shadow-glass-xl">
            <LayoutDashboard size={40} className="text-primary-400" />
          </div>
          <h1 className="hero-title text-gradient mb-4">SpendSense</h1>
          <p className="text-gray-500 text-lg leading-relaxed max-w-md mx-auto">
            AI-powered financial intelligence. Track, analyze, and optimize every rupee.
          </p>
          <div className="mt-12 flex items-center justify-center gap-10">
            {[
              { icon: Sparkles, label: 'AI Insights' },
              { icon: Shield, label: '100% Secure' },
              { icon: TrendingUp, label: 'Smart Goals' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-[rgba(255,255,255,0.06)] flex items-center justify-center">
                  <Icon size={20} className="text-primary-400" />
                </div>
                <span className="text-xs text-gray-500 font-medium">{label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm"
        >
          <div className="mb-10">
            <div className="lg:hidden flex items-center gap-2.5 mb-8">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-glow-sm">
                <LayoutDashboard size={18} className="text-white" />
              </div>
              <span className="font-bold text-lg text-white">SpendSense</span>
            </div>
            <h2 className="section-title text-white">Welcome back</h2>
            <p className="text-gray-500 mt-2">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-2xl px-5 py-3.5"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="input-premium !pl-11" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type={showPw ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" className="input-premium !pl-11 !pr-11" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={submitting} className="btn-premium w-full py-3.5">
              {submitting ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign In <ArrowRight size={16} /></>
              )}
            </button>

            <p className="text-center text-sm text-gray-500">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-400 font-semibold hover:text-primary-300 transition-colors">
                Create one
              </Link>
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
