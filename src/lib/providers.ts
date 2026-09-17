import type { Chain, ICMMessage } from "@/types"

export interface ICMDataProvider {
  getChains(): Promise<Chain[]>
  getRecentMessages(params?: {
    chainIds?: string[]
    limit?: number
    since?: number
  }): Promise<ICMMessage[]>
  getMessage(id: string): Promise<ICMMessage | null>
}
