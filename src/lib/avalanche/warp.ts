import { decodeAbiParameters, decodeEventLog, type Hex, type Log } from "viem"
import type { ICMMessage } from "@/types/message"

// Keep protocol ABIs here so consumers never decode raw logs themselves.
export const WARP_MESSENGER_ABI = [
  {
    type: "event",
    name: "SendWarpMessage",
    inputs: [
      { indexed: true, name: "messageID", type: "bytes32" },
      { indexed: false, name: "payload", type: "bytes" },
    ],
  },
] as const

export type WarpEvent = {
  messageId: Hex
  payload: Hex
  sourceChainId?: Hex
  originSenderAddress?: string
}

export function decodeWarpLog(log: Log): WarpEvent | null {
  try {
    const decoded = decodeEventLog({ abi: WARP_MESSENGER_ABI, data: log.data, topics: log.topics })
    if (decoded.eventName !== "SendWarpMessage") return null
    const args = decoded.args as { messageID: Hex; payload: Hex }
    const metadata = extractWarpMetadata(args.payload)
    return {
      messageId: args.messageID,
      payload: args.payload,
      sourceChainId: metadata?.sourceChainId,
      originSenderAddress: metadata?.originSenderAddress,
    }
  } catch {
    return null
  }
}

function extractWarpMetadata(payload: Hex) {
  // Unsigned Warp messages are ABI encoded as source blockchain ID, sender, payload.
  try {
    const [sourceChainId, originSenderAddress] = decodeAbiParameters(
      [{ type: "bytes32" }, { type: "address" }, { type: "bytes" }],
      payload,
    )
    return { sourceChainId, originSenderAddress }
  } catch {
    return undefined
  }
}

export function normalizeWarpMessage(input: {
  id: string
  sourceChainId: string
  event: WarpEvent
  txHash?: string
  blockNumber?: bigint
  emittedAt?: number
  explorerTx?: string
}): ICMMessage {
  const emittedAt = normalizeTimestamp(input.emittedAt)
  return {
    id: input.id,
    protocol: "warp",
    source: {
      chainId: input.sourceChainId,
      txHash: input.txHash,
      blockNumber: input.blockNumber,
      timestamp: emittedAt,
    },
    destination: { chainId: "unknown" },
    status: "observed",
    emittedAt,
    payload: { raw: input.event.payload, type: "warp" },
    warp: {
      messageId: input.event.messageId,
      sourceChainId: input.event.sourceChainId,
      originSenderAddress: input.event.originSenderAddress,
    },
    explorer: input.explorerTx ? { sourceTx: input.explorerTx } : undefined,
  }
}

function normalizeTimestamp(timestamp?: number) {
  if (timestamp === undefined || !Number.isFinite(timestamp)) return undefined
  return timestamp < 1_000_000_000_000 ? timestamp * 1000 : timestamp
}
