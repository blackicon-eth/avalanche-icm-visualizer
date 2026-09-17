"use client"

import { useMemo, useRef } from "react"

import { useAnimationClock, type AnimationSpeed } from "@/hooks/useAnimationClock"
import { useNetworkLayout } from "@/hooks/useNetworkLayout"
import { ChainNode } from "@/components/network/ChainNode"
import { MessageArc } from "@/components/network/MessageArc"
import { MessageParticle } from "@/components/network/MessageParticle"
import { NetworkControls } from "@/components/network/NetworkControls"
import type { Chain } from "@/types/chain"
import type { ICMMessage } from "@/types/message"
import type { ChainPosition } from "@/types/visualization"

export type NetworkCanvasProps = {
  chains: readonly Chain[]
  messages?: readonly ICMMessage[]
  enabledChainIds?: readonly string[]
  selectedMessageId?: string
  selectedChainId?: string
  width?: number
  height?: number
  paused?: boolean
  speed?: AnimationSpeed
  maxAnimatedMessages?: number
  onMessageClick?: (message: ICMMessage) => void
  onChainClick?: (chain: Chain) => void
  onPausedChange?: (paused: boolean) => void
  onSpeedChange?: (speed: AnimationSpeed) => void
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
  enabledChainIds,
  selectedMessageId,
  selectedChainId,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  paused,
  speed,
  maxAnimatedMessages = DEFAULT_ANIMATION_CAP,
  onMessageClick,
  onChainClick,
  onPausedChange,
  onSpeedChange,
  className,
}: NetworkCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const clock = useAnimationClock({ paused, speed })
  const positions = useNetworkLayout({
    chainIds: chains.map((chain) => chain.id),
    enabledChainIds,
    width,
    height,
    containerRef,
    radius: Math.min(width, height) * 0.35,
    angleOffset: -Math.PI / 2,
  })
  const byId = positionMap(positions)
  const visibleMessages = useMemo(
    () => messages.filter((message) => byId.has(message.source.chainId) && byId.has(message.destination.chainId)),
    [byId, messages],
  )
  const animatedMessages = visibleMessages.slice(-Math.max(0, maxAnimatedMessages))
  const activePairs = new Set(animatedMessages.map((message) => `${message.source.chainId}:${message.destination.chainId}`))
  const chainCounts = useMemo(() => {
    const counts = new Map<string, number>()
    visibleMessages.forEach((message) => {
      counts.set(message.source.chainId, (counts.get(message.source.chainId) ?? 0) + 1)
      counts.set(message.destination.chainId, (counts.get(message.destination.chainId) ?? 0) + 1)
    })
    return counts
  }, [visibleMessages])
  const actualPaused = paused ?? clock.paused
  const actualSpeed = speed ?? clock.speed

  const setPaused = (next: boolean) => {
    if (onPausedChange) onPausedChange(next)
    else clock.setPaused(next)
  }

  return (
    <div ref={containerRef} className={`relative min-h-[360px] w-full overflow-hidden rounded-xl border border-[#242b34] bg-[#0d1014] ${className ?? ""}`}>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-full min-h-[360px] w-full" role="img" aria-labelledby="network-title network-description">
        <title id="network-title">Avalanche interchain message network</title>
        <desc id="network-description">Avalanche L1 chains arranged radially with recent ICM messages travelling between them.</desc>
        <defs>
          <radialGradient id="network-core-glow">
            <stop offset="0" stopColor="#e84142" stopOpacity=".14" />
            <stop offset="1" stopColor="#e84142" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx={width / 2} cy={height / 2} r={Math.min(width, height) * 0.23} fill="url(#network-core-glow)" />
        <g className="connections" aria-label="Active message connections">
          {animatedMessages.map((message) => {
            const source = byId.get(message.source.chainId)
            const destination = byId.get(message.destination.chainId)
            if (!source || !destination) return null
            return (
              <MessageArc
                key={`arc-${message.id}`}
                message={message}
                source={source}
                destination={destination}
                active={activePairs.has(`${message.source.chainId}:${message.destination.chainId}`)}
                selected={selectedMessageId === message.id}
                onClick={() => onMessageClick?.(message)}
              />
            )
          })}
        </g>
        <g className="messages" aria-label="Animated messages">
          {animatedMessages.map((message) => {
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
                speed={actualSpeed}
                onClick={() => onMessageClick?.(message)}
              />
            )
          })}
        </g>
        <g className="chains" aria-label="Avalanche L1 chains">
          {chains.map((chain) => {
            const position = byId.get(chain.id)
            if (!position) return null
            return (
              <ChainNode
                key={chain.id}
                chain={chain}
                position={position}
                messageCount={chainCounts.get(chain.id) ?? 0}
                active={activePairs.size > 0 && [...activePairs].some((pair) => pair.startsWith(`${chain.id}:`) || pair.endsWith(`:${chain.id}`))}
                selected={selectedChainId === chain.id}
                onClick={() => onChainClick?.(chain)}
              />
            )
          })}
        </g>
      </svg>
      <div className="pointer-events-none absolute left-4 top-4 font-mono text-[10px] uppercase tracking-[0.22em] text-[#687382]">
        {actualPaused ? "Network paused" : `${visibleMessages.length} recent messages`}
      </div>
      <NetworkControls
        paused={actualPaused}
        speed={actualSpeed}
        onTogglePaused={() => setPaused(!actualPaused)}
        onSpeedChange={(nextSpeed) => (onSpeedChange ? onSpeedChange(nextSpeed) : clock.setSpeed(nextSpeed))}
        className="absolute bottom-4 left-4 rounded-full bg-[#11151b]/90 px-1 py-1"
      />
    </div>
  )
}
