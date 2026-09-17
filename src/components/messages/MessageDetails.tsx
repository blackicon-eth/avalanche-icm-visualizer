"use client"

import { AnimatePresence, motion } from "motion/react"
import { Check, Copy, ExternalLink } from "lucide-react"
import type { Chain, ICMMessage } from "@/types"
import { getExplorerTxUrl } from "@/lib/avalanche/rpc"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { MessageStatus } from "./MessageStatus"
import { MessageTimeline } from "./MessageTimeline"
import { useEffect, useRef, useState } from "react"

function short(value?: string) {
  return value ? `${value.slice(0, 12)}…${value.slice(-10)}` : "Not recorded"
}

function CopyButton({ value, label = "Copy" }: { value?: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      disabled={!value}
      aria-label={`${label}${value ? " value" : " (unavailable)"}`}
      onClick={async () => {
        if (!value) return
        await navigator.clipboard.writeText(value)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1400)
      }}
      title={copied ? "Copied" : label}
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:border-foreground/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5" aria-hidden="true" />
      ) : (
        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
      )}
    </button>
  )
}

function Field({
  label,
  value,
  copyValue,
  linkHref,
}: {
  label: string
  value?: string
  copyValue?: string
  linkHref?: string
}) {
  return (
    <div className="min-w-0">
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <div className="mt-2 flex items-start gap-2">
        <p className="min-w-0 break-all text-sm leading-6">{value || "Not recorded"}</p>
        {copyValue && <CopyButton value={copyValue} />}
        {linkHref && (
          <a
            href={linkHref}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open ${label}`}
            className="shrink-0 rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        )}
      </div>
    </div>
  )
}

export type MessageDetailsProps = { message?: ICMMessage | null; chains?: Chain[]; onClose?: () => void }

export function MessageDetails({ message, chains, onClose }: MessageDetailsProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const source = chains?.find((chain) => chain.id === message?.source.chainId)
  const destination = chains?.find((chain) => chain.id === message?.destination.chainId)
  const sourceTx =
    message?.explorer?.sourceTx ??
    (message?.source.txHash && source ? getExplorerTxUrl(source, message.source.txHash) : undefined)
  const destinationTx =
    message?.explorer?.destinationTx ??
    (message?.destination.txHash && destination ? getExplorerTxUrl(destination, message.destination.txHash) : undefined)

  useEffect(() => {
    if (!message) return
    closeButtonRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose?.()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [message, onClose])

  return (
    <AnimatePresence>
      {message && (
        <motion.aside
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 360, damping: 36, mass: 0.8 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="message-details-title"
          className="fixed inset-y-0 right-0 z-40 flex w-full max-w-2xl flex-col border-l border-border bg-background shadow-2xl shadow-black/10 sm:w-[min(94vw,42rem)]"
        >
          <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Message detail</p>
              <h2 id="message-details-title" className="mt-2 break-all font-mono text-sm font-semibold">
                {message.id}
              </h2>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label="Close message details"
              className="rounded-lg border border-border px-3 py-2 text-lg leading-none text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50"
            >
              ×
            </button>
          </header>
          <div className="flex-1 space-y-7 overflow-y-auto px-6 py-6">
            <div className="flex flex-wrap items-center gap-2">
              <MessageStatus status={message.status} compact />
              <span className="rounded-full border border-border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {message.protocol}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <Field label="Source" value={source?.name ?? message.source.chainId} />
              <Field label="Destination" value={destination?.name ?? message.destination.chainId} />
              <Field label="Source transaction" value={short(message.source.txHash)} linkHref={sourceTx} />
              <Field
                label="Destination transaction"
                value={short(message.destination.txHash)}
                linkHref={destinationTx}
              />
            </div>
            <MessageTimeline message={message} />
            <Accordion type="single" collapsible>
              <AccordionItem value="technical-record">
                <AccordionTrigger>
                  <span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      Technical record
                    </span>
                    <span className="mt-1 block text-sm font-medium">Protocol ID & payload</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-5">
                    <Field
                      label="Warp / Teleporter ID"
                      value={message.warp?.messageId ?? message.teleporter?.messageId}
                    />
                    <div>
                      <div className="flex items-center justify-between">
                        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                          Raw payload
                        </p>
                        <CopyButton value={message.payload.raw} />
                      </div>
                      <pre className="mt-2 max-h-36 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-muted p-3 font-mono text-[11px] leading-5">
                        {message.payload.raw ?? "Not recorded"}
                      </pre>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
