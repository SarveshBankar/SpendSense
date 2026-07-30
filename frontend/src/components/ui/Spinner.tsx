import { Loader2 } from 'lucide-react'

interface SpinnerProps {
  size?: number
  className?: string
}

export default function Spinner({ size = 24, className = '' }: SpinnerProps) {
  return (
    <div className="flex items-center justify-center py-8">
      <Loader2 size={size} className={`text-primary-400 animate-spin ${className}`} />
    </div>
  )
}
