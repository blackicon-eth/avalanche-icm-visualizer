import type { ICMMessage, ICMMessageProtocol, ICMMessageStatus } from "@/types"
import { chains } from "./chains"

const BASE_TIMESTAMP = 1_790_000_000_000
const addresses = [
  "0x1111111111111111111111111111111111111111",
  "0x2222222222222222222222222222222222222222",
  "0x3333333333333333333333333333333333333333",
]

function hexId(seed: number): string {
  return `0x${seed.toString(16).padStart(64, "0")}`
}

function message(
  seed: number,
  sourceChainId: string,
  destinationChainId: string,
  protocol: ICMMessageProtocol,
  status: ICMMessageStatus,
  ageMinutes: number,
  decoded = true,
): ICMMessage {
  const emittedAt = BASE_TIMESTAMP - ageMinutes * 60_000
  const sourceTx = hexId(seed + 1000)
  const deliveredAt = status === "delivered" ? emittedAt + 18_000 : undefined
  const result: ICMMessage = {
    id: `icm-mock-${seed.toString().padStart(4, "0")}`,
    protocol,
    source: { chainId: sourceChainId, txHash: sourceTx, blockNumber: BigInt(51000000 + seed), timestamp: emittedAt },
    destination: {
      chainId: destinationChainId,
      txHash: deliveredAt ? hexId(seed + 2000) : undefined,
      blockNumber: deliveredAt ? BigInt(52000000 + seed) : undefined,
      timestamp: deliveredAt,
    },
    status,
    emittedAt,
    deliveredAt,
    payload: {
      raw: `0x${seed.toString(16).padStart(8, "0")}`,
      type: protocol === "warp" ? "ERC20Transfer" : "TeleporterMessage",
      decoded: decoded
        ? protocol === "warp"
          ? { asset: "AVAX", amount: `${100 + seed}000000`, recipient: addresses[seed % addresses.length] }
          : { message: "Cross-chain settlement", nonce: seed, gasLimit: 500000 }
        : undefined,
    },
    explorer: { sourceTx },
  }
  if (protocol === "warp") {
    result.warp = { messageId: hexId(seed + 3000), sourceChainId, originSenderAddress: addresses[seed % addresses.length] }
  } else if (protocol === "teleporter") {
    result.teleporter = {
      messageId: hexId(seed + 4000),
      destinationAddress: addresses[(seed + 1) % addresses.length],
      requiredGasLimit: BigInt(350000 + seed * 1000),
      feeInfo: { token: "AVAX", amount: "2500000000000000" },
    }
  }
  return result
}

export const mockMessages: ICMMessage[] = [
  message(1, chains[0].id, chains[2].id, "warp", "delivered", 3),
  message(2, chains[2].id, chains[0].id, "teleporter", "relaying", 5),
  message(3, chains[1].id, chains[3].id, "warp", "observed", 8, false),
  message(4, chains[3].id, chains[4].id, "teleporter", "delivered", 11),
  message(5, chains[4].id, chains[5].id, "warp", "failed", 14, false),
  message(6, chains[5].id, chains[0].id, "teleporter", "delivered", 18),
  message(7, chains[6].id, chains[2].id, "warp", "relaying", 22),
  message(8, chains[7].id, chains[3].id, "unknown", "observed", 26, false),
  message(9, chains[0].id, chains[4].id, "teleporter", "delivered", 31),
  message(10, chains[2].id, chains[5].id, "warp", "delivered", 36),
  message(11, chains[3].id, chains[6].id, "teleporter", "failed", 42),
  message(12, chains[4].id, chains[7].id, "warp", "observed", 49, false),
  message(13, chains[5].id, chains[1].id, "teleporter", "relaying", 57),
  message(14, chains[6].id, chains[0].id, "warp", "delivered", 65),
  message(15, chains[7].id, chains[2].id, "teleporter", "delivered", 74),
  message(16, chains[0].id, chains[3].id, "unknown", "observed", 84, false),
  message(17, chains[1].id, chains[4].id, "warp", "failed", 95),
  message(18, chains[2].id, chains[6].id, "teleporter", "delivered", 107),
  message(19, chains[3].id, chains[7].id, "warp", "relaying", 120),
  message(20, chains[4].id, chains[0].id, "teleporter", "delivered", 134),
  message(21, chains[5].id, chains[3].id, "warp", "observed", 149, false),
  message(22, chains[6].id, chains[1].id, "teleporter", "delivered", 165),
  message(23, chains[7].id, chains[4].id, "warp", "failed", 182),
  message(24, chains[0].id, chains[5].id, "teleporter", "delivered", 200),
]
