"use client"

import { getControlPoint } from "@/lib/visualization/geometry"
import type { MessageBatch } from "@/types/batch"
import type { Point } from "@/types/visualization"

export type MessageBatchMarkerProps = {
  batch: MessageBatch
  source: Point
  destination: Point
  expanded?: boolean
  selected?: boolean
  onClick?: () => void
}

export function MessageBatchMarker({ batch, source, destination, expanded = false, selected = false, onClick }: MessageBatchMarkerProps) {
  const control = getControlPoint(source, destination)
  const position = {
    x: (source.x + 2 * control.x + destination.x) / 4,
    y: (source.y + 2 * control.y + destination.y) / 4,
  }
  const protocol = batch.messages[0]?.protocol ?? "unknown"
  const color = protocol === "teleporter" ? "#f4b860" : "#e84142"
  const label = `${batch.messages.length} ${protocol} messages from ${batch.sourceChainId} to ${batch.destinationChainId}${expanded ? ", expanded" : ", activate to expand"}`

  return (
    <g
      transform={`translate(${position.x} ${position.y})`}
      role="button"
      tabIndex={0}
      aria-label={label}
      aria-expanded={expanded}
      className="cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onClick?.()
        }
      }}
    >
      <title>{label}</title>
      <circle r={18} fill="#0d1014" stroke={color} strokeOpacity={selected ? 0.95 : 0.72} strokeWidth={selected ? 2 : 1} />
      <circle r={13} fill={color} fillOpacity={selected ? 0.24 : 0.14} />
      <text x="0" y="1" textAnchor="middle" dominantBaseline="middle" fill="#f4f1eb" fontSize="11" fontWeight="700" pointerEvents="none">
        ×{batch.messages.length}
      </text>
    </g>
  )
}
