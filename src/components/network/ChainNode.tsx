"use client"

import type { MouseEventHandler } from "react"
import { motion } from "motion/react"

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
    <motion.g
      className="cursor-pointer outline-none"
      role="button"
      tabIndex={0}
      aria-label={label}
      initial={false}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 24, mass: 0.7 }}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onClick?.(event as unknown as Parameters<MouseEventHandler<SVGGElement>>[0])
        }
      }}
    >
      <title>{`Avalanche L1: ${chain.name}`}</title>
      {(active || selected) && <circle r={selected ? 48 : 43} fill={accent} opacity={0.12} />}
      <circle r={42} fill="#11151b" stroke={selected ? accent : "#38414d"} strokeWidth={selected ? 2 : 1} />
      <circle r={34} fill="none" stroke={accent} strokeDasharray="2 5" opacity={0.55} />
      <circle cx={-22} cy={-24} r={5} fill={active ? accent : "#687382"} />
      <text y={-3} textAnchor="middle" fill="#f3f5f7" fontSize="13" fontWeight="600">
        {chain.shortName}
      </text>
      <text y={15} textAnchor="middle" fill="#8d99a8" fontSize="9">
        {messageCount} MSG{messageCount === 1 ? "" : "S"}
      </text>
      <text y={64} textAnchor="middle" fill="#aeb8c5" fontSize="12">
        {chain.name}
      </text>
    </motion.g>
  )
}
