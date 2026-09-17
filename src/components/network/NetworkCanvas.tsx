"use client"

import { useMemo, useRef, useState } from "react"

import { useAnimationClock } from "@/hooks/useAnimationClock"
import { useNetworkDimensions, useNetworkLayout } from "@/hooks/useNetworkLayout"
import { ChainNode } from "@/components/network/ChainNode"
import { MessageArc } from "@/components/network/MessageArc"
import { MessageParticle } from "@/components/network/MessageParticle"
import { MessageBatchMarker } from "@/components/network/MessageBatchMarker"
import { groupMessages } from "@/hooks/useMessages"
import type { Chain } from "@/types/chain"
import type { ICMMessage } from "@/types/message"
import type { MessageBatch } from "@/types/batch"
import type { ChainPosition } from "@/types/visualization"

export type NetworkCanvasProps = {
  chains: readonly Chain[]
  messages?: readonly ICMMessage[]
  batches?: readonly MessageBatch[]
  enabledChainIds?: readonly string[]
  selectedMessageId?: string
  selectedChainId?: string
  width?: number
  height?: number
  paused?: boolean
  loading?: boolean
  maxAnimatedMessages?: number
  onMessageClick?: (message: ICMMessage) => void
  onChainClick?: (chain: Chain) => void
  onPausedChange?: (paused: boolean) => void
  className?: string
}

const DEFAULT_WIDTH = 900
const DEFAULT_HEIGHT = 620
const DEFAULT_ANIMATION_CAP = 50

function positionMap(positions: readonly ChainPosition[]) {
  return new Map(positions.map((position) => [position.chainId, position]))
}

