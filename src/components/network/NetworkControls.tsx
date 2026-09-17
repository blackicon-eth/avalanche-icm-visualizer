"use client"

import type { AnimationSpeed } from "@/hooks/useAnimationClock"

export type NetworkControlsProps = {
  paused: boolean
  speed: AnimationSpeed
  onTogglePaused: () => void
  onSpeedChange: (speed: AnimationSpeed) => void
  className?: string
}

const speeds: AnimationSpeed[] = [0.5, 1, 2, 4]

export function NetworkControls({ paused, speed, onTogglePaused, onSpeedChange, className }: NetworkControlsProps) {
  return (
    <div className={`flex flex-wrap items-center gap-2 text-xs ${className ?? ""}`} aria-label="Network animation controls">
      <button type="button" onClick={onTogglePaused} className="rounded-full border border-[#38414d] px-3 py-1.5 font-medium text-[#e8edf2] hover:border-[#e84142]" aria-pressed={paused}>
        {paused ? "Resume" : "Pause"}
      </button>
      <span className="ml-2 font-mono uppercase tracking-[0.18em] text-[#687382]">Speed</span>
      <div className="flex rounded-full border border-[#38414d] p-0.5" role="group" aria-label="Animation speed">
        {speeds.map((option) => (
          <button key={option} type="button" onClick={() => onSpeedChange(option)} aria-pressed={speed === option} className={`rounded-full px-2 py-1 font-mono ${speed === option ? "bg-[#e84142] text-white" : "text-[#aeb8c5] hover:text-white"}`}>
            {option}x
          </button>
        ))}
      </div>
      <span className="font-mono text-[#687382]" aria-live="polite">{paused ? "Ⅱ PAUSED" : "● LIVE"}</span>
    </div>
  )
}
