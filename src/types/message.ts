export type ICMMessageStatus = "observed" | "relaying" | "delivered" | "failed"

export type ICMMessageProtocol = "warp" | "teleporter" | "unknown"

export type ICMMessage = {
  id: string
  protocol: ICMMessageProtocol
  source: {
    chainId: string
    txHash?: string
    blockNumber?: bigint
    timestamp?: number
  }
  destination: {
    chainId: string
    txHash?: string
    blockNumber?: bigint
    timestamp?: number
  }
  status: ICMMessageStatus
  emittedAt?: number
  deliveredAt?: number
  payload: {
    raw?: `0x${string}`
    type?: string
    decoded?: unknown
  }
  warp?: {
    messageId?: string
    sourceChainId?: string
    originSenderAddress?: string
  }
  teleporter?: {
    messageId?: string
    destinationAddress?: string
    relayerAddress?: string
    requiredGasLimit?: bigint
    feeInfo?: unknown
  }
  explorer?: {
    sourceTx?: string
    destinationTx?: string
  }
}
