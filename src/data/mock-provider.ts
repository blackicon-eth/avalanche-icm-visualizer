import type { Chain, ICMMessage } from "@/types"
import type { ICMDataProvider } from "@/lib/providers"
import { chains } from "./chains"
import { mockMessages } from "./messages"

export class MockICMDataProvider implements ICMDataProvider {
  async getChains(): Promise<Chain[]> {
    return chains.map((chain) => ({ ...chain, metadata: chain.metadata && { ...chain.metadata } }))
  }

  async getRecentMessages(params: Parameters<ICMDataProvider["getRecentMessages"]>[0] = {}): Promise<ICMMessage[]> {
    const chainIds = params?.chainIds
    const since = params?.since
    const result = mockMessages.filter((item) => {
      const matchesChains = !chainIds?.length || chainIds.includes(item.source.chainId) || chainIds.includes(item.destination.chainId)
      return matchesChains && (!since || (item.emittedAt ?? 0) >= since)
    })
    return result.slice(0, params?.limit ?? result.length)
  }

  async getMessage(id: string): Promise<ICMMessage | null> {
    return mockMessages.find((message) => message.id === id) ?? null
  }
}
