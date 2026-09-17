"use client"

import type { Chain, ICMMessage } from "@/types"
import { MessageStatus } from "./MessageStatus"

function shortHash(value?: string) {
  if (!value) return "No transaction recorded"
  return `${value.slice(0, 8)}…${value.slice(-6)}`
}

function chainName(id: string, chains?: Chain[]) {
  return chains?.find((chain) => chain.id === id)?.shortName ?? id
}

export type MessageListProps = {
  messages: ICMMessage[]
  chains?: Chain[]
  selectedMessageId?: string
  onSelectMessage?: (message: ICMMessage) => void
}

export function MessageList({ messages, chains, selectedMessageId, onSelectMessage }: MessageListProps) {
  if (!messages.length) {
    return <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center" role="status"><p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">No messages</p><p className="mt-2 text-sm text-muted-foreground">Cross-chain activity will appear here when available.</p></div>
  }

  return (
    <div className="space-y-2" aria-label="ICM messages">
      {messages.map((message) => {
        const selected = selectedMessageId === message.id
        return <button key={message.id} type="button" onClick={() => onSelectMessage?.(message)} aria-pressed={selected} className={`group w-full rounded-xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 ${selected ? "border-foreground/40 bg-muted/70" : "border-border bg-background/50 hover:border-foreground/25 hover:bg-muted/40"}`}>
          <div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="truncate font-mono text-xs font-medium text-foreground">{message.id}</p><p className="mt-2 text-sm"><span className="font-medium">{chainName(message.source.chainId, chains)}</span><span className="mx-2 text-muted-foreground" aria-hidden="true">→</span><span className="font-medium">{chainName(message.destination.chainId, chains)}</span></p></div><MessageStatus status={message.status} compact /></div>
          <div className="mt-3 flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground"><span>{message.protocol} / {shortHash(message.source.txHash)}</span><span>{message.source.blockNumber ? `Block ${message.source.blockNumber.toString()}` : "Block unknown"}</span></div>
        </button>
      })}
    </div>
  )
}
