import type { ICMMessage, ICMMessageProtocol, ICMMessageStatus } from "@/types"
import { chains } from "./chains"
import { mockMessages } from "./messages"

let sequence = 25

const progression: ICMMessageStatus[] = ["observed", "relaying", "delivered"]

export function createMockMessage(): ICMMessage {
  const seed = sequence++
  const source = chains[(seed * 3) % chains.length]
  const destination = chains[(seed * 5 + 1) % chains.length]
  const protocol: ICMMessageProtocol = seed % 3 === 0 ? "teleporter" : seed % 5 === 0 ? "unknown" : "warp"
  const timestamp = Date.now()
  const id = `icm-stream-${seed.toString(16).padStart(8, "0")}`
  const base: ICMMessage = {
    id,
    protocol,
    source: { chainId: source.id, txHash: `0x${seed.toString(16).padStart(64, "0")}`, timestamp },
    destination: { chainId: destination.id },
    status: "observed",
    emittedAt: timestamp,
    payload: { type: protocol === "teleporter" ? "TeleporterMessage" : "ERC20Transfer" },
  }
  if (protocol === "warp") base.warp = { messageId: id, sourceChainId: source.id }
  if (protocol === "teleporter") base.teleporter = { messageId: id, requiredGasLimit: BigInt(500000) }
  return base
}

export async function* createMockMessageStream(options: { intervalMs?: number; signal?: AbortSignal } = {}) {
  const intervalMs = options.intervalMs ?? 4000
  while (!options.signal?.aborted) {
    const initial = createMockMessage()
    for (const status of progression) {
      const deliveredAt = status === "delivered" ? (initial.emittedAt ?? Date.now()) + 18_000 : undefined
      yield {
        ...initial,
        status,
        deliveredAt,
        destination: {
          ...initial.destination,
          txHash: deliveredAt ? initial.source.txHash : undefined,
          timestamp: deliveredAt,
        },
      }
      if (status !== "delivered") await new Promise((resolve) => setTimeout(resolve, intervalMs))
    }
  }
}

export { mockMessages }
