"use client"

import { cn } from "@/lib/utils"

export type VisualizationMode = "topology" | "activity"

type ModeControlProps = {
  value: VisualizationMode
  onChange: (value: VisualizationMode) => void
  className?: string
}

export function ModeControl({ value, onChange, className }: ModeControlProps) {
  return (
    <div
      className={cn("inline-flex rounded-lg border border-border bg-muted/50 p-1", className)}
      role="group"
      aria-label="Visualization mode"
    >
      {(["topology", "activity"] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          aria-pressed={value === mode}
          onClick={() => onChange(mode)}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors",
            value === mode ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {mode}
        </button>
      ))}
    </div>
  )
}
