"use client"

import { useState, type ReactNode } from "react"
import type { Chain } from "@/types"
import { Header } from "./Header"
import { Sidebar } from "./Sidebar"
import type { VisualizationMode } from "@/components/ui/ModeControl"

type AppShellProps = {
  chains: readonly Chain[]
  children: ReactNode
  selectedChainId?: string
  onChainSelect?: (chain: Chain) => void
}

export function AppShell({ chains, children, selectedChainId, onChainSelect }: AppShellProps) {
  const [live, setLive] = useState(true)
  const [mode, setMode] = useState<VisualizationMode>("topology")
  const [selected, setSelected] = useState(selectedChainId ?? chains.find((chain) => chain.enabledByDefault)?.id)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const selectChain = (chain: Chain) => {
    setSelected(chain.id)
    setSidebarOpen(false)
    onChainSelect?.(chain)
  }
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header
        live={live}
        onLiveChange={setLive}
        mode={mode}
        onModeChange={setMode}
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
      />
      <div className="relative flex min-h-[calc(100vh-4rem)]">
        <div
          className={`${sidebarOpen ? "block" : "hidden"} absolute inset-y-0 left-0 z-20 bg-background md:relative md:block`}
        >
          <Sidebar chains={chains} selectedId={selected} onSelect={selectChain} />
        </div>
        <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}
