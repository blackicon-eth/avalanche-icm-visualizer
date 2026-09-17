"use client"

import { cn } from "@/lib/utils"

export type FilterOption<T extends string> = { value: T; label: string }

type FilterSelectProps<T extends string> = {
  label: string
  value: T
  options: readonly FilterOption<T>[]
  onChange: (value: T) => void
  className?: string
}

export function FilterSelect<T extends string>({ label, value, options, onChange, className }: FilterSelectProps<T>) {
  return (
    <label className={cn("flex min-w-32 flex-col gap-1", className)}>
      <span className="px-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="h-9 rounded-lg border border-border bg-background px-2.5 text-sm outline-none transition-colors focus:border-foreground"
      >
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  )
}
