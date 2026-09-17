import type { Chain } from "@/types"
import { ChainBadge } from "./ChainBadge"

type ChainDetailsProps = { chain: Chain; onRemove?: (chain: Chain) => void }

export function ChainDetails({ chain, onRemove }: ChainDetailsProps) {
  return (
    <article className="rounded-xl border border-border bg-background/80 p-4">
      <div className="flex items-start justify-between gap-3">
        <ChainBadge chain={chain} />
        <span className="rounded-full bg-muted px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">
          {chain.metadata?.network ?? "custom"}
        </span>
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        {chain.metadata?.description ?? "Custom Avalanche network"}
      </p>
      <dl className="mt-4 space-y-2 text-xs">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Blockchain ID</dt>
          <dd className="max-w-40 truncate font-mono">{chain.blockchainId}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Explorer</dt>
          <dd className="max-w-40 truncate">{chain.explorerUrl ?? "Not configured"}</dd>
        </div>
      </dl>
      {onRemove && (
        <button
          type="button"
          onClick={() => onRemove(chain)}
          className="mt-4 text-xs font-medium text-red-400 hover:text-red-300"
        >
          Remove custom chain
        </button>
      )}
    </article>
  )
}
