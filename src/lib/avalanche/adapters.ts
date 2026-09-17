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
    const results = await Promise.allSettled(chains.map((chain) => this.readChain(chain, params.since)))
    const messages = results.flatMap((result) => result.status === "fulfilled" ? result.value : [])
    const failures = results.filter((result) => result.status === "rejected")
    if (chains.length > 0 && failures.length === chains.length) {
      throw new AggregateError(failures.map((result) => result.reason), "Unable to fetch live Avalanche messages")
    }
    return messages
      .filter((message) => params.since === undefined || (message.emittedAt ?? 0) >= normalizeTimestamp(params.since))
      .sort((a, b) => (b.source.blockNumber ?? BigInt(0)) > (a.source.blockNumber ?? BigInt(0)) ? 1 : -1)
      .slice(0, Math.max(0, params.limit ?? 100))
  }

  async getMessage(id: string) {
    const messages = await this.getRecentMessages({ limit: 500 })
    return messages.find((message) => message.id === id) ?? null
  }

  private async readChain(chain: AvalancheChain, since?: number): Promise<ICMMessage[]> {
    const client = getPublicClient(chain, this.rpcUrl)
    if (!client) throw new Error(`No RPC URL configured for ${chain.id}`)

    const latest = await client.getBlockNumber()
    const fromBlock = since === undefined ? latest > this.recentBlockCount ? latest - this.recentBlockCount : BigInt(0) : await this.findSinceBlock(client, latest, since)
    const logs = await Promise.all([
      chain.warpMessengerAddress ? client.getLogs({ address: chain.warpMessengerAddress, event: WARP_MESSENGER_ABI[0], fromBlock, toBlock: latest }) : Promise.resolve([] as Log[]),
      chain.teleporterAddress ? client.getLogs({ address: chain.teleporterAddress, event: TELEPORTER_ABI[0], fromBlock, toBlock: latest }) : Promise.resolve([] as Log[]),
    ])
    const allLogs = [...logs[0], ...logs[1]]
    const timestamps = await this.readBlockTimestamps(client, allLogs)
    return [
      ...this.normalizeWarpLogs(chain, logs[0], timestamps),
      ...this.normalizeTeleporterLogs(chain, logs[1], timestamps),
    ]
  }

  private async findSinceBlock(client: AvalanchePublicClient, latest: bigint, since: number) {
    try {
      const block = await client.getBlock({ blockTag: "latest" })
      const seconds = Math.max(0, Number(block.timestamp) - normalizeTimestamp(since) / 1000)
      const blocksBack = BigInt(Math.min(
        Number(this.recentBlockCount),
        Math.ceil(seconds * 20),
      ))
      return latest > blocksBack ? latest - blocksBack : BigInt(0)
    } catch {
      return latest > this.recentBlockCount ? latest - this.recentBlockCount : BigInt(0)
    }
  }

  private async readBlockTimestamps(client: AvalanchePublicClient, logs: Log[]) {
    const blockNumbers = [...new Set(logs.flatMap((log) => log.blockNumber == null ? [] : [log.blockNumber]))]
    const blocks = await Promise.all(blockNumbers.map(async (blockNumber) => [blockNumber, (await client.getBlock({ blockNumber })).timestamp] as const))
    return new Map(blocks.map(([blockNumber, timestamp]) => [blockNumber, Number(timestamp) * 1000]))
  }

  private normalizeWarpLogs(chain: AvalancheChain, logs: Log[], timestamps: Map<bigint, number>) {
    return logs.flatMap((log) => {
      const event = decodeWarpLog(log)
      if (!event) return []
      return [normalizeWarpMessage({ id: messageId(chain.id, log), sourceChainId: chain.id, event, txHash: log.transactionHash ?? undefined, blockNumber: log.blockNumber ?? undefined, emittedAt: log.blockNumber == null ? undefined : timestamps.get(log.blockNumber), explorerTx: log.transactionHash ? getExplorerTxUrl(chain, log.transactionHash) : undefined })]
    })
  }

  private normalizeTeleporterLogs(chain: AvalancheChain, logs: Log[], timestamps: Map<bigint, number>) {
    return logs.flatMap((log) => {
      const event = decodeTeleporterLog(log)
      if (!event) return []
      return [normalizeTeleporterMessage({ id: messageId(chain.id, log), sourceChainId: chain.id, event, txHash: log.transactionHash ?? undefined, blockNumber: log.blockNumber ?? undefined, emittedAt: log.blockNumber == null ? undefined : timestamps.get(log.blockNumber), destinationChainId: this.resolveChainId(event.destinationBlockchainId), explorerTx: log.transactionHash ? getExplorerTxUrl(chain, log.transactionHash) : undefined })]
    })
  }

  private resolveChainId(blockchainId: string) {
    return this.chains.find((chain) => chain.blockchainId.toLowerCase() === blockchainId.toLowerCase())?.id ?? "unknown"
  }
}

function normalizeTimestamp(timestamp: number) {
  return timestamp < 1_000_000_000_000 ? timestamp * 1000 : timestamp
}

function messageId(chainId: string, log: Log) {
  return `${chainId}:${log.transactionHash ?? "unknown"}:${log.logIndex ?? 0}`
}
