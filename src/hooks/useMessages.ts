"use client"

import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { chains } from "@/data/chains"
import { createMockMessage } from "@/data/mock"
import { MockICMDataProvider } from "@/data/mock-provider"
import { AvalancheICMDataProvider } from "@/lib/avalanche/adapters"
import type { ICMDataProvider } from "@/lib/providers"
import type { ICMMessage, MessageBatch } from "@/types"

export type DataMode = "mock" | "live"

const mockProvider = new MockICMDataProvider()
const liveProvider = new AvalancheICMDataProvider({ chains })

function providerFor(mode: DataMode): ICMDataProvider {
  return mode === "live" ? liveProvider : mockProvider
}

export function groupMessages(messages: readonly ICMMessage[], windowMs = 1000): MessageBatch[] {
  const batches: MessageBatch[] = []
  const ordered = [...messages].sort((a, b) => (a.emittedAt ?? 0) - (b.emittedAt ?? 0))

  for (const message of ordered) {
    const last = batches[batches.length - 1]
    const sameRoute = last && last.sourceChainId === message.source.chainId && last.destinationChainId === message.destination.chainId
    const closeEnough = last && (message.emittedAt ?? 0) - last.startedAt <= windowMs
    if (last && sameRoute && closeEnough) {
      last.messages.push(message)
    } else {
      batches.push({
        id: `batch-${message.id}`,
        sourceChainId: message.source.chainId,
        destinationChainId: message.destination.chainId,
        messages: [message],
        startedAt: message.emittedAt ?? Date.now(),
      })
    }
  }
  return batches
}

export function useMessages({ mode = "mock", chainIds, paused = false }: { mode?: DataMode; chainIds?: string[]; paused?: boolean } = {}) {
  const query = useQuery({
    queryKey: ["icm-messages", mode, chainIds?.join(",") ?? "all"],
    queryFn: async () => {
      const provider = providerFor(mode)
      const messages = await provider.getRecentMessages({ chainIds, limit: 100, since: Date.now() - 7 * 24 * 60 * 60 * 1000 })
      if (mode === "mock" && !paused) return [...messages, createMockMessage()]
      return messages
    },
    refetchInterval: paused ? false : 5000,
    refetchIntervalInBackground: false,
    staleTime: 2500,
  })

  const messages = useMemo(() => {
    const deduped = new Map<string, ICMMessage>()
    for (const message of query.data ?? []) deduped.set(message.id, message)
    return [...deduped.values()].sort((a, b) => (b.emittedAt ?? 0) - (a.emittedAt ?? 0))
  }, [query.data])

  return { ...query, messages, batches: groupMessages(messages) }
}
