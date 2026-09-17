"use client"

export type NetworkControlsProps = {
  paused: boolean
  onTogglePaused: () => void
  className?: string
}

export function NetworkControls({ paused, onTogglePaused, className }: NetworkControlsProps) {
  return (
    <div
      className={`flex flex-wrap items-center gap-2.5 text-sm ${className ?? ""}`}
      aria-label="Network animation controls"
    >
      <button
        type="button"
        onClick={onTogglePaused}
        className="rounded-full border border-[#38414d] px-4 py-2 font-medium text-[#e8edf2] hover:border-[#e84142]"
        aria-pressed={paused}
      >
        {paused ? "Resume" : "Pause"}
      </button>
      <span className="font-mono text-xs text-[#687382]" aria-live="polite">
        {paused ? "Ⅱ PAUSED" : "● LIVE"}
      </span>
    </div>
  )
}
