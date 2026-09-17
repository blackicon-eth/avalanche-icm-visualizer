"use client"

import { useAnimationFrame, useMotionValue } from "motion/react"
import { useCallback, useState } from "react"

export type AnimationSpeed = 0.5 | 1 | 2 | 4

export type AnimationClock = {
  paused: boolean
  speed: AnimationSpeed
  time: ReturnType<typeof useMotionValue<number>>
  setPaused: (paused: boolean) => void
  togglePaused: () => void
  setSpeed: (speed: AnimationSpeed) => void
}

export function useAnimationClock(initial?: {
  paused?: boolean
  speed?: AnimationSpeed
}): AnimationClock {
  const [paused, setPaused] = useState(initial?.paused ?? false)
  const [speed, setSpeed] = useState<AnimationSpeed>(initial?.speed ?? 1)
  const time = useMotionValue(0)

  useAnimationFrame((_frameTime, delta) => {
    if (!paused) time.set(time.get() + delta * speed)
  })

  const togglePaused = useCallback(() => setPaused((value) => !value), [])

  return { paused, speed, time, setPaused, togglePaused, setSpeed }
}
