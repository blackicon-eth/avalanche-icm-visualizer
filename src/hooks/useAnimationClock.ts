"use client"

import { useAnimationFrame, useMotionValue } from "motion/react"
import { useCallback, useState } from "react"

export type AnimationClock = {
  paused: boolean
  time: ReturnType<typeof useMotionValue<number>>
  setPaused: (paused: boolean) => void
  togglePaused: () => void
}

export function useAnimationClock(initial?: { paused?: boolean }): AnimationClock {
  const [paused, setPaused] = useState(initial?.paused ?? false)
  const time = useMotionValue(0)

  useAnimationFrame((_frameTime, delta) => {
    if (!paused) time.set(time.get() + delta)
  })

  const togglePaused = useCallback(() => setPaused((value) => !value), [])

  return { paused, time, setPaused, togglePaused }
}
