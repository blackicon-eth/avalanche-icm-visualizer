"use client"

import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"

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
    <label className={cn("flex min-w-36 flex-col gap-1.5", className)}>
      <span className="px-1 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={(next) => onChange(next as T)}>
        <SelectTrigger aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  )
}
