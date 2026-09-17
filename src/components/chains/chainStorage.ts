import { z } from "zod"
import type { Chain } from "@/types"

const storageKey = "avalanche-icm-custom-chains"
const customChainSchema = z.object({
  id: z.string().min(2), name: z.string().min(2), shortName: z.string().min(1).max(12), blockchainId: z.string().min(4),
  icon: z.string().optional(), color: z.string().optional(), rpcUrl: z.string().url().optional().or(z.literal("")), explorerUrl: z.string().url().optional().or(z.literal("")),
  enabledByDefault: z.boolean(), metadata: z.object({ description: z.string().optional(), network: z.enum(["mainnet", "fuji", "local"]).optional() }).optional(),
})
const customChainsSchema = z.array(customChainSchema)

export function readCustomChains(): Chain[] {
  if (typeof window === "undefined") return []
  try {
    const parsed = customChainsSchema.safeParse(JSON.parse(window.localStorage.getItem(storageKey) ?? "[]"))
    return parsed.success ? parsed.data : []
  } catch { return [] }
}

export function writeCustomChains(chains: Chain[]) {
  if (typeof window !== "undefined") window.localStorage.setItem(storageKey, JSON.stringify(chains))
}

export { customChainSchema }
