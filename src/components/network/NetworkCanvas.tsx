"use client"

import { useMemo, useRef, useState } from "react"

import { useAnimationClock } from "@/hooks/useAnimationClock"
import { useNetworkDimensions, useNetworkLayout } from "@/hooks/useNetworkLayout"
import { ChainNode } from "@/components/network/ChainNode"
import { MessageArc } from "@/components/network/MessageArc"
import { MessageParticle } from "@/components/network/MessageParticle"
import { MessageBatchMarker } from "@/components/network/MessageBatchMarker"
import { NetworkControls } from "@/components/network/NetworkControls"
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

  return (
    <div
      ref={containerRef}
      className={`relative min-h-[440px] w-full overflow-hidden rounded-xl border border-[#242b34] bg-[#0d1014] ${className ?? ""}`}
    >
      <svg
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        className="h-full min-h-[440px] w-full"
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
                onClick={batch.messages.length === 1 ? () => onMessageClick?.(batch.messages[0]) : undefined}
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
                  key={`particle-${message.id}`}
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
                  [...activePairs].some((pair) => pair.startsWith(`${chain.id}:`) || pair.endsWith(`:${chain.id}`))
                }
                selected={selectedChainId === chain.id}
                onClick={() => onChainClick?.(chain)}
              />
            )
          })}
        </g>
      </svg>
      <div className="pointer-events-none absolute left-6 top-6 font-mono text-xs uppercase tracking-[0.22em] text-[#687382]">
        {actualPaused ? "Network paused" : `${visibleMessages.length} recent messages`}
      </div>
      <NetworkControls
        paused={actualPaused}
        onTogglePaused={() => setPaused(!actualPaused)}
        className="absolute bottom-6 left-6 rounded-full bg-[#11151b]/90 px-1.5 py-1.5"
      />
    </div>
  )
}
