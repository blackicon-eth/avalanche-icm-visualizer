"use client"

import { useState } from "react"
import type { Chain } from "@/types"
import { AddChainDialog } from "@/components/chains/AddChainDialog"
import { ChainDetails } from "@/components/chains/ChainDetails"
import { ChainSelector } from "@/components/chains/ChainSelector"
import { readCustomChains, writeCustomChains } from "@/components/chains/chainStorage"

type SidebarProps = {
  chains: readonly Chain[]
  selectedId?: string
  onSelect: (chain: Chain) => void
  className?: string
}

export function Sidebar({ chains, selectedId, onSelect, className }: SidebarProps) {
  const [customChains, setCustomChains] = useState<Chain[]>(() => readCustomChains())
  const [dialogOpen, setDialogOpen] = useState(false)
  const selected = [...chains, ...customChains].find((chain) => chain.id === selectedId)
  const allChains = [...chains, ...customChains]
  const addChain = (chain: Chain) => {
    const next = [...customChains, chain]
    setCustomChains(next)
    writeCustomChains(next)
    onSelect(chain)
  }
  const removeChain = (chain: Chain) => {
    const next = customChains.filter((item) => item.id !== chain.id)
    setCustomChains(next)
    writeCustomChains(next)
  }
  return (
    <aside className={`w-full shrink-0 border-r border-border bg-muted/20 p-4 md:w-72 ${className ?? ""}`}>
      <div className="mb-5 flex items-end justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">01 / chains</p>
          <h2 className="mt-1 text-lg font-semibold">Connected networks</h2>
        </div>
        <span className="font-mono text-xs text-muted-foreground">{allChains.length.toString().padStart(2, "0")}</span>
      </div>
      <ChainSelector
        chains={allChains}
        selectedId={selectedId}
        onSelect={onSelect}
        onAddChain={() => setDialogOpen(true)}
      />
      {selected && (
        <div className="mt-6 border-t border-border pt-5">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Selected chain</p>
          <ChainDetails
            chain={selected}
            onRemove={customChains.some((chain) => chain.id === selected.id) ? removeChain : undefined}
          />
        </div>
      )}
      <AddChainDialog open={dialogOpen} onOpenChange={setDialogOpen} onAdd={addChain} />
    </aside>
  )
}
