"use client"

import { useEffect, useMemo, useState, type RefObject } from "react"

import { getRadialPosition } from "@/lib/visualization/geometry"
import type { ChainPosition, NetworkLayoutOptions } from "@/types/visualization"

type LayoutInput = readonly string[]

const DEFAULT_WIDTH = 640
const DEFAULT_HEIGHT = 480

function getViewportSize(): { width: number; height: number } {
  if (typeof window === "undefined") {
    return { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT }
  }

  return {
    width: Math.max(0, window.innerWidth),
    height: Math.max(0, window.innerHeight),
  }
}

function getElementSize(element: HTMLElement | null): { width: number; height: number } | null {
  if (!element) return null

  const rect = element.getBoundingClientRect()
  return { width: Math.max(0, rect.width), height: Math.max(0, rect.height) }
}

function useMeasuredSize(
  containerRef?: RefObject<HTMLElement | null>,
  width?: number,
  height?: number,
): { width: number; height: number } {
  const [size, setSize] = useState(getViewportSize)

  useEffect(() => {
    const element = containerRef?.current ?? null
    const update = () => {
      const elementSize = getElementSize(element)
      const viewportSize = getViewportSize()
      setSize({
        width: width ?? elementSize?.width ?? viewportSize.width,
        height: height ?? elementSize?.height ?? viewportSize.height,
      })
    }

    update()
    if (typeof window === "undefined") return

    const observer = element && typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(update)
      : null
    if (observer && element) observer.observe(element)
    window.addEventListener("resize", update)

    return () => {
      observer?.disconnect()
      window.removeEventListener("resize", update)
    }
  }, [containerRef, height, width])

  return {
    width: width ?? size.width,
    height: height ?? size.height,
  }
}

export function useNetworkLayout(
  chainIds: LayoutInput,
  enabledChainIds?: readonly string[],
  options?: Omit<NetworkLayoutOptions, "enabledChainIds">,
): ChainPosition[]
export function useNetworkLayout(options: NetworkLayoutOptions & { chainIds: LayoutInput }): ChainPosition[]
export function useNetworkLayout(
  chainIdsOrOptions: LayoutInput | (NetworkLayoutOptions & { chainIds: LayoutInput }),
  enabledChainIds?: readonly string[],
  options: Omit<NetworkLayoutOptions, "enabledChainIds"> = {},
): ChainPosition[] {
  const isOptions = !Array.isArray(chainIdsOrOptions)
  const objectOptions = isOptions
    ? (chainIdsOrOptions as NetworkLayoutOptions & { chainIds: LayoutInput })
    : null
  const chainIds: LayoutInput = objectOptions?.chainIds ?? (chainIdsOrOptions as LayoutInput)
  const layoutOptions: Omit<NetworkLayoutOptions, "enabledChainIds"> = objectOptions ?? options
  const enabled = objectOptions?.enabledChainIds ?? enabledChainIds
  const dimensions = useMeasuredSize(layoutOptions.containerRef, layoutOptions.width, layoutOptions.height)
  const enabledSet = enabled ? new Set(enabled) : null
  const visibleChainIds = chainIds.filter((chainId) => !enabledSet || enabledSet.has(chainId))

  return useMemo(
    () =>
      visibleChainIds.map((chainId, index) => ({
        chainId,
        ...getRadialPosition(index, visibleChainIds.length, {
          ...dimensions,
          radius: layoutOptions.radius,
          angleOffset: layoutOptions.angleOffset,
        }),
      })),
    [dimensions, layoutOptions.angleOffset, layoutOptions.radius, visibleChainIds],
  )
}
