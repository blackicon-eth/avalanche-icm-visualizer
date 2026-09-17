"use client"

import type { Chain } from "@/types"
import { ChainBadge } from "./ChainBadge"

type ChainSelectorProps = {
  chains: readonly Chain[]
  selectedId?: string
  onSelect: (chain: Chain) => void
}

export function ChainSelector({ chains, selectedId, onSelect }: ChainSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-1" role="listbox" aria-label="Select chain">
      {chains.map((chain) => (
        <button
          key={chain.id}
          type="button"
          role="option"
          aria-selected={selectedId === chain.id}
          onClick={() => onSelect(chain)}
          className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors ${selectedId === chain.id ? "bg-foreground text-background" : "hover:bg-muted"}`}
        >
          <ChainBadge chain={chain} />
          <span className="font-mono text-[10px] opacity-60">{chain.shortName}</span>
        </button>
      ))}
    </div>
  )
}
