"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Suspense, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { chains } from "@/data/chains"
import { NetworkCanvas } from "@/components/network/NetworkCanvas"
import { MessageDetails } from "@/components/messages/MessageDetails"
import { MessageList } from "@/components/messages/MessageList"
import { MessageFilters, type MessageFilterValues } from "@/components/ui/MessageFilters"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { groupMessages, MESSAGE_RETENTION_LIMIT, useMessages } from "@/hooks/useMessages"

const queryClient = new QueryClient()
const defaultFilters: MessageFilterValues = {
  protocol: "all",
  status: "all",
  time: "all",
  source: "all",
  destination: "all",
}
const protocolValues = ["all", "warp", "teleporter", "unknown"] as const
const statusValues = ["all", "observed", "relaying", "delivered", "failed"] as const
const timeValues = ["all", "hour", "day", "week"] as const
const MESSAGE_PAGE_SIZE = 4

function isProtocol(value: string | null): value is MessageFilterValues["protocol"] {
  return protocolValues.some((option) => option === value)
}

function isStatus(value: string | null): value is MessageFilterValues["status"] {
  return statusValues.some((option) => option === value)
}

function isTime(value: string | null): value is MessageFilterValues["time"] {
  return timeValues.some((option) => option === value)
}

function Visualizer() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [paused, setPaused] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const [messagePage, setMessagePage] = useState(1)
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 5000)
    return () => clearInterval(interval)
  }, [])
  const allChains = chains
  const enabledChainIds = useMemo(() => {
    const chainsParam = params.get("chains")
    const fromUrl = chainsParam?.split(",").filter((id) => allChains.some((chain) => chain.id === id))
    return fromUrl && (fromUrl.length > 0 || chainsParam === "")
      ? fromUrl
      : allChains.filter((chain) => chain.enabledByDefault).map((chain) => chain.id)
  }, [allChains, params])
  const protocol = params.get("protocol")
  const status = params.get("status")
  const time = params.get("time")
  const filters: MessageFilterValues = {
    protocol: isProtocol(protocol) ? protocol : defaultFilters.protocol,
    status: isStatus(status) ? status : defaultFilters.status,
    time: isTime(time) ? time : defaultFilters.time,
    source: params.get("source") || defaultFilters.source,
    destination: params.get("destination") || defaultFilters.destination,
  }
  const { messages, isLoading, isError, refetch } = useMessages({
    chainIds: enabledChainIds,
    paused,
    chains: allChains,
  })
  const visibleMessages = messages.filter((message) => {
    const age = now - (message.emittedAt ?? 0)
    return (
      enabledChainIds.includes(message.source.chainId) &&
      (message.destination.chainId === "unknown" || enabledChainIds.includes(message.destination.chainId)) &&
      (filters.protocol === "all" || message.protocol === filters.protocol) &&
      (filters.status === "all" || message.status === filters.status) &&
      (filters.source === "all" || message.source.chainId === filters.source) &&
      (filters.destination === "all" || message.destination.chainId === filters.destination) &&
      (filters.time === "all" ||
        (filters.time === "hour" ? age <= 3600000 : filters.time === "day" ? age <= 86400000 : age <= 604800000))
    )
  })
  const visibleBatches = useMemo(() => groupMessages(visibleMessages), [visibleMessages])
  const pageCount = Math.max(1, Math.ceil(visibleMessages.length / MESSAGE_PAGE_SIZE))
  const currentPage = Math.min(messagePage, pageCount)
  const paginatedMessages = visibleMessages.slice(
    (currentPage - 1) * MESSAGE_PAGE_SIZE,
    currentPage * MESSAGE_PAGE_SIZE,
  )
  const selectedMessage = messages.find((message) => message.id === params.get("message")) ?? null
  const updateParams = (updates: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params.toString())
    Object.entries(updates).forEach(([key, value]) =>
      key === "chains" && value !== undefined
        ? next.set(key, value)
        : value && value !== "all"
          ? next.set(key, value)
          : next.delete(key),
    )
    router.replace(`${pathname}?${next.toString()}`, { scroll: false })
  }
  const setChains = (ids: string[]) => updateParams({ chains: ids.join(",") })
  const toggleChain = (id: string) =>
    setChains(enabledChainIds.includes(id) ? enabledChainIds.filter((item) => item !== id) : [...enabledChainIds, id])
  return (
    <>
      <div className="desktop-only-gate min-h-screen place-items-center bg-background px-7 text-center text-foreground">
        <div className="max-w-sm">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-[#303944] bg-[#11161c] text-2xl text-[#e84142]">
            &gt;
          </div>
          <p className="mt-7 font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-[#6e7a88]">
            Desktop observatory
          </p>
          <h1 className="mt-3 text-2xl font-extrabold tracking-[-0.04em]">A wider view is required</h1>
          <p className="mt-4 text-sm leading-6 text-[#84909c]">
            The ICM Visualizer is designed for desktop screens. Open it on a display at least 768px wide to explore the
            network map and live message traffic.
          </p>
        </div>
      </div>
      <main className="desktop-visualizer min-h-screen bg-background text-foreground">
        <header
          className="page-enter flex min-h-26 items-center justify-between gap-6 border-b border-border bg-[#080a0d]/86 pl-6 pr-8 py-6"
          style={{ "--entry-delay": "40ms" } as React.CSSProperties}
        >
          <div className="flex items-center gap-4">
            <svg className="h-12 w-12 shrink-0" viewBox="0 0 64 64" role="img" aria-label="Avalanche logo">
              <rect width="64" height="64" rx="14" fill="#0d1014" stroke="#303944" />
              <path d="M32 10 49 48H39l-3.2-8H27l-3 8H14l18-38Zm0 14-3.4 9h6.8L32 24Z" fill="#e84142" />
              <circle cx="50" cy="14" r="4" fill="#f4b860" />
            </svg>
            <div>
              <p className="font-mono text-[11px] font-medium uppercase leading-none tracking-[.2em] text-[#6e7a88]">
                Avalanche / Interchain Messaging
              </p>
              <h1 className="mt-2 text-2xl font-extrabold tracking-[-.04em]">
                ICM <span className="font-medium text-[#9ba5b0]">Visualizer</span>
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3 font-mono text-xs font-medium uppercase tracking-widest text-[#95a0ad]">
            <span
              className={`h-2.5 w-2.5 rounded-full ${paused ? "bg-[#d59d4e] shadow-[0_0_12px_#d59d4e]" : "bg-[#4ce0a0] shadow-[0_0_12px_#4ce0a0]"}`}
            />
            <span>{paused ? "Paused" : "Live"}</span>
          </div>
        </header>
        <div className="grid min-h-[calc(100vh-104px)] grid-cols-1 lg:grid-cols-[292px_minmax(0,1fr)]">
          <aside
            className="page-enter border-b border-border bg-[#0a0d11]/62 px-5 py-8 sm:px-6.5 lg:border-b-0 lg:border-r lg:py-10.5"
            style={{ "--entry-delay": "130ms" } as React.CSSProperties}
          >
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold tracking-[-.03em]">Active chains</h2>
              <span className="pt-0.5 font-mono text-[13px] text-[#8b96a2]">
                {enabledChainIds.length}/{allChains.length}
              </span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-1.5">
              {allChains.map((chain) => (
                <label
                  key={chain.id}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-3 text-sm text-[#aab3bd] transition-colors hover:bg-[#151b21]"
                >
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={enabledChainIds.includes(chain.id)}
                    onChange={() => toggleChain(chain.id)}
                  />
                  <span className="h-4 w-4 rounded border border-[#46515e] peer-checked:border-[#e84142] peer-checked:bg-[#e84142] peer-checked:shadow-[inset_0_0_0_3px_#11151a]" />
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: chain.color }} />
                  <span className="grid gap-0.5">
                    <strong>{chain.shortName}</strong>
                    <small className="font-mono text-[10px] uppercase text-[#64707d]">{chain.metadata?.network}</small>
                  </span>
                </label>
              ))}
            </div>
            <div className="my-8 h-px bg-border" />
            <h2 className="mt-2.5 text-xl font-bold tracking-[-.03em]">Motion control</h2>
            <button
              className="mt-5 flex w-full cursor-pointer items-center gap-3 rounded-md border border-[#303944] bg-[#141a20] p-3.5 text-left text-sm text-[#dce1e6] hover:border-[#e84142] hover:text-white transition-colors"
              type="button"
              onClick={() => setPaused((value) => !value)}
            >
              <span className="w-4 font-mono text-sm text-[#e84142]">{paused ? "▶" : "Ⅱ"}</span>
              {paused ? "Resume network" : "Pause network"}
            </button>
            <div className="my-8 h-px bg-border" />
            <div className="grid gap-2.5">
              <span className="font-mono text-[11px] font-medium uppercase leading-none tracking-[.2em] text-[#6e7a88]">
                Stream health
              </span>
              <strong className="text-sm font-semibold">{isError ? "Connection issue" : "Awaiting RPC traffic"}</strong>
              <small className="text-xs leading-relaxed text-[#687481]">
                Live provider is read-only and uses configured RPC endpoints.
              </small>
            </div>
          </aside>
          <section className="page-enter min-w-0 px-10" style={{ "--entry-delay": "190ms" } as React.CSSProperties}>
            <NetworkCanvas
              chains={allChains}
              enabledChainIds={enabledChainIds}
              messages={visibleMessages}
              batches={visibleBatches}
              loading={isLoading}
              paused={paused}
              onPausedChange={setPaused}
              selectedMessageId={selectedMessage?.id}
              onMessageClick={(message) => updateParams({ message: message.id })}
              className="mt-9 h-[115vw] min-h-110 max-h-175 shadow-[0_24px_80px_rgba(0,0,0,.22)] sm:h-[62vw]"
            />
            <div className="page-enter w-full my-5" style={{ "--entry-delay": "360ms" } as React.CSSProperties}>
              <div className="flex items-end justify-between gap-4">
                <h2 className="mt-2.5 text-xl font-bold tracking-[-.03em] sm:text-2xl">Recent messages</h2>
                <span className="font-mono text-xs text-[#687481]">
                  {MESSAGE_RETENTION_LIMIT} retained · {visibleMessages.length} of {messages.length} events
                </span>
              </div>
              <MessageFilters
                value={filters}
                onChange={(next) => {
                  setMessagePage(1)
                  updateParams({
                    protocol: next.protocol,
                    status: next.status,
                    time: next.time,
                    source: next.source,
                    destination: next.destination,
                  })
                }}
                chains={allChains}
                className="my-7 rounded-lg border border-border bg-[#10151a]/70 p-4 sm:p-5"
              />
              {isLoading ? (
                <div className="flex flex-wrap items-center justify-center gap-2.5 rounded-[10px] border border-dashed border-[#303944] px-6 py-14 text-sm text-[#84909c]">
                  <span className="loading-spinner h-3.75 w-3.75 rounded-full border-2 border-[#39434e] border-t-[#e84142]" />
                  Loading network events...
                </div>
              ) : isError ? (
                <div className="flex flex-wrap items-center justify-center gap-2.5 rounded-[10px] border border-dashed border-[#303944] px-6 py-14 text-sm text-[#84909c]">
                  <strong className="text-[#c6ced6]">Unable to load ICM data.</strong>
                  <button type="button" className="cursor-pointer text-[#e84142] underline" onClick={() => refetch()}>
                    Retry connection
                  </button>
                </div>
              ) : !visibleMessages.length ? (
                <div className="flex flex-wrap items-center justify-center gap-2.5 rounded-[10px] border border-dashed border-[#303944] px-6 py-14 text-sm text-[#84909c]">
                  <strong className="text-[#c6ced6]">No messages match your current filters.</strong>
                  <span>Try enabling another chain or removing a filter.</span>
                </div>
              ) : (
                <>
                  <MessageList
                    messages={paginatedMessages}
                    chains={allChains}
                    selectedMessageId={selectedMessage?.id}
                    onSelectMessage={(message) => updateParams({ message: message.id })}
                  />
                  {pageCount > 1 && (
                    <Pagination className="mt-6">
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href="#activity"
                            aria-disabled={currentPage === 1}
                            className={currentPage === 1 ? "pointer-events-none opacity-40" : undefined}
                            onClick={(event) => {
                              event.preventDefault()
                              setMessagePage((page) => Math.max(1, page - 1))
                            }}
                          />
                        </PaginationItem>
                        {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              href="#activity"
                              isActive={currentPage === page}
                              onClick={(event) => {
                                event.preventDefault()
                                setMessagePage(page)
                              }}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext
                            href="#activity"
                            aria-disabled={currentPage === pageCount}
                            className={currentPage === pageCount ? "pointer-events-none opacity-40" : undefined}
                            onClick={(event) => {
                              event.preventDefault()
                              setMessagePage((page) => Math.min(pageCount, page + 1))
                            }}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  )}
                </>
              )}
            </div>
          </section>
        </div>
        <MessageDetails
          message={selectedMessage}
          chains={allChains}
          onClose={() => updateParams({ message: undefined })}
        />
      </main>
    </>
  )
}

export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <Suspense
        fallback={
          <div className="grid min-h-screen place-items-center bg-background font-mono text-xs uppercase tracking-[.12em] text-[#7f8995]">
            <div className="flex items-center gap-3" role="status" aria-live="polite">
              <span
                className="loading-spinner h-4 w-4 rounded-full border-2 border-[#39434e] border-t-[#e84142]"
                aria-hidden="true"
              />
              Loading network observatory...
            </div>
          </div>
        }
      >
        <Visualizer />
      </Suspense>
    </QueryClientProvider>
  )
}
