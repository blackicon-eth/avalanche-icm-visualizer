"use client"

import type { Chain } from "@/types"
import { ChainBadge } from "./ChainBadge"

type ChainSelectorProps = {
  chains: readonly Chain[]
  selectedId?: string
  onSelect: (chain: Chain) => void
  onAddChain?: () => void
}

export function ChainSelector({ chains, selectedId, onSelect, onAddChain }: ChainSelectorProps) {
  return (
    <div className="space-y-1" role="listbox" aria-label="Select chain">
      {chains.map((chain) => (
        <button
          key={chain.id}
          type="button"
          role="option"
          aria-selected={selectedId === chain.id}
          onClick={() => onSelect(chain)}
          className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors ${selectedId === chain.id ? "bg-foreground text-background" : "hover:bg-muted"}`}
        >
          <ChainBadge chain={chain} />
          <span className="font-mono text-[10px] opacity-60">{chain.shortName}</span>
        </button>
      ))}
      {onAddChain && (
        <button
          type="button"
          onClick={onAddChain}
          className="mt-3 flex w-full items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2.5 text-xs font-semibold text-muted-foreground hover:border-foreground hover:text-foreground"
        >
          <span className="text-lg leading-none">+</span> Add custom chain
        </button>
      )}
    </div>
  )
}
