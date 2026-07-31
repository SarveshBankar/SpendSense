import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight, TrendingUp, Shield, Zap } from 'lucide-react'
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
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(detail || 'Invalid email or password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex overflow-hidden">
      <Background />

      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-16">
        <div className="absolute inset-0 bg-mesh-auth" />
        <div className="blob w-[450px] h-[450px] bg-primary-500/12 top-[-15%] left-[-10%] animate-blob" />
        <div className="blob w-[350px] h-[350px] bg-accent-500/10 bottom-[-10%] right-[-5%] animate-blob-reverse" />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative text-center max-w-lg"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-4xl bg-white/[0.04] backdrop-blur-xl border border-[rgba(255,255,255,0.07)] mb-8 shadow-glass-xl">
            <Sparkles size={34} className="text-primary-400" />
          </div>
          <h1 className="hero-title text-gradient mb-3">SpendSense</h1>
          <p className="text-gray-500 text-base leading-relaxed max-w-md mx-auto">
            AI-powered financial intelligence. Track, analyze, and optimize every rupee.
          </p>
          <div className="mt-10 flex items-center justify-center gap-8">
            {[
              { icon: Zap, label: 'AI Insights' },
              { icon: Shield, label: '100% Secure' },
              { icon: TrendingUp, label: 'Smart Goals' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1.5">
                <div className="w-10 h-10 rounded-2xl bg-white/[0.03] border border-[rgba(255,255,255,0.06)] flex items-center justify-center">
                  <Icon size={18} className="text-primary-400" />
                </div>
                <span className="text-xs text-gray-500 font-medium">{label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm"
        >
          <div className="mb-8">
            <div className="lg:hidden flex items-center gap-2.5 mb-6">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-glow-sm">
                <Sparkles size={16} className="text-white" />
              </div>
              <span className="font-bold text-base text-white">SpendSense</span>
            </div>
            <h2 className="section-title text-white">Welcome back</h2>
            <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -6, height: 0 }}
                  className="bg-red-500/10 border border-red-500/15 text-red-400 text-sm rounded-2xl px-4 py-3"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="input-premium !pl-10" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type={showPw ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" className="input-premium !pl-10 !pr-10" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={submitting} className="btn-premium w-full py-3">
              {submitting ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign In <ArrowRight size={15} /></>
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