export function NetworkCanvas({
  chains,
  messages = [],
  batches,
  enabledChainIds,
  selectedMessageId,
  selectedChainId,
  width,
  height,
  paused,
  loading = false,
  maxAnimatedMessages = DEFAULT_ANIMATION_CAP,
  onMessageClick,
  onChainClick,
  onPausedChange,
  className,
}: NetworkCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const clock = useAnimationClock({ paused })
  const dimensions = useNetworkDimensions(containerRef, width, height, DEFAULT_WIDTH, DEFAULT_HEIGHT)
  const positions = useNetworkLayout({
    chainIds: chains.map((chain) => chain.id),
    enabledChainIds,
    width: dimensions.width,
    height: dimensions.height,
    radius: Math.min(dimensions.width, dimensions.height) * 0.35,
    angleOffset: -Math.PI / 2,
  })
  const layoutReady = dimensions.width !== DEFAULT_WIDTH || dimensions.height !== DEFAULT_HEIGHT
  const layoutKey = positions.map((position) => `${position.chainId}:${position.x}:${position.y}`).join("|")
  const byId = positionMap(positions)
  const visibleMessages = useMemo(
    () => messages.filter((message) => byId.has(message.source.chainId) && byId.has(message.destination.chainId)),
    [byId, messages],
  )
  const animatedMessages = visibleMessages.slice(-Math.max(0, maxAnimatedMessages))
  const animatedBatches = useMemo(() => {
    const visibleIds = new Set(animatedMessages.map((message) => message.id))
    return (batches ? batches : groupMessages(visibleMessages))
      .map((batch) => ({
        ...batch,
        messages: batch.messages.filter((message) => visibleIds.has(message.id)),
      }))
      .filter((batch) => batch.messages.length > 0)
  }, [animatedMessages, batches, visibleMessages])
  const [expandedBatchIds, setExpandedBatchIds] = useState<Set<string>>(new Set())
  const activePairs = new Set(animatedBatches.map((batch) => `${batch.sourceChainId}:${batch.destinationChainId}`))
  const chainCounts = useMemo(() => {
    const counts = new Map<string, number>()
    visibleMessages.forEach((message) => {
      counts.set(message.source.chainId, (counts.get(message.source.chainId) ?? 0) + 1)
      counts.set(message.destination.chainId, (counts.get(message.destination.chainId) ?? 0) + 1)
    })
    return counts
  }, [visibleMessages])
  const actualPaused = paused ?? clock.paused

  const setPaused = (next: boolean) => {
    if (onPausedChange) onPausedChange(next)
    else clock.setPaused(next)
  }

  const setContainerRef = (element: HTMLDivElement | null) => {
    containerRef.current = element
    if (element) element.dataset.layoutReady = "true"
  }

  return (
    <div
      ref={setContainerRef}
      className={`network-map-enter relative min-h-110 w-full overflow-hidden rounded-xl border border-[#242b34] bg-[#0d1014] ${className ?? ""}`}
    >
      <svg
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        className={`network-map-svg h-full min-h-110 w-full ${loading ? "opacity-45" : "opacity-100"}`}
        role="img"
        aria-labelledby="network-title network-description"
      >
        <title id="network-title">Avalanche interchain message network</title>
        <desc id="network-description">
          Avalanche L1 chains arranged radially with recent ICM messages travelling between them.
        </desc>
        <defs>
          <radialGradient id="network-core-glow">
            <stop offset="0" stopColor="#e84142" stopOpacity=".14" />
            <stop offset="1" stopColor="#e84142" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle
          cx={dimensions.width / 2}
          cy={dimensions.height / 2}
          r={Math.min(dimensions.width, dimensions.height) * 0.23}
          fill="url(#network-core-glow)"
        />
        <g className={`network-activity ${layoutReady ? "network-layout-ready" : ""}`} aria-label="Network activity">
          {layoutReady && (
            <>
              <g aria-label="Active message connections">
                {animatedBatches.map((batch) => {
                  const source = byId.get(batch.sourceChainId)
                  const destination = byId.get(batch.destinationChainId)
                  if (!source || !destination) return null
                  const selected = batch.messages.some((message) => selectedMessageId === message.id)
                  return (
                    <MessageArc
                      key={`arc-${batch.id}`}
                      message={batch.messages[0]}
                      source={source}
                      destination={destination}
                      active={activePairs.has(`${batch.sourceChainId}:${batch.destinationChainId}`)}
                      selected={selected}
                    />
                  )
                })}
              </g>
              <g aria-label="Animated messages">
                {animatedBatches
                  .flatMap((batch) => batch.messages.map((message) => ({ batch, message })))
                  .map(({ batch, message }) => {
                    if (batch.messages.length > 1 && !expandedBatchIds.has(batch.id)) return null
                    const source = byId.get(message.source.chainId)
                    const destination = byId.get(message.destination.chainId)
                    if (!source || !destination) return null
                    return (
                      <MessageParticle
                        key={`particle-${layoutKey}-${message.id}`}
                        message={message}
                        source={source}
                        destination={destination}
                        paused={actualPaused}
                        onClick={() => onMessageClick?.(message)}
                      />
                    )
                  })}
                {animatedBatches
                  .filter((batch) => batch.messages.length > 1 && !expandedBatchIds.has(batch.id))
                  .map((batch) => {
                    const source = byId.get(batch.sourceChainId)
                    const destination = byId.get(batch.destinationChainId)
                    if (!source || !destination) return null
                    return (
                      <MessageBatchMarker
                        key={`marker-${batch.id}`}
                        batch={batch}
                        source={source}
                        destination={destination}
                        selected={batch.messages.some((message) => selectedMessageId === message.id)}
                        onClick={() => setExpandedBatchIds((current) => new Set(current).add(batch.id))}
                      />
                    )
                  })}
              </g>
              <g aria-label="Avalanche L1 chains">
                {chains.map((chain) => {
                  const position = byId.get(chain.id)
                  if (!position) return null
                  return (
                    <ChainNode
                      key={chain.id}
                      chain={chain}
                      position={position}
                      messageCount={chainCounts.get(chain.id) ?? 0}
                      active={
                        activePairs.size > 0 &&
                        [...activePairs].some(
                          (pair) => pair.startsWith(`${chain.id}:`) || pair.endsWith(`:${chain.id}`),
                        )
                      }
                      selected={selectedChainId === chain.id}
                      onClick={() => onChainClick?.(chain)}
                    />
                  )
                })}
              </g>
            </>
          )}
        </g>
      </svg>
      <div
        className={`network-loading absolute inset-0 z-10 grid place-items-center bg-[#0d1014]/72 backdrop-blur-[2px] ${loading ? "" : "is-hidden"}`}
        role="status"
        aria-live="polite"
        aria-hidden={!loading}
      >
        <div className="flex items-center gap-3 rounded-lg border border-[#303944] bg-[#11161c]/90 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-[#9aa5b1] shadow-2xl">
          <span
            className="loading-spinner h-4 w-4 rounded-full border-2 border-[#39434e] border-t-[#e84142]"
            aria-hidden="true"
          />
          Loading messages
        </div>
      </div>
      <div className="pointer-events-none absolute left-6 top-6 font-mono text-xs uppercase tracking-[0.22em] text-[#687382]">
        Network Map
      </div>
      <div
        className="pointer-events-none absolute bottom-5 left-6 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md border border-[#242b34]/80 bg-[#0d1014]/85 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#8b96a2] backdrop-blur-sm"
        aria-label="Message protocol legend"
      >
        <span className="text-[#687382]">Messages</span>
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#e84142] shadow-[0_0_8px_#e84142]" />
          Warp
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#f4b860] shadow-[0_0_8px_#f4b860]" />
          Teleporter
        </span>
      </div>
    </div>
  )
}
