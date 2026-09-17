"use client"

import type { ICMMessageProtocol, ICMMessageStatus } from "@/types"
import { FilterSelect, type FilterOption } from "./FilterSelect"

export type MessageFilterValues = {
  protocol: "all" | ICMMessageProtocol
  status: "all" | ICMMessageStatus
  time: "all" | "hour" | "day" | "week"
  source: string
  destination: string
}

type MessageFiltersProps = {
  value: MessageFilterValues
  onChange: (value: MessageFilterValues) => void
  chains: ReadonlyArray<{ id: string; name: string }>
  className?: string
}

const protocolOptions: readonly FilterOption<MessageFilterValues["protocol"]>[] = [
  { value: "all", label: "All protocols" }, { value: "warp", label: "Warp" }, { value: "teleporter", label: "Teleporter" }, { value: "unknown", label: "Unknown" },
]
const statusOptions: readonly FilterOption<MessageFilterValues["status"]>[] = [
  { value: "all", label: "All statuses" }, { value: "observed", label: "Observed" }, { value: "relaying", label: "Relaying" }, { value: "delivered", label: "Delivered" }, { value: "failed", label: "Failed" },
]
const timeOptions: readonly FilterOption<MessageFilterValues["time"]>[] = [
  { value: "all", label: "Any time" }, { value: "hour", label: "Last hour" }, { value: "day", label: "Last 24 hours" }, { value: "week", label: "Last 7 days" },
]

export function MessageFilters({ value, onChange, chains, className }: MessageFiltersProps) {
  const update = <K extends keyof MessageFilterValues>(key: K, next: MessageFilterValues[K]) => onChange({ ...value, [key]: next })
  const chainOptions = [{ value: "all", label: "Any chain" }, ...chains.map((chain) => ({ value: chain.id, label: chain.name }))]
  return (
    <div className={className} role="region" aria-label="Message filters">
      <div className="flex flex-wrap items-end gap-3">
        <FilterSelect label="Protocol" value={value.protocol} options={protocolOptions} onChange={(next) => update("protocol", next)} />
        <FilterSelect label="Status" value={value.status} options={statusOptions} onChange={(next) => update("status", next)} />
        <FilterSelect label="Time range" value={value.time} options={timeOptions} onChange={(next) => update("time", next)} />
        <FilterSelect label="Source" value={value.source} options={chainOptions} onChange={(next) => update("source", next)} />
        <FilterSelect label="Destination" value={value.destination} options={chainOptions} onChange={(next) => update("destination", next)} />
      </div>
    </div>
  )
}
