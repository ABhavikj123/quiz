import React from "react"

export default function Announce({
  show,
  title,
  children,
  onClose,
}: {
  show: boolean
  title: string
  children: React.ReactNode
  onClose?: () => void
}) {
  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="pointer-events-auto bg-white/95 dark:bg-slate-900/95 rounded-lg shadow-xl p-6 max-w-lg w-full text-center border">
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <div className="mb-4">{children}</div>
        <div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary text-white rounded hover:opacity-95"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}
