import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, Send, Bot, User, Trash2,
  Loader2, Wallet,
  TrendingDown, Target, AlertTriangle,
  BarChart3, DollarSign, CreditCard,
} from 'lucide-react'
import Card from '../components/ui/Card'
import { copilotApi, type SuggestedPrompt, type CopilotConversationMessage } from '../services/api'

const promptIcons: Record<string, React.ReactNode> = {
  'Where did I spend most?': <TrendingDown size={14} />,
  'How much did I save?': <Wallet size={14} />,
  'Compare months': <BarChart3 size={14} />,
  'Subscriptions': <CreditCard size={14} />,
  'Budgeting advice': <Target size={14} />,
  'Predict next month': <Sparkles size={14} />,
  'Unusual transactions': <AlertTriangle size={14} />,
  'Reduce spending': <DollarSign size={14} />,
}

export default function Copilot() {
  const [messages, setMessages] = useState<CopilotConversationMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<SuggestedPrompt[]>([])
  const [initialLoading, setInitialLoading] = useState(true)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Promise.all([
      copilotApi.history(),
      copilotApi.suggestions(),
    ])
      .then(([hist, sug]) => {
        setMessages(hist.data.messages)
        setSuggestions(sug.data.prompts)
      })
      .catch(() => {})
      .finally(() => setInitialLoading(false))
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return
    setInput('')
    setLoading(true)

    const userMsg: CopilotConversationMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])

    try {
      const res = await copilotApi.chat({ message: text })
      const reply: CopilotConversationMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.data.reply,
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, reply])
    } catch {
      const errId = (Date.now() + 2).toString()
      setMessages((prev) => [...prev, {
        id: errId,
        role: 'assistant',
        content: "Sorry, I couldn't process that request. Please try again.",
        created_at: new Date().toISOString(),
      }])
      setTimeout(() => {
        setMessages((prev) => prev.filter((m) => m.id !== errId))
      }, 5000)
    } finally {
      setLoading(false)
    }
  }, [loading])

  const clearHistory = async () => {
    setMessages([])
    try { await copilotApi.clear() } catch {}
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const formatReply = (content: string) => {
    return content.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={i} className="font-bold text-white text-sm mb-2">{line.replace(/\*\*/g, '')}</p>
      }
      if (line.startsWith('• ')) {
        return <p key={i} className="text-gray-300 text-sm pl-4 mb-1">• {line.slice(2)}</p>
      }
      if (line.startsWith('  • ')) {
        return <p key={i} className="text-gray-400 text-sm pl-8 mb-0.5">• {line.slice(4)}</p>
      }
      if (line.trim() === '') {
        return <div key={i} className="h-2" />
      }
      return <p key={i} className="text-gray-300 text-sm mb-1">{line}</p>
    })
  }

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary-500/10 flex items-center justify-center border border-primary-500/15">
            <Loader2 size={20} className="text-primary-400 animate-spin" />
          </div>
          <p className="text-sm text-gray-500">Loading conversations...</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-400 to-purple-600 flex items-center justify-center">
            <Sparkles size={15} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">AI Financial Copilot</h1>
            <p className="text-xs text-gray-500">Ask anything about your finances</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={clearHistory} className="btn-outline !px-3 !py-1.5 !text-xs">
            <Trash2 size={12} />
            Clear
          </button>
        )}
      </div>

      <Card className="min-h-[60vh] flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 px-4">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-accent-400/10 to-purple-600/10 flex items-center justify-center mb-4 border border-accent-500/15">
              <Sparkles size={28} className="text-accent-400" />
            </div>
            <h2 className="text-lg font-bold text-white mb-1">Your AI Financial Assistant</h2>
            <p className="text-sm text-gray-500 text-center max-w-md mb-8">
              Ask me about your spending, savings, budgets, subscriptions, or get personalized financial advice.
            </p>

            <div className="grid grid-cols-2 gap-2 w-full max-w-lg">
              {suggestions.slice(0, 6).map((p) => (
                <button
                  key={p.label}
                  onClick={() => sendMessage(p.query)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-white/[0.03] border border-[rgba(255,255,255,0.06)] hover:bg-white/[0.06] hover:border-white/10 transition-all text-left group"
                >
                  <span className="text-accent-400 shrink-0">
                    {promptIcons[p.label] || <Sparkles size={14} />}
                  </span>
                  <span className="text-xs font-medium text-gray-400 group-hover:text-gray-200 transition-colors">
                    {p.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-4 px-1 py-2 max-h-[60vh]">
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {m.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-400 to-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot size={14} className="text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      m.role === 'user'
                        ? 'bg-primary-500/10 border border-primary-500/15'
                        : 'bg-white/[0.04] border border-[rgba(255,255,255,0.06)]'
                    }`}
                  >
                    <div className="text-xs text-gray-500 font-medium mb-1">
                      {m.role === 'user' ? 'You' : 'Copilot'}
                    </div>
                    <div className="leading-relaxed">
                      {m.role === 'assistant' ? formatReply(m.content) : (
                        <p className="text-sm text-gray-200">{m.content}</p>
                      )}
                    </div>
                  </div>
                  {m.role === 'user' && (
                    <div className="w-8 h-8 rounded-xl bg-primary-500/10 flex items-center justify-center shrink-0 mt-0.5 border border-primary-500/15">
                      <User size={14} className="text-primary-400" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-400 to-purple-600 flex items-center justify-center shrink-0">
                  <Bot size={14} className="text-white" />
                </div>
                <div className="rounded-2xl px-4 py-3 bg-white/[0.04] border border-[rgba(255,255,255,0.06)]">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-accent-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-accent-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-accent-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-xs text-gray-500">Analyzing your data...</span>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}

        <div className="pt-4 border-t border-[rgba(255,255,255,0.06)] mt-4">
          {messages.length > 0 && suggestions.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto pb-3 scrollbar-none">
              {suggestions.map((p) => (
                <button
                  key={p.label}
                  onClick={() => sendMessage(p.query)}
                  className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.03] border border-[rgba(255,255,255,0.06)] hover:bg-white/[0.06] text-[11px] font-medium text-gray-400 hover:text-gray-200 transition-all"
                >
                  {promptIcons[p.label] || <Sparkles size={11} />}
                  {p.label}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your finances..."
                className="w-full bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-2xl px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-primary-500/30 focus:bg-white/[0.06] transition-all"
                disabled={loading}
              />
            </div>
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-glow-sm transition-all"
            >
              {loading ? (
                <Loader2 size={15} className="text-white animate-spin" />
              ) : (
                <Send size={15} className="text-white" />
              )}
            </button>
          </div>
          <p className="text-[10px] text-gray-600 mt-2 text-center">
            Responses are based on your actual transaction data. Always double-check critical financial decisions.
          </p>
        </div>
      </Card>
    </motion.div>
  )
}
