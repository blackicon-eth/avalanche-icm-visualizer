"use client"

import { useQuery } from "@tanstack/react-query"
import { useMemo, useRef } from "react"
import { chains } from "@/data/chains"
import { createMockMessage } from "@/data/mock"
import { MockICMDataProvider } from "@/data/mock-provider"
import { AvalancheICMDataProvider } from "@/lib/avalanche/adapters"
import type { ICMDataProvider } from "@/lib/providers"
import type { ICMMessage, MessageBatch } from "@/types"
import type { Chain } from "@/types"

export type DataMode = "mock" | "live"

const mockProvider = new MockICMDataProvider()
const MESSAGE_RETENTION_LIMIT = 100

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

export function useMessages({ mode = "mock", chainIds, paused = false, chains: availableChains = chains }: { mode?: DataMode; chainIds?: string[]; paused?: boolean; chains?: Chain[] } = {}) {
  const provider = useMemo<ICMDataProvider>(() => mode === "live" ? new AvalancheICMDataProvider({ chains: availableChains }) : mockProvider, [availableChains, mode])
  const query = useQuery({
    queryKey: ["icm-messages", mode, chainIds?.join(",") ?? "all", availableChains.map((chain) => chain.id).join(",")],
    queryFn: async () => {
      const messages = await provider.getRecentMessages({ chainIds, limit: 100, since: Date.now() - 7 * 24 * 60 * 60 * 1000 })
      if (mode === "mock" && !paused) {
        const generated = createMockMessage()
        const matchesChains =
          !chainIds?.length ||
          (chainIds.includes(generated.source.chainId) && chainIds.includes(generated.destination.chainId))
        return matchesChains ? [...messages, generated] : messages
      }
      return messages
    },
    refetchInterval: paused ? false : 5000,
    refetchIntervalInBackground: false,
    staleTime: 2500,
  })

  const retained = useRef<{ key: string; messages: Map<string, ICMMessage> }>({ key: "", messages: new Map() })
  const queryKey = `${mode}:${chainIds?.join(",") ?? "all"}:${availableChains.map((chain) => chain.id).join(",")}`
  const messages = useMemo(() => {
    if (retained.current.key !== queryKey) {
      retained.current = { key: queryKey, messages: new Map() }
    }

    for (const message of query.data ?? []) retained.current.messages.set(message.id, message)
    const ordered = [...retained.current.messages.values()].sort((a, b) => (b.emittedAt ?? 0) - (a.emittedAt ?? 0))
    retained.current.messages = new Map(ordered.slice(0, MESSAGE_RETENTION_LIMIT).map((message) => [message.id, message]))
    return ordered.slice(0, MESSAGE_RETENTION_LIMIT)
  }, [query.data, queryKey])

  return { ...query, messages, batches: groupMessages(messages) }
}
