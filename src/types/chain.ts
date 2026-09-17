export type Chain = {
  id: string
  name: string
  shortName: string
  blockchainId: string
  icon?: string
  color?: string
  rpcUrl?: string
  explorerUrl?: string
  warpMessengerAddress?: `0x${string}`
  teleporterAddress?: `0x${string}`
  enabledByDefault: boolean
  metadata?: {
    description?: string
    network?: "mainnet"
  }
}
