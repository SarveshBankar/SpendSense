import { useState, useRef } from 'react'
import { CloudUpload } from 'lucide-react'
import { motion } from 'framer-motion'

interface Props {
  onUpload: (file: File) => Promise<void>
}

export default function UploadZone({ onUpload }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.pdf')) return
    setUploading(true)
    try {
      await onUpload(file)
    } finally {
      setUploading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
      onClick={() => inputRef.current?.click()}
      className={`relative overflow-hidden rounded-3xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-300 ${
        dragOver
          ? 'border-primary-400 bg-primary-500/5 scale-[1.005]'
          : 'border-[rgba(255,255,255,0.07)] hover:border-primary-500/25 hover:bg-primary-500/[0.02]'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        hidden
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {uploading ? (
        <div className="flex flex-col items-center gap-2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            className="w-9 h-9 border-[3px] border-primary-500/30 border-t-primary-500 rounded-full"
          />
          <div>
            <p className="text-sm font-semibold text-gray-200">Uploading & parsing...</p>
            <p className="text-xs text-gray-500 mt-0.5">This may take a moment</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500/8 to-primary-600/8 flex items-center justify-center border border-primary-500/15">
            <CloudUpload size={26} className="text-primary-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-200">
              Drop your bank statement PDF here, or <span className="text-primary-400 underline decoration-primary-500/30 decoration-2 underline-offset-2">browse</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">Supports PDF files from any bank</p>
          </div>
        </div>
      )}
    </motion.div>
  )
}
