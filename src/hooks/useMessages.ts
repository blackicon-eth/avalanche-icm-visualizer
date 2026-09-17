"use client"

import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { chains } from "@/data/chains"
import { AvalancheICMDataProvider } from "@/lib/avalanche/adapters"
import type { ICMDataProvider } from "@/lib/providers"
import type { ICMMessage, MessageBatch } from "@/types"
import type { Chain } from "@/types"

const MESSAGE_RETENTION_LIMIT = 100
const retainedMessagesByKey = new Map<string, Map<string, ICMMessage>>()

function retainMessages(key: string, messages: ICMMessage[]): ICMMessage[] {
  const retained = retainedMessagesByKey.get(key) ?? new Map<string, ICMMessage>()
  for (const message of messages) retained.set(message.id, message)
  const ordered = [...retained.values()].sort((a, b) => (b.emittedAt ?? 0) - (a.emittedAt ?? 0)).slice(0, MESSAGE_RETENTION_LIMIT)
  retainedMessagesByKey.set(key, new Map(ordered.map((message) => [message.id, message])))
  return ordered
}

export function groupMessages(messages: readonly ICMMessage[], windowMs = 1000): MessageBatch[] {
  const batchesByRoute = new Map<string, MessageBatch[]>()
  const ordered = [...messages].sort((a, b) => (a.emittedAt ?? 0) - (b.emittedAt ?? 0))

  for (const message of ordered) {
    const route = `${message.source.chainId}:${message.destination.chainId}`
    const routeBatches = batchesByRoute.get(route) ?? []
    const last = routeBatches[routeBatches.length - 1]
    const timestamp = message.emittedAt ?? 0
    const closeEnough = last && timestamp - last.startedAt <= windowMs

    if (last && closeEnough) {
      last.messages.push(message)
    } else {
      routeBatches.push({
        id: `batch-${message.id}`,
        sourceChainId: message.source.chainId,
        destinationChainId: message.destination.chainId,
        messages: [message],
        startedAt: timestamp,
      })
      batchesByRoute.set(route, routeBatches)
    }
  }

  return [...batchesByRoute.values()].flat().sort((a, b) => a.startedAt - b.startedAt)
}

export function useMessages({ chainIds, paused = false, chains: availableChains = chains }: { chainIds?: string[]; paused?: boolean; chains?: Chain[] } = {}) {
  const provider = useMemo<ICMDataProvider>(() => new AvalancheICMDataProvider({ chains: availableChains }), [availableChains])
  const queryKey = `${chainIds?.join(",") ?? "all"}:${availableChains.map((chain) => chain.id).join(",")}`
  const query = useQuery({
    queryKey: ["icm-messages", chainIds?.join(",") ?? "all", availableChains.map((chain) => chain.id).join(",")],
    queryFn: async () => {
      const messages = await provider.getRecentMessages({ chainIds, limit: 100, since: Date.now() - 7 * 24 * 60 * 60 * 1000 })
      return retainMessages(queryKey, messages)
    },
    refetchInterval: paused ? false : 5000,
    refetchIntervalInBackground: false,
    staleTime: 2500,
  })

  const messages = useMemo(() => {
    return [...(query.data ?? [])].sort((a, b) => (b.emittedAt ?? 0) - (a.emittedAt ?? 0)).slice(0, MESSAGE_RETENTION_LIMIT)
  }, [query.data])

  return { ...query, messages, batches: groupMessages(messages) }
}
