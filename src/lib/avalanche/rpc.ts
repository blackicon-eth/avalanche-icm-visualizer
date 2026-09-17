import {
  createPublicClient,
  http,
  type PublicClient,
  type Transport,
} from "viem"
import type { Chain } from "@/types/chain"
import { env, publicEnv } from "@/lib/config/env"

export type AvalanchePublicClient = PublicClient<Transport>

const clients = new Map<string, AvalanchePublicClient>()

function resolveRpcUrl(chain: Chain, rpcUrl?: string) {
  return rpcUrl ?? chain.rpcUrl ?? publicEnv.NEXT_PUBLIC_AVALANCHE_RPC_URL ?? env.AVALANCHE_RPC_URL
}

/** Returns a cached, read-only viem client. No client is created without an RPC URL. */
export function getPublicClient(chain: Chain, rpcUrl?: string): AvalanchePublicClient | null {
  const url = resolveRpcUrl(chain, rpcUrl)
  if (!url) return null

  const cached = clients.get(url)
  if (cached) return cached

  const client = createPublicClient({ transport: http(url) }) as AvalanchePublicClient
  clients.set(url, client)
  return client
}

export function getExplorerTxUrl(chain: Chain, txHash: string) {
  if (!chain.explorerUrl || !txHash) return undefined
  return `${chain.explorerUrl.replace(/\/$/, "")}/tx/${txHash}`
}

export function clearPublicClientCache() {
  clients.clear()
}
