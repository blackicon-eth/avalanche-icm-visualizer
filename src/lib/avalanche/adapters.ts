import type { Address, Hex, Log } from "viem"
import type { Chain } from "@/types/chain"
import type { ICMMessage } from "@/types/message"
import type { ICMDataProvider } from "@/lib/providers"
import { getExplorerTxUrl, getPublicClient, type AvalanchePublicClient } from "./rpc"
import {
  decodeTeleporterDeliveryLog,
  decodeTeleporterLog,
  normalizeTeleporterMessage,
  TELEPORTER_ABI,
} from "./teleporter"
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
    const messages = results.flatMap((result) => (result.status === "fulfilled" ? result.value : []))
    const failures = results.filter((result) => result.status === "rejected")
    if (chains.length > 0 && failures.length === chains.length) {
      throw new AggregateError(
        failures.map((result) => result.reason),
        "Unable to fetch live Avalanche messages",
      )
    }
    const enrichedMessages = await this.attachDeliveryEvidence(messages)
    return enrichedMessages
      .filter((message) => params.since === undefined || (message.emittedAt ?? 0) >= normalizeTimestamp(params.since))
      .sort((a, b) => ((b.source.blockNumber ?? BigInt(0)) > (a.source.blockNumber ?? BigInt(0)) ? 1 : -1))
      .slice(0, Math.max(0, params.limit ?? 100))
  }

  private async attachDeliveryEvidence(messages: ICMMessage[]) {
    const messagesByDestination = new Map<string, ICMMessage[]>()
    for (const message of messages) {
      if (message.protocol !== "teleporter" || message.destination.chainId === "unknown") continue
      const destinationMessages = messagesByDestination.get(message.destination.chainId) ?? []
      destinationMessages.push(message)
      messagesByDestination.set(message.destination.chainId, destinationMessages)
    }

    const updates = await Promise.all(
      [...messagesByDestination.entries()].map(async ([chainId, destinationMessages]) => {
        const chain = this.chains.find((item) => item.id === chainId)
        if (!chain || !chain.teleporterAddress) return []
        return this.readDeliveryEvents(chain, destinationMessages)
      }),
    )
    const byMessageId = new Map(updates.flat().map((update) => [update.messageId.toLowerCase(), update]))

    return messages.map((message) => {
      const messageId = message.teleporter?.messageId
      const update = messageId ? byMessageId.get(messageId.toLowerCase()) : undefined
      if (!update) return message
      return {
        ...message,
        status: update.status,
        deliveredAt: update.timestamp,
        destination: {
          ...message.destination,
          txHash: update.txHash,
          blockNumber: update.blockNumber,
          timestamp: update.timestamp,
        },
        teleporter: { ...message.teleporter, relayerAddress: update.relayerAddress },
        explorer: {
          ...message.explorer,
          destinationTx: update.txHash
            ? getExplorerTxUrl(
                this.chains.find((chain) => chain.id === message.destination.chainId)!,
                update.txHash,
              )
            : undefined,
        },
      }
    })
  }

  private async readDeliveryEvents(chain: AvalancheChain, messages: ICMMessage[]) {
    const client = getPublicClient(chain, this.rpcUrl)
    if (!client || !chain.teleporterAddress) return []
    const latest = await client.getBlockNumber()
    const fromBlock = latest > this.recentBlockCount ? latest - this.recentBlockCount : BigInt(0)
    const logs = await client.getLogs({ address: chain.teleporterAddress, fromBlock, toBlock: latest })
    const messageIds = new Set(
      messages.flatMap((message) =>
        message.teleporter?.messageId ? [message.teleporter.messageId.toLowerCase()] : [],
      ),
    )
    const timestamps = await this.readBlockTimestamps(client, logs)
    const deliveries = new Map<
      string,
      {
        messageId: string
        status: ICMMessage["status"]
        relayerAddress?: string
        txHash?: string
        blockNumber?: bigint
        timestamp?: number
      }
    >()

    for (const log of logs) {
      const event = decodeTeleporterDeliveryLog(log)
      if (!event || !messageIds.has(event.messageId.toLowerCase())) continue
      const current = deliveries.get(event.messageId.toLowerCase())
      deliveries.set(event.messageId.toLowerCase(), {
        messageId: event.messageId,
        status: event.type === "executed" ? "delivered" : event.type === "failed" ? "failed" : "relaying",
        relayerAddress: event.type === "received" ? event.relayerAddress : current?.relayerAddress,
        txHash: log.transactionHash ?? current?.txHash,
        blockNumber: log.blockNumber ?? current?.blockNumber,
        timestamp: log.blockNumber == null ? current?.timestamp : timestamps.get(log.blockNumber),
      })
    }
    return [...deliveries.values()]
  }

  async getMessage(id: string) {
    const messages = await this.getRecentMessages({ limit: 500 })
    return messages.find((message) => message.id === id) ?? null
  }

  private async readChain(chain: AvalancheChain, since?: number): Promise<ICMMessage[]> {
    const client = getPublicClient(chain, this.rpcUrl)
    if (!client) throw new Error(`No RPC URL configured for ${chain.id}`)

    const latest = await client.getBlockNumber()
    const fromBlock =
      since === undefined
        ? latest > this.recentBlockCount
          ? latest - this.recentBlockCount
          : BigInt(0)
        : await this.findSinceBlock(client, latest, since)
    const logs = await Promise.all([
      chain.warpMessengerAddress
        ? client.getLogs({
            address: chain.warpMessengerAddress,
            event: WARP_MESSENGER_ABI[0],
            fromBlock,
            toBlock: latest,
          })
        : Promise.resolve([] as Log[]),
      chain.teleporterAddress
        ? client.getLogs({ address: chain.teleporterAddress, event: TELEPORTER_ABI[0], fromBlock, toBlock: latest })
        : Promise.resolve([] as Log[]),
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
      const blocksBack = BigInt(Math.min(Number(this.recentBlockCount), Math.ceil(seconds * 20)))
      return latest > blocksBack ? latest - blocksBack : BigInt(0)
    } catch {
      return latest > this.recentBlockCount ? latest - this.recentBlockCount : BigInt(0)
    }
  }

  private async readBlockTimestamps(client: AvalanchePublicClient, logs: Log[]) {
    const blockNumbers = [...new Set(logs.flatMap((log) => (log.blockNumber == null ? [] : [log.blockNumber])))]
    const blocks = await Promise.all(
      blockNumbers.map(
        async (blockNumber) => [blockNumber, (await client.getBlock({ blockNumber })).timestamp] as const,
      ),
    )
    return new Map(blocks.map(([blockNumber, timestamp]) => [blockNumber, Number(timestamp) * 1000]))
  }

  private normalizeWarpLogs(chain: AvalancheChain, logs: Log[], timestamps: Map<bigint, number>) {
    return logs.flatMap((log) => {
      const event = decodeWarpLog(log)
      if (!event) return []
      return [
        normalizeWarpMessage({
          id: messageId(chain.id, log),
          sourceChainId: chain.id,
          event,
          txHash: log.transactionHash ?? undefined,
          blockNumber: log.blockNumber ?? undefined,
          emittedAt: log.blockNumber == null ? undefined : timestamps.get(log.blockNumber),
          explorerTx: log.transactionHash ? getExplorerTxUrl(chain, log.transactionHash) : undefined,
        }),
      ]
    })
  }

  private normalizeTeleporterLogs(chain: AvalancheChain, logs: Log[], timestamps: Map<bigint, number>) {
    return logs.flatMap((log) => {
      const event = decodeTeleporterLog(log)
      if (!event) return []
      return [
        normalizeTeleporterMessage({
          id: messageId(chain.id, log),
          sourceChainId: chain.id,
          event,
          txHash: log.transactionHash ?? undefined,
          blockNumber: log.blockNumber ?? undefined,
          emittedAt: log.blockNumber == null ? undefined : timestamps.get(log.blockNumber),
          destinationChainId: this.resolveChainId(event.destinationBlockchainId),
          explorerTx: log.transactionHash ? getExplorerTxUrl(chain, log.transactionHash) : undefined,
        }),
      ]
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
