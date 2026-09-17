"use client"

import { cn } from "@/lib/utils"

type LiveControlProps = {
  live: boolean
  onChange: (live: boolean) => void
  className?: string
}

export function LiveControl({ live, onChange, className }: LiveControlProps) {
  return (
    <button
      type="button"
      aria-pressed={live}
      onClick={() => onChange(!live)}
      className={cn(
        "inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border px-3 text-xs font-semibold tracking-wide transition-colors",
        live
          ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-500"
          : "border-border bg-muted/40 text-muted-foreground",
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", live ? "animate-pulse bg-emerald-400" : "bg-muted-foreground")} />
      {live ? "Live" : "Paused"}
    </button>
  )
}
