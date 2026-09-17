"use client"

import { motion, useAnimationFrame, useMotionValue, useTransform } from "motion/react"

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
  const progress = useMotionValue(0)
  const speed = useMotionValue(paused ? 0 : 1)
  const offsetDistance = useTransform(progress, (value) => `${value * 100}%`)
  const opacity = useTransform(progress, [0, 0.12, 0.78, 1], [0, 1, 1, 0])
  const scale = useTransform(progress, [0, 0.12, 0.78, 1], [0.7, 1, 1, 0.75])

  useAnimationFrame((_frameTime, delta) => {
    const smoothing = 1 - Math.exp(-delta / 180)
    const targetSpeed = paused ? 0 : 1
    const nextSpeed = speed.get() + (targetSpeed - speed.get()) * smoothing
    speed.set(nextSpeed)
    progress.set((progress.get() + (delta / (duration * 1000)) * nextSpeed) % 1)
  })

  return (
    <motion.circle
      r={4}
      fill={color}
      stroke="#fff"
      strokeWidth={1}
      style={{ offsetPath: `path('${path}')`, offsetRotate: "0deg", offsetDistance, opacity, scale }}
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
