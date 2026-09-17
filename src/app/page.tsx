"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Suspense, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { chains } from "@/data/chains"
import { AddChainDialog } from "@/components/chains/AddChainDialog"
import { readCustomChains, writeCustomChains } from "@/components/chains/chainStorage"
import { NetworkCanvas } from "@/components/network/NetworkCanvas"
import { NetworkLegend } from "@/components/network/NetworkLegend"
import { MessageDetails } from "@/components/messages/MessageDetails"
import { MessageList } from "@/components/messages/MessageList"
import { MessageFilters, type MessageFilterValues } from "@/components/ui/MessageFilters"
import type { AnimationSpeed } from "@/hooks/useAnimationClock"
import { groupMessages, useMessages, type DataMode } from "@/hooks/useMessages"
import type { Chain } from "@/types"

const queryClient = new QueryClient()
const defaultFilters: MessageFilterValues = { protocol: "all", status: "all", time: "all", source: "all", destination: "all" }

function Visualizer() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [paused, setPaused] = useState(false)
  const [speed, setSpeed] = useState<AnimationSpeed>(1)
  const [customChains, setCustomChains] = useState<Chain[]>(() => readCustomChains())
  const [addChainOpen, setAddChainOpen] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const mode = (params.get("mode") === "live" ? "live" : "mock") as DataMode
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 5000)
    return () => clearInterval(interval)
  }, [])
  const allChains = useMemo(() => [...chains, ...customChains.filter((custom) => !chains.some((chain) => chain.id === custom.id))], [customChains])
  const enabledChainIds = useMemo(() => {
    const fromUrl = params.get("chains")?.split(",").filter((id) => allChains.some((chain) => chain.id === id))
    return fromUrl?.length ? fromUrl : allChains.filter((chain) => chain.enabledByDefault).map((chain) => chain.id)
  }, [allChains, params])
  const filters: MessageFilterValues = {
    protocol: (params.get("protocol") as MessageFilterValues["protocol"]) || defaultFilters.protocol,
    status: (params.get("status") as MessageFilterValues["status"]) || defaultFilters.status,
    time: (params.get("time") as MessageFilterValues["time"]) || defaultFilters.time,
    source: params.get("source") || defaultFilters.source,
    destination: params.get("destination") || defaultFilters.destination,
  }
  const { messages, isLoading, isError, refetch } = useMessages({ mode, chainIds: enabledChainIds, paused, chains: allChains })
  const visibleMessages = messages.filter((message) => {
    const age = now - (message.emittedAt ?? 0)
    return enabledChainIds.includes(message.source.chainId) && enabledChainIds.includes(message.destination.chainId) &&
      (filters.protocol === "all" || message.protocol === filters.protocol) &&
      (filters.status === "all" || message.status === filters.status) &&
      (filters.source === "all" || message.source.chainId === filters.source) &&
      (filters.destination === "all" || message.destination.chainId === filters.destination) &&
      (filters.time === "all" || (filters.time === "hour" ? age <= 3600000 : filters.time === "day" ? age <= 86400000 : age <= 604800000))
  })
  const visibleBatches = useMemo(() => groupMessages(visibleMessages), [visibleMessages])
  const selectedMessage = messages.find((message) => message.id === params.get("message")) ?? null
  const updateParams = (updates: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params.toString())
    Object.entries(updates).forEach(([key, value]) => value && value !== "all" ? next.set(key, value) : next.delete(key))
    router.replace(`${pathname}?${next.toString()}`, { scroll: false })
  }
  const setChains = (ids: string[]) => updateParams({ chains: ids.join(",") })
  const toggleChain = (id: string) => setChains(enabledChainIds.includes(id) ? enabledChainIds.filter((item) => item !== id) : [...enabledChainIds, id])
  const addChain = (chain: Chain) => {
    const next = [...customChains.filter((item) => item.id !== chain.id), chain]
    setCustomChains(next)
    writeCustomChains(next)
    setChains([...enabledChainIds, chain.id])
  }

  return <main className="min-h-screen bg-background text-foreground">
    <header className="site-header"><div><p className="eyebrow">AVALANCHE / INTERCHAIN MESSAGING</p><h1>ICM <span>Visualizer</span></h1></div><div className="header-meta"><span className={`status-light ${paused ? "is-paused" : ""}`} /><span>{paused ? "PAUSED" : mode === "live" ? "LIVE PROVIDER" : "MOCK STREAM"}</span><button type="button" className="mode-button" onClick={() => updateParams({ mode: mode === "mock" ? "live" : "mock" })}>{mode === "mock" ? "Switch to live" : "Use mock data"}</button></div></header>
    <div className="workspace">
      <aside className="control-rail">
         <div className="rail-heading"><div><p className="eyebrow">01 / NETWORKS</p><h2>Active chains</h2></div><span className="count-badge">{enabledChainIds.length}/{allChains.length}</span></div>
         <div className="chain-toggles">{allChains.map((chain) => <label key={chain.id} className="chain-toggle"><input type="checkbox" checked={enabledChainIds.includes(chain.id)} onChange={() => toggleChain(chain.id)} /><span className="checkbox" /><span className="chain-dot" style={{ backgroundColor: chain.color }} /><span className="chain-label"><strong>{chain.shortName}</strong><small>{chain.metadata?.network}</small></span></label>)}</div>
         <button type="button" className="pause-button" onClick={() => setAddChainOpen(true)}><span>+</span>Add custom chain</button>
         <AddChainDialog open={addChainOpen} onOpenChange={setAddChainOpen} onAdd={addChain} />
        <div className="rail-divider" />
        <div className="rail-heading"><div><p className="eyebrow">02 / SIGNAL</p><h2>Motion control</h2></div></div>
        <button className="pause-button" type="button" onClick={() => setPaused((value) => !value)}><span>{paused ? "▶" : "Ⅱ"}</span>{paused ? "Resume network" : "Pause network"}</button>
        <div className="speed-row"><span>Playback speed</span><div>{([0.5, 1, 2, 4] as AnimationSpeed[]).map((value) => <button key={value} type="button" className={speed === value ? "selected" : ""} onClick={() => setSpeed(value)}>{value}×</button>)}</div></div>
        <div className="rail-divider" />
        <div className="rail-foot"><span className="eyebrow">STREAM HEALTH</span><strong>{isError ? "Connection issue" : mode === "live" ? "Awaiting RPC traffic" : "Polling every 5s"}</strong><small>{mode === "live" ? "Live provider is read-only and uses configured RPC endpoints." : "Mock provider generates new observed events."}</small></div>
      </aside>
      <section className="network-column"><div className="section-intro"><div><p className="eyebrow">NETWORK TOPOLOGY</p><h2>Messages in motion</h2><p>Independent Avalanche L1s, connected by observed ICM traffic.</p></div><div className="telemetry"><strong>{visibleMessages.length.toString().padStart(2, "0")}</strong><span>visible events</span></div></div>
            <NetworkCanvas chains={allChains} enabledChainIds={enabledChainIds} messages={visibleMessages} batches={visibleBatches} paused={paused} speed={speed} onPausedChange={setPaused} onSpeedChange={setSpeed} selectedMessageId={selectedMessage?.id} onMessageClick={(message) => updateParams({ message: message.id })} className="network-hero" />
         <div className="network-caption"><NetworkLegend /><span>{visibleBatches.length} active routes · click a particle to inspect the evidence trail</span></div>
         <div className="activity-section"><div className="activity-heading"><div><p className="eyebrow">03 / ACTIVITY LOG</p><h2>Recent messages</h2></div><span>{visibleMessages.length} of {messages.length} events</span></div><MessageFilters value={filters} onChange={(next) => updateParams({ protocol: next.protocol, status: next.status, time: next.time, source: next.source, destination: next.destination })} chains={allChains} className="filter-bar" />{isLoading ? <div className="state-panel"><span className="loader" />Loading network events…</div> : isError ? <div className="state-panel"><strong>Unable to load ICM data.</strong><button type="button" onClick={() => refetch()}>Retry connection</button></div> : !visibleMessages.length ? <div className="state-panel"><strong>No messages match your current filters.</strong><span>Try enabling another chain or removing a filter.</span></div> : <MessageList messages={visibleMessages} chains={allChains} selectedMessageId={selectedMessage?.id} onSelectMessage={(message) => updateParams({ message: message.id })} />}</div>
      </section>
    </div>
      <MessageDetails message={selectedMessage} chains={allChains} onClose={() => updateParams({ message: undefined })} />
  </main>
}

export default function Home() { return <QueryClientProvider client={queryClient}><Suspense fallback={<div className="page-loading">Loading network observatory…</div>}><Visualizer /></Suspense></QueryClientProvider> }
