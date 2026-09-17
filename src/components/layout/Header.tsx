"use client"

import { LiveControl } from "@/components/ui/LiveControl"
import { ModeControl, type VisualizationMode } from "@/components/ui/ModeControl"

type HeaderProps = {
  live: boolean
  onLiveChange: (live: boolean) => void
  mode: VisualizationMode
  onModeChange: (mode: VisualizationMode) => void
  onMenuClick?: () => void
}

export function Header({ live, onLiveChange, mode, onModeChange, onMenuClick }: HeaderProps) {
  return (
    <header className="flex min-h-16 items-center justify-between gap-4 border-b border-border px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-md p-2 text-muted-foreground hover:bg-muted md:hidden"
          aria-label="Open navigation"
        >
          ☰
        </button>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Avalanche / ICM</p>
          <h1 className="text-sm font-semibold tracking-tight">Network observatory</h1>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <ModeControl value={mode} onChange={onModeChange} className="hidden sm:inline-flex" />
        <LiveControl live={live} onChange={onLiveChange} />
      </div>
    </header>
  )
}
