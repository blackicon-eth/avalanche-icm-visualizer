import type { Address, Hex, Log } from "viem"
import type { Chain } from "@/types/chain"
import type { ICMMessage } from "@/types/message"
import type { ICMDataProvider } from "@/lib/providers"
import { getExplorerTxUrl, getPublicClient, type AvalanchePublicClient } from "./rpc"
import { decodeTeleporterLog, normalizeTeleporterMessage, TELEPORTER_ABI } from "./teleporter"
import { decodeWarpLog, normalizeWarpMessage, WARP_MESSENGER_ABI } from "./warp"

export type AvalancheChain = Chain & {
  warpMessengerAddress?: Address
  teleporterAddress?: Address
}

export type AvalancheICMDataProviderOptions = {
  chains?: AvalancheChain[]
  rpcUrl?: string
  recentBlockCount?: bigint
}

export class AvalancheICMDataProvider implements ICMDataProvider {
  private readonly chains: AvalancheChain[]
  private readonly rpcUrl?: string
  private readonly recentBlockCount: bigint

  constructor(options: AvalancheICMDataProviderOptions = {}) {
    this.chains = options.chains ?? []
    this.rpcUrl = options.rpcUrl
    this.recentBlockCount = options.recentBlockCount ?? BigInt(2_000)
  }

  async getChains() {
    return this.chains
  }

  async getRecentMessages(params: { chainIds?: string[]; limit?: number; since?: number } = {}) {
    const chains = this.chains.filter((chain) => !params.chainIds || params.chainIds.includes(chain.id))
    const messages = (await Promise.all(chains.map((chain) => this.readChain(chain, params.since)))).flat()
    return messages
      .filter((message) => !params.since || (message.emittedAt ?? 0) >= params.since)
      .sort((a, b) => (b.source.blockNumber ?? BigInt(0)) > (a.source.blockNumber ?? BigInt(0)) ? 1 : -1)
      .slice(0, Math.max(0, params.limit ?? 100))
  }

  async getMessage(id: string) {
    const messages = await this.getRecentMessages({ limit: 500 })
    return messages.find((message) => message.id === id) ?? null
  }

  private async readChain(chain: AvalancheChain, since?: number): Promise<ICMMessage[]> {
    const client = getPublicClient(chain, this.rpcUrl)
    if (!client) return []

    try {
      const latest = await client.getBlockNumber()
      const fromBlock = since ? await this.findSinceBlock(client, latest, since) : latest > this.recentBlockCount ? latest - this.recentBlockCount : BigInt(0)
      const logs = await Promise.all([
        chain.warpMessengerAddress ? client.getLogs({ address: chain.warpMessengerAddress, event: WARP_MESSENGER_ABI[0], fromBlock, toBlock: latest }) : Promise.resolve([] as Log[]),
        chain.teleporterAddress ? client.getLogs({ address: chain.teleporterAddress, event: TELEPORTER_ABI[0], fromBlock, toBlock: latest }) : Promise.resolve([] as Log[]),
      ])
      return [...this.normalizeWarpLogs(chain, logs[0]), ...this.normalizeTeleporterLogs(chain, logs[1])]
    } catch {
      return []
    }
  }

  private async findSinceBlock(client: AvalanchePublicClient, latest: bigint, since: number) {
    try {
      const block = await client.getBlock({ blockTag: "latest" })
      const seconds = Math.max(0, Number(block.timestamp) - since)
      return latest > BigInt(seconds * 20) ? latest - BigInt(seconds * 20) : BigInt(0)
    } catch {
      return latest > this.recentBlockCount ? latest - this.recentBlockCount : BigInt(0)
    }
  }

  private normalizeWarpLogs(chain: AvalancheChain, logs: Log[]) {
    return logs.flatMap((log) => {
      const event = decodeWarpLog(log)
      if (!event) return []
      return [normalizeWarpMessage({ id: messageId(chain.id, log), sourceChainId: chain.id, event, txHash: log.transactionHash ?? undefined, blockNumber: log.blockNumber ?? undefined, explorerTx: log.transactionHash ? getExplorerTxUrl(chain, log.transactionHash) : undefined })]
    })
  }

  private normalizeTeleporterLogs(chain: AvalancheChain, logs: Log[]) {
    return logs.flatMap((log) => {
      const event = decodeTeleporterLog(log)
      if (!event) return []
      return [normalizeTeleporterMessage({ id: messageId(chain.id, log), sourceChainId: chain.id, event, txHash: log.transactionHash ?? undefined, blockNumber: log.blockNumber ?? undefined, explorerTx: log.transactionHash ? getExplorerTxUrl(chain, log.transactionHash) : undefined })]
    })
  }
}

function messageId(chainId: string, log: Log) {
  return `${chainId}:${log.transactionHash ?? "unknown"}:${log.logIndex ?? 0}`
}
