import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  User, Mail, Calendar, Activity, FileText,
  Target, Award, Save, Lock, CheckCircle2,
  AlertCircle, EyeOff, Eye, RefreshCw,
} from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { profileApi, type ProfileResponse } from '../services/api'
import { SkeletonCard } from '../components/ui/Skeleton'
import { useAuth } from '../context/AuthContext'

export default function Profile() {
  const { updateUser } = useAuth()
  const [profile, setProfile] = useState<ProfileResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pwMode, setPwMode] = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchProfile = async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const res = await profileApi.get()
      setProfile(res.data)
      setName(res.data.full_name)
      setEmail(res.data.email)
    } catch {
      setFetchError('Failed to load profile')
    }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchProfile() }, [])

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 4000)
  }

  const handleSave = async () => {
    try {
      const res = await profileApi.update({ full_name: name, email })
      setProfile(res.data.user)
      updateUser(res.data.user)
      setEditMode(false)
      showMsg('success', 'Profile updated')
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      showMsg('error', detail || 'Failed to update')
    }
  }

  const handleChangePw = async () => {
    if (!currentPw || !newPw) { showMsg('error', 'Fill all fields'); return }
    if (newPw.length < 8) { showMsg('error', 'Password must be 8+ characters'); return }
    if (!/[A-Z]/.test(newPw)) { showMsg('error', 'Password must contain an uppercase letter'); return }
    if (!/[a-z]/.test(newPw)) { showMsg('error', 'Password must contain a lowercase letter'); return }
    if (!/[0-9]/.test(newPw)) { showMsg('error', 'Password must contain a digit'); return }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPw)) { showMsg('error', 'Password must contain a special character'); return }
    try {
      await profileApi.changePassword({ current_password: currentPw, new_password: newPw })
      setPwMode(false); setCurrentPw(''); setNewPw('')
      showMsg('success', 'Password changed')
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      showMsg('error', detail || 'Failed to change password')
    }
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/15">
          <AlertCircle size={24} className="text-red-400" />
        </div>
        <p className="text-gray-400 text-sm max-w-xs">{fetchError}</p>
        <button onClick={fetchProfile} className="btn-premium !px-4 !py-2 !text-xs">
          <RefreshCw size={13} />
          Retry
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-8 w-40 bg-white/5 rounded-2xl shimmer-overlay" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <SkeletonCard />
          <div className="lg:col-span-2 space-y-5">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-5"
    >
      <div>
        <h1 className="hero-title text-white mb-1">Profile</h1>
        <p className="text-gray-500 text-sm">Manage your account</p>
      </div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium ${
            message.type === 'success' ? 'bg-primary-500/10 text-primary-400 border border-primary-500/15' : 'bg-red-500/10 text-red-400 border border-red-500/15'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          {message.text}
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card glow="primary" className="text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center mx-auto mb-3 shadow-glow">
            <span className="text-2xl font-bold text-white">
              {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <h2 className="text-lg font-bold text-gray-200">{profile?.full_name}</h2>
          <p className="text-sm text-gray-500">{profile?.email}</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="bg-white/[0.03] rounded-2xl p-2.5">
              <p className="text-xs text-gray-500">Statements</p>
              <p className="text-base font-bold text-gray-200">{profile?.total_statements}</p>
            </div>
            <div className="bg-white/[0.03] rounded-2xl p-2.5">
              <p className="text-xs text-gray-500">Txns</p>
              <p className="text-base font-bold text-gray-200">{profile?.total_transactions}</p>
            </div>
            <div className="bg-white/[0.03] rounded-2xl p-2.5">
              <p className="text-xs text-gray-500">Budgets</p>
              <p className="text-base font-bold text-gray-200">{profile?.total_budgets}</p>
            </div>
            <div className="bg-white/[0.03] rounded-2xl p-2.5">
              <p className="text-xs text-gray-500">Goals</p>
              <p className="text-base font-bold text-gray-200">{profile?.total_goals}</p>
            </div>
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-5">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title text-white mb-0">Personal Information</h3>
              {!editMode ? (
                <button onClick={() => setEditMode(true)} className="text-xs font-medium text-primary-400 hover:text-primary-300 transition-colors">Edit</button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setEditMode(false)} className="text-xs font-medium text-gray-500 hover:text-gray-300 transition-colors">Cancel</button>
                  <button onClick={handleSave} className="flex items-center gap-1 text-xs font-medium text-primary-400 hover:text-primary-300 transition-colors">
                    <Save size={12} /> Save
                  </button>
                </div>
              )}
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Full Name</label>
                {editMode ? (
                  <input value={name} onChange={(e) => setName(e.target.value)} className="input-premium" />
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] rounded-2xl text-sm text-gray-300">
                    <User size={13} className="text-gray-500" />
                    {profile?.full_name}
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Email</label>
                {editMode ? (
                  <input value={email} onChange={(e) => setEmail(e.target.value)} className="input-premium" />
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] rounded-2xl text-sm text-gray-300">
                    <Mail size={13} className="text-gray-500" />
                    {profile?.email}
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Member Since</label>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] rounded-2xl text-sm text-gray-300">
                  <Calendar size={13} className="text-gray-500" />
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title text-white mb-0">Password</h3>
              {!pwMode && (
                <button onClick={() => setPwMode(true)} className="text-xs font-medium text-primary-400 hover:text-primary-300 transition-colors">Change</button>
              )}
            </div>
            {pwMode ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Current Password</label>
                  <input type={showPw ? 'text' : 'password'} value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} className="input-premium" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">New Password</label>
                  <div className="relative">
                    <input type={showPw ? 'text' : 'password'} value={newPw} onChange={(e) => setNewPw(e.target.value)} className="input-premium pr-9" />
                    <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                      {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="ghost" onClick={() => setPwMode(false)}>Cancel</Button>
                  <Button variant="premium" onClick={handleChangePw}><Lock size={12} /> Update Password</Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] rounded-2xl text-sm text-gray-500">
                <Lock size={13} className="text-gray-500" />
                ********
              </div>
            )}
          </Card>

          <Card>
            <h3 className="section-title text-white mb-3">Account Statistics</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-white/[0.03] rounded-2xl p-3 text-center">
                <Activity size={16} className="text-primary-400 mx-auto mb-1" />
                <p className="text-base font-bold text-gray-200">{profile?.total_transactions}</p>
                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Transactions</p>
              </div>
              <div className="bg-white/[0.03] rounded-2xl p-3 text-center">
                <FileText size={16} className="text-accent-400 mx-auto mb-1" />
                <p className="text-base font-bold text-gray-200">{profile?.total_statements}</p>
                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Statements</p>
              </div>
              <div className="bg-white/[0.03] rounded-2xl p-3 text-center">
                <Target size={16} className="text-amber-400 mx-auto mb-1" />
                <p className="text-base font-bold text-gray-200">{profile?.total_budgets}</p>
                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Budgets</p>
              </div>
              <div className="bg-white/[0.03] rounded-2xl p-3 text-center">
                <Award size={16} className="text-purple-400 mx-auto mb-1" />
                <p className="text-base font-bold text-gray-200">{profile?.total_goals}</p>
                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Goals</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  )
}
