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

export default function Profile() {
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
      setEditMode(false)
      showMsg('success', 'Profile updated')
    } catch (err: any) {
      showMsg('error', err.response?.data?.detail || 'Failed to update')
    }
  }

  const handleChangePw = async () => {
    if (!currentPw || !newPw) { showMsg('error', 'Fill all fields'); return }
    if (newPw.length < 6) { showMsg('error', 'Password must be 6+ chars'); return }
    try {
      await profileApi.changePassword({ current_password: currentPw, new_password: newPw })
      setPwMode(false); setCurrentPw(''); setNewPw('')
      showMsg('success', 'Password changed')
    } catch (err: any) {
      showMsg('error', err.response?.data?.detail || 'Failed to change password')
    }
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
          <AlertCircle size={28} className="text-red-400" />
        </div>
        <p className="text-gray-400 text-sm max-w-xs">{fetchError}</p>
        <button onClick={fetchProfile} className="btn-premium !px-5 !py-2.5 !text-xs">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SkeletonCard />
          <div className="lg:col-span-2 space-y-6">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      <div>
        <h1 className="hero-title text-white mb-2">Profile</h1>
        <p className="text-gray-500 text-lg">Manage your account</p>
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
        <Card hover glow="primary" className="text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center mx-auto mb-4 shadow-glow">
            <span className="text-3xl font-bold text-white">
              {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <h2 className="text-lg font-bold text-gray-200">{profile?.full_name}</h2>
          <p className="text-sm text-gray-500">{profile?.email}</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="bg-white/[0.03] rounded-2xl p-3">
              <p className="text-xs text-gray-500">Statements</p>
              <p className="text-lg font-bold text-gray-200">{profile?.total_statements}</p>
            </div>
            <div className="bg-white/[0.03] rounded-2xl p-3">
              <p className="text-xs text-gray-500">Txns</p>
              <p className="text-lg font-bold text-gray-200">{profile?.total_transactions}</p>
            </div>
            <div className="bg-white/[0.03] rounded-2xl p-3">
              <p className="text-xs text-gray-500">Budgets</p>
              <p className="text-lg font-bold text-gray-200">{profile?.total_budgets}</p>
            </div>
            <div className="bg-white/[0.03] rounded-2xl p-3">
              <p className="text-xs text-gray-500">Goals</p>
              <p className="text-lg font-bold text-gray-200">{profile?.total_goals}</p>
            </div>
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card hover>
            <div className="flex items-center justify-between mb-5">
              <h3 className="section-title text-white mb-0">Personal Information</h3>
              {!editMode ? (
                <button onClick={() => setEditMode(true)} className="text-xs font-medium text-primary-400 hover:text-primary-300 transition-colors">Edit</button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setEditMode(false)} className="text-xs font-medium text-gray-500 hover:text-gray-300 transition-colors">Cancel</button>
                  <button onClick={handleSave} className="flex items-center gap-1 text-xs font-medium text-primary-400 hover:text-primary-300 transition-colors">
                    <Save size={13} /> Save
                  </button>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Full Name</label>
                {editMode ? (
                  <input value={name} onChange={(e) => setName(e.target.value)} className="input-premium" />
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.03] rounded-2xl text-sm text-gray-300">
                    <User size={14} className="text-gray-500" />
                    {profile?.full_name}
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Email</label>
                {editMode ? (
                  <input value={email} onChange={(e) => setEmail(e.target.value)} className="input-premium" />
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.03] rounded-2xl text-sm text-gray-300">
                    <Mail size={14} className="text-gray-500" />
                    {profile?.email}
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Member Since</label>
                <div className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.03] rounded-2xl text-sm text-gray-300">
                  <Calendar size={14} className="text-gray-500" />
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                </div>
              </div>
            </div>
          </Card>

          <Card hover>
            <div className="flex items-center justify-between mb-5">
              <h3 className="section-title text-white mb-0">Password</h3>
              {!pwMode && (
                <button onClick={() => setPwMode(true)} className="text-xs font-medium text-primary-400 hover:text-primary-300 transition-colors">Change</button>
              )}
            </div>
            {pwMode ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Current Password</label>
                  <input type={showPw ? 'text' : 'password'} value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} className="input-premium" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">New Password</label>
                  <div className="relative">
                    <input type={showPw ? 'text' : 'password'} value={newPw} onChange={(e) => setNewPw(e.target.value)} className="input-premium pr-10" />
                    <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="ghost" onClick={() => setPwMode(false)}>Cancel</Button>
                  <Button variant="premium" onClick={handleChangePw}><Lock size={13} /> Update Password</Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.03] rounded-2xl text-sm text-gray-500">
                <Lock size={14} className="text-gray-500" />
                ********
              </div>
            )}
          </Card>

          <Card hover>
            <h3 className="section-title text-white mb-4">Account Statistics</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white/[0.03] rounded-2xl p-4 text-center">
                <Activity size={18} className="text-primary-400 mx-auto mb-1.5" />
                <p className="text-lg font-bold text-gray-200">{profile?.total_transactions}</p>
                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Transactions</p>
              </div>
              <div className="bg-white/[0.03] rounded-2xl p-4 text-center">
                <FileText size={18} className="text-accent-400 mx-auto mb-1.5" />
                <p className="text-lg font-bold text-gray-200">{profile?.total_statements}</p>
                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Statements</p>
              </div>
              <div className="bg-white/[0.03] rounded-2xl p-4 text-center">
                <Target size={18} className="text-amber-400 mx-auto mb-1.5" />
                <p className="text-lg font-bold text-gray-200">{profile?.total_budgets}</p>
                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Budgets</p>
              </div>
              <div className="bg-white/[0.03] rounded-2xl p-4 text-center">
                <Award size={18} className="text-purple-400 mx-auto mb-1.5" />
                <p className="text-lg font-bold text-gray-200">{profile?.total_goals}</p>
                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Goals</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  )
}
