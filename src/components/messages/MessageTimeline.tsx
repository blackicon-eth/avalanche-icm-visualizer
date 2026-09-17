"use client"

import type { ICMMessage } from "@/types"
import { MessageStatus } from "./MessageStatus"

type Stage = { key: string; title: string; detail: string; state: "complete" | "current" | "pending" | "failed"; time?: number }

function timeLabel(value?: number) {
  if (!value) return "No timestamp recorded"
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(value)
}

export function MessageTimeline({ message }: { message: ICMMessage }) {
  const stages: Stage[] = [
    { key: "observed", title: "Source event observed", detail: "A message event was recorded on the source chain.", state: "complete", time: message.emittedAt ?? message.source.timestamp },
    { key: "relaying", title: "Relay evidence", detail: message.status === "observed" ? "No relay evidence is recorded yet." : "The message has progressed beyond source observation; relayer attribution is not available.", state: message.status === "observed" ? "current" : "complete" },
    { key: "delivered", title: "Destination execution", detail: message.destination.txHash ? "A destination transaction is recorded." : "No destination transaction is recorded.", state: message.status === "failed" ? "failed" : message.status === "delivered" ? "complete" : "pending", time: message.deliveredAt ?? message.destination.timestamp },
  ]

  return (
    <section aria-labelledby="message-timeline-heading">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Evidence trail</p>
          <h3 id="message-timeline-heading" className="mt-1 text-sm font-semibold tracking-tight">Lifecycle</h3>
        </div>
        <MessageStatus status={message.status} compact />
      </div>
      <ol className="relative ml-2 border-l border-border pl-6">
        {stages.map((stage) => (
          <li key={stage.key} className="relative pb-6 last:pb-0">
            <span className={`absolute -left-[31px] top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-background ${stage.state === "complete" ? "bg-emerald-500" : stage.state === "current" ? "bg-amber-500" : stage.state === "failed" ? "bg-rose-500" : "bg-muted"}`} aria-hidden="true">
              {stage.state === "complete" && <span className="h-1 w-1 rounded-full bg-white" />}
            </span>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <h4 className="text-sm font-medium">{stage.title}</h4>
              <time className="font-mono text-[10px] text-muted-foreground">{timeLabel(stage.time)}</time>
            </div>
            <p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">{stage.detail}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
