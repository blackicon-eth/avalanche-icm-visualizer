"use client"

import type { Chain } from "@/types"
import { ChainDetails } from "@/components/chains/ChainDetails"
import { ChainSelector } from "@/components/chains/ChainSelector"

type SidebarProps = {
  chains: readonly Chain[]
  selectedId?: string
  onSelect: (chain: Chain) => void
  className?: string
}

export function Sidebar({ chains, selectedId, onSelect, className }: SidebarProps) {
  const selected = chains.find((chain) => chain.id === selectedId)
  return (
    <aside className={`w-full shrink-0 border-r border-border bg-muted/20 p-4 md:w-72 ${className ?? ""}`}>
      <div className="mb-5 flex items-end justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">01 / chains</p>
          <h2 className="mt-1 text-lg font-semibold">Connected networks</h2>
        </div>
        <span className="font-mono text-xs text-muted-foreground">{chains.length.toString().padStart(2, "0")}</span>
      </div>
      <ChainSelector chains={chains} selectedId={selectedId} onSelect={onSelect} />
      {selected && (
        <div className="mt-6 border-t border-border pt-5">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Selected chain</p>
          <ChainDetails chain={selected} />
        </div>
      )}
    </aside>
  )
}
