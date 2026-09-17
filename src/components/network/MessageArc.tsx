import type { MouseEventHandler } from "react"

import { getArcPath } from "@/lib/visualization/paths"
import type { ICMMessage } from "@/types/message"
import type { Point } from "@/types/visualization"

export type MessageArcProps = {
  message: ICMMessage
  source: Point
  destination: Point
  curvature?: number
  active?: boolean
  selected?: boolean
  onClick?: MouseEventHandler<SVGPathElement>
}

export function MessageArc({
  message,
  source,
  destination,
  curvature = 0.2,
  active = true,
  selected = false,
  onClick,
}: MessageArcProps) {
  const path = getArcPath(source, destination, curvature)
  const color = message.protocol === "teleporter" ? "#f4b860" : "#e84142"

  return (
    <path
      d={path}
      fill="none"
      stroke={color}
      strokeWidth={selected ? 2 : 1}
      strokeDasharray={active ? "5 8" : "2 10"}
      strokeLinecap="round"
      opacity={selected ? 0.8 : active ? 0.35 : 0.16}
      className={onClick ? "cursor-pointer" : undefined}
      aria-label={`${message.protocol} message ${message.id} from ${message.source.chainId} to ${message.destination.chainId}`}
      role={onClick ? "button" : undefined}
      onClick={onClick}
    >
      <title>{message.protocol} message {message.id}</title>
    </path>
  )
}
