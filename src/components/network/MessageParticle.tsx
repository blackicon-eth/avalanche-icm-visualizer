"use client"

import { motion } from "motion/react"
import { useAnimation } from "motion/react"
import { useEffect } from "react"

import { getArcPath } from "@/lib/visualization/paths"
import type { ICMMessage } from "@/types/message"
import type { Point } from "@/types/visualization"

export type MessageParticleProps = {
  message: ICMMessage
  source: Point
  destination: Point
  paused?: boolean
  duration?: number
  onClick?: () => void
}

export function MessageParticle({
  message,
  source,
  destination,
  paused = false,
  duration = 2,
  onClick,
}: MessageParticleProps) {
  const path = getArcPath(source, destination)
  const color = message.protocol === "teleporter" ? "#f4b860" : "#e84142"
  const controls = useAnimation()

  useEffect(() => {
    if (paused) {
      controls.stop()
      return
    }

    void controls.start({
      offsetDistance: "100%",
      opacity: [0, 1, 1, 0],
      scale: [0.7, 1, 1, 0.75],
      transition: { duration, ease: [0.22, 0.75, 0.35, 1], repeat: Infinity, repeatDelay: 0.4 },
    })

    return () => controls.stop()
  }, [controls, duration, paused])

  return (
    <motion.circle
      r={4}
      fill={color}
      stroke="#fff"
      strokeWidth={1}
      initial={{ offsetDistance: "0%", opacity: 0, scale: 0.7 }}
      animate={controls}
      style={{ offsetPath: `path('${path}')`, offsetRotate: "0deg" }}
      role="button"
      tabIndex={0}
      aria-label={`Animated ${message.protocol} message ${message.id}`}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onClick?.()
        }
      }}
      className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
    >
      <title>{`Message ${message.id} travelling from ${message.source.chainId} to ${message.destination.chainId}`}</title>
    </motion.circle>
  )
}
