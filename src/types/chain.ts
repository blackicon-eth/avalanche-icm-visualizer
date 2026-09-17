export type Chain = {
  id: string
  name: string
  shortName: string
  blockchainId: string
  icon?: string
  color?: string
  rpcUrl?: string
  explorerUrl?: string
  enabledByDefault: boolean
  metadata?: {
    description?: string
    network?: "mainnet" | "fuji" | "local"
  }
}
