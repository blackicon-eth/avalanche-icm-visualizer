"use client"

import { AnimatePresence, motion } from "motion/react"
import type { Chain, ICMMessage } from "@/types"
import { getExplorerTxUrl } from "@/lib/avalanche/rpc"
import { MessageStatus } from "./MessageStatus"
import { MessageTimeline } from "./MessageTimeline"
import { useEffect, useRef, useState } from "react"

function display(value: unknown) {
  if (typeof value === "bigint") return value.toString()
  if (typeof value === "string") return value
  if (value == null) return "Not recorded"
  try { return JSON.stringify(value, (_, item) => typeof item === "bigint" ? item.toString() : item, 2) } catch { return String(value) }
}

function short(value?: string) { return value ? `${value.slice(0, 12)}…${value.slice(-10)}` : "Not recorded" }

function CopyButton({ value, label = "Copy" }: { value?: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  return <button type="button" disabled={!value} aria-label={`${label}${value ? " value" : " (unavailable)"}`} onClick={async () => { if (!value) return; await navigator.clipboard.writeText(value); setCopied(true); window.setTimeout(() => setCopied(false), 1400) }} className="rounded-md border border-border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground transition hover:border-foreground/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50">{copied ? "Copied" : label}</button>
}

function Field({ label, value, copyValue }: { label: string; value?: string; copyValue?: string }) {
  return <div className="min-w-0"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p><div className="mt-1 flex items-start gap-2"><p className="min-w-0 break-all text-xs leading-5">{value || "Not recorded"}</p>{copyValue && <CopyButton value={copyValue} />}</div></div>
}

export type MessageDetailsProps = { message?: ICMMessage | null; chains?: Chain[]; onClose?: () => void }

export function MessageDetails({ message, chains, onClose }: MessageDetailsProps) {
  const [open, setOpen] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const source = chains?.find((chain) => chain.id === message?.source.chainId)
  const destination = chains?.find((chain) => chain.id === message?.destination.chainId)
  const sourceTx = message?.explorer?.sourceTx ?? (message?.source.txHash && source ? getExplorerTxUrl(source, message.source.txHash) : undefined)
  const destinationTx = message?.explorer?.destinationTx ?? (message?.destination.txHash && destination ? getExplorerTxUrl(destination, message.destination.txHash) : undefined)

  useEffect(() => {
    if (!message) return
    closeButtonRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose?.()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [message, onClose])

  return <AnimatePresence>{message && <motion.aside initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 32 }} transition={{ duration: 0.22, ease: "easeOut" }} role="dialog" aria-modal="true" aria-labelledby="message-details-title" className="fixed inset-y-0 right-0 z-40 flex w-full max-w-xl flex-col border-l border-border bg-background shadow-2xl shadow-black/10 sm:w-[min(92vw,34rem)]">
    <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-5"><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Message detail</p><h2 id="message-details-title" className="mt-2 break-all font-mono text-sm font-semibold">{message.id}</h2></div><button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Close message details" className="rounded-lg border border-border px-3 py-2 text-lg leading-none text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50">×</button></header>
    <div className="flex-1 space-y-7 overflow-y-auto px-6 py-6"><div className="flex flex-wrap items-center gap-2"><MessageStatus status={message.status} /><span className="rounded-full border border-border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{message.protocol}</span></div>
      <div className="grid grid-cols-2 gap-5"><Field label="Source" value={source?.name ?? message.source.chainId} /><Field label="Destination" value={destination?.name ?? message.destination.chainId} /><Field label="Source transaction" value={short(message.source.txHash)} copyValue={message.source.txHash} /><Field label="Destination transaction" value={short(message.destination.txHash)} copyValue={message.destination.txHash} /></div>
      <MessageTimeline message={message} />
       <div className="border-t border-border pt-5"><button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="flex w-full items-center justify-between text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50"><span><span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Technical record</span><span className="mt-1 block text-sm font-medium">Protocol identifiers & payload</span></span><span className="text-muted-foreground" aria-hidden="true">{open ? "−" : "+"}</span></button>{open && <div className="mt-5 space-y-5"><div className="grid grid-cols-2 gap-5"><Field label="Message ID" value={message.id} copyValue={message.id} /><Field label="Warp / Teleporter ID" value={message.warp?.messageId ?? message.teleporter?.messageId} copyValue={message.warp?.messageId ?? message.teleporter?.messageId} /><Field label="Source tx hash" value={message.source.txHash} copyValue={message.source.txHash} /><Field label="Destination tx hash" value={message.destination.txHash} copyValue={message.destination.txHash} /></div><Field label="Payload type" value={message.payload.type} /><div><div className="flex items-center justify-between"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Raw payload</p><CopyButton value={message.payload.raw} /></div><pre className="mt-2 max-h-36 overflow-auto rounded-lg bg-muted p-3 font-mono text-[11px] leading-5">{message.payload.raw ?? "Not recorded"}</pre></div><div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Decoded payload</p><pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-muted p-3 font-mono text-[11px] leading-5">{display(message.payload.decoded)}</pre></div></div>}</div>
      {sourceTx || destinationTx ? <div className="flex flex-wrap gap-3 border-t border-border pt-5">{sourceTx && <a href={sourceTx} target="_blank" rel="noreferrer" className="text-xs font-medium underline decoration-border underline-offset-4 hover:decoration-foreground">Open source transaction ↗</a>}{destinationTx && <a href={destinationTx} target="_blank" rel="noreferrer" className="text-xs font-medium underline decoration-border underline-offset-4 hover:decoration-foreground">Open destination transaction ↗</a>}</div> : null}</div>
  </motion.aside>}</AnimatePresence>
}
