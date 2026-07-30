import { useState, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

export default function LandingPage() {
  const [apiStatus, setApiStatus] = useState<string>('checking...')

  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then((res) => res.json())
      .then((data) => setApiStatus(data.status))
      .catch(() => setApiStatus('unreachable'))
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />

      <div className="relative z-10 text-center max-w-3xl">
        <div className="mb-6 inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm text-purple-200">
          <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          API {apiStatus}
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-6">
          SpendSense
        </h1>

        <p className="text-lg md:text-xl text-purple-200/80 max-w-2xl mx-auto mb-10 leading-relaxed">
          Your intelligent personal finance co-pilot. Upload bank statements,
          analyze spending patterns, categorize transactions, and unlock
          actionable financial insights — all in one place.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => window.open('http://localhost:8000/docs', '_blank')}
            className="group relative px-8 py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 hover:-translate-y-0.5"
          >
            <span className="relative z-10">Get Started</span>
          </button>

          <a
            href="https://github.com/yourusername/spendsense"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-3.5 border border-white/20 text-white/80 font-medium rounded-xl hover:bg-white/5 hover:border-white/30 transition-all duration-300"
          >
            View on GitHub
          </a>
        </div>
      </div>

      <footer className="absolute bottom-6 text-sm text-white/30">
        &copy; {new Date().getFullYear()} SpendSense. All rights reserved.
      </footer>
    </div>
  )
}
