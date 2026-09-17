"use client"

import type { MouseEventHandler } from "react"

import type { Chain } from "@/types/chain"
import type { ChainPosition } from "@/types/visualization"

export type ChainNodeProps = {
  chain: Chain
  position: ChainPosition
  messageCount?: number
  active?: boolean
  selected?: boolean
  onClick?: MouseEventHandler<SVGGElement>
}

export function ChainNode({
  chain,
  position,
  messageCount = 0,
  active = false,
  selected = false,
  onClick,
}: ChainNodeProps) {
  const accent = chain.color ?? "#e84142"
  const label = `${chain.name}${messageCount ? `, ${messageCount} messages` : ""}`

  return (
    <g
      className="cursor-pointer outline-none"
      role="button"
      tabIndex={0}
      aria-label={label}
      transform={`translate(${position.x} ${position.y})`}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onClick?.(event as unknown as Parameters<MouseEventHandler<SVGGElement>>[0])
        }
      }}
    >
      <title>{`Avalanche L1: ${chain.name}`}</title>
      {(active || selected) && (
        <circle r={selected ? 48 : 43} fill={accent} opacity={0.12} />
      )}
      <circle r={36} fill="#11151b" stroke={selected ? accent : "#38414d"} strokeWidth={selected ? 2 : 1} />
      <circle r={29} fill="none" stroke={accent} strokeDasharray="2 5" opacity={0.55} />
      <circle cx={-18} cy={-20} r={4} fill={active ? accent : "#687382"} />
      <text y={-3} textAnchor="middle" fill="#f3f5f7" fontSize="11" fontWeight="600">
        {chain.shortName}
      </text>
      <text y={12} textAnchor="middle" fill="#8d99a8" fontSize="8">
        {messageCount} MSG{messageCount === 1 ? "" : "S"}
      </text>
      <text y={56} textAnchor="middle" fill="#aeb8c5" fontSize="10">
        {chain.name}
      </text>
    </g>
  )
}
