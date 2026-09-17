import { decodeEventLog, type Address, type Hex, type Log } from "viem"
import type { ICMMessage } from "@/types/message"

export const TELEPORTER_ABI = [
  {
    type: "event",
    name: "SendCrossChainMessage",
    inputs: [
      { indexed: true, name: "messageID", type: "bytes32" },
      { indexed: true, name: "destinationBlockchainID", type: "bytes32" },
      {
        indexed: false,
        name: "message",
        type: "tuple",
        components: [
          { name: "messageNonce", type: "uint256" },
          { name: "originSenderAddress", type: "address" },
          { name: "destinationBlockchainID", type: "bytes32" },
          { name: "destinationAddress", type: "address" },
          { name: "requiredGasLimit", type: "uint256" },
          { name: "allowedRelayerAddresses", type: "address[]" },
          { name: "receipts", type: "tuple[]", components: [
            { name: "receivedMessageNonce", type: "uint256" },
            { name: "relayerRewardAddress", type: "address" },
          ] },
          { name: "message", type: "bytes" },
        ],
      },
      { indexed: false, name: "feeInfo", type: "tuple", components: [
        { name: "feeTokenAddress", type: "address" },
        { name: "amount", type: "uint256" },
      ] },
    ],
  },
] as const

export type TeleporterMessage = {
  messageNonce: bigint
  originSenderAddress: Address
  destinationBlockchainID: Hex
  destinationAddress: Address
  requiredGasLimit: bigint
  allowedRelayerAddresses: Address[]
  receipts: Array<{ receivedMessageNonce: bigint; relayerRewardAddress: Address }>
  message: Hex
}

export type TeleporterEvent = {
  messageId: Hex
  destinationBlockchainId: Hex
  destinationAddress: Address
  message: Hex
  requiredGasLimit: bigint
  feeInfo: unknown
}

export function decodeTeleporterLog(log: Log): TeleporterEvent | null {
  try {
    const decoded = decodeEventLog({ abi: TELEPORTER_ABI, data: log.data, topics: log.topics })
    if (decoded.eventName !== "SendCrossChainMessage") return null
    const args = decoded.args as {
      messageID: Hex
      destinationBlockchainID: Hex
      message: TeleporterMessage
      feeInfo: unknown
    }
    const message = args.message
    return {
      messageId: args.messageID,
      destinationBlockchainId: args.destinationBlockchainID,
      destinationAddress: message.destinationAddress,
      message: message.message,
      requiredGasLimit: message.requiredGasLimit,
      feeInfo: args.feeInfo,
    }
  } catch {
    return null
  }
}

export function normalizeTeleporterMessage(input: {
  id: string
  sourceChainId: string
  event: TeleporterEvent
  txHash?: string
  blockNumber?: bigint
  emittedAt?: number
  destinationChainId?: string
  explorerTx?: string
}): ICMMessage {
  const emittedAt = normalizeTimestamp(input.emittedAt)
  return {
    id: input.id,
    protocol: "teleporter",
    source: { chainId: input.sourceChainId, txHash: input.txHash, blockNumber: input.blockNumber, timestamp: emittedAt },
    destination: { chainId: input.destinationChainId ?? "unknown" },
    status: "observed",
    emittedAt,
    payload: { raw: input.event.message, type: "teleporter" },
    teleporter: {
      messageId: input.event.messageId,
      destinationAddress: input.event.destinationAddress,
      requiredGasLimit: input.event.requiredGasLimit,
      feeInfo: input.event.feeInfo,
    },
    explorer: input.explorerTx ? { sourceTx: input.explorerTx } : undefined,
  }
}

function normalizeTimestamp(timestamp?: number) {
  if (timestamp === undefined || !Number.isFinite(timestamp)) return undefined
  return timestamp < 1_000_000_000_000 ? timestamp * 1000 : timestamp
}
