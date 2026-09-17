"use client"

import type { ICMMessage } from "@/types"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

type Stage = {
  key: string
  title: string
  detail: string
  evidence: "observed" | "inferred" | "conceptual"
  state: "complete" | "current" | "pending" | "failed"
  time?: number
}

function timeLabel(value?: number) {
  if (!value) return "No timestamp recorded"
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(value)
}

export function MessageTimeline({ message }: { message: ICMMessage }) {
  const sourceObserved = Boolean(message.source.txHash || message.emittedAt || message.source.timestamp)
  const destinationObserved = Boolean(message.destination.txHash || message.destination.timestamp)
  const deliveryObserved = message.status === "delivered" || message.status === "failed"

  const stages: Stage[] = [
    {
      key: "emission",
      title: "Source message emission",
      detail: sourceObserved
        ? "Source-chain message evidence is recorded."
        : "No source emission evidence is recorded.",
      evidence: sourceObserved ? "observed" : "conceptual",
      state: sourceObserved ? "complete" : "pending",
      time: message.emittedAt ?? message.source.timestamp,
    },
    {
      key: "signatures",
      title: "Validator signatures",
      detail:
        "Validators sign the message according to the protocol; individual signatures are not included in this record.",
      evidence: "conceptual",
      state: sourceObserved ? "complete" : "pending",
    },
    {
      key: "aggregation",
      title: "BLS aggregation",
      detail: "The protocol can aggregate validator signatures into a BLS signature; no aggregate is exposed here.",
      evidence: "conceptual",
      state: sourceObserved ? "complete" : "pending",
    },
    {
      key: "relayer",
      title: "Relayer",
      detail: message.teleporter?.relayerAddress
        ? `Destination delivery was submitted by relayer ${message.teleporter.relayerAddress}.`
        : message.status === "observed"
          ? "No relayer activity is observed yet."
          : "The message status indicates progress, but relayer pickup or attribution is not directly observed.",
      evidence: message.teleporter?.relayerAddress ? "observed" : "inferred",
      state: message.status === "observed" ? "current" : "complete",
    },
    {
      key: "verification",
      title: "Destination verification",
      detail: destinationObserved
        ? "A destination transaction or timestamp is observed; protocol verification is inferred from that evidence."
        : "Destination verification is a protocol step, but no destination evidence is recorded.",
      evidence: destinationObserved ? "inferred" : "conceptual",
      state: destinationObserved ? "complete" : "pending",
      time: message.destination.timestamp,
    },
    {
      key: "delivery",
      title: "Delivery",
      detail:
        message.status === "delivered"
          ? destinationObserved
            ? "Delivery is marked delivered and destination evidence is recorded."
            : "Delivery is marked delivered; no destination transaction is recorded."
          : message.status === "failed"
            ? "Delivery is marked failed; the cause is not recorded in this message."
            : "No delivery outcome is recorded yet.",
      evidence: deliveryObserved ? "observed" : "conceptual",
      state: message.status === "failed" ? "failed" : message.status === "delivered" ? "complete" : "pending",
      time: message.deliveredAt ?? message.destination.timestamp,
    },
  ]

  return (
    <section aria-labelledby="message-timeline-heading">
      <Accordion type="single" collapsible defaultValue="lifecycle">
        <AccordionItem value="lifecycle" className="border-b border-border">
          <AccordionTrigger>
            <span>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Evidence trail
              </span>
              <span id="message-timeline-heading" className="mt-1 block text-sm font-semibold tracking-tight">
                Technical Lifecycle
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <ol className="relative ml-2 border-l border-border pl-6">
              {stages.map((stage) => (
                <li key={stage.key} className="relative pb-6 last:pb-0">
                  <span
                    className={`absolute -left-[31px] top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-background ${stage.state === "complete" ? "bg-emerald-500" : stage.state === "current" ? "bg-amber-500" : stage.state === "failed" ? "bg-rose-500" : "bg-muted"}`}
                    aria-hidden="true"
                  >
                    {stage.state === "complete" && <span className="h-1 w-1 rounded-full bg-white" />}
                  </span>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <h4 className="text-sm font-medium">{stage.title}</h4>
                    <time className="font-mono text-[10px] text-muted-foreground">{timeLabel(stage.time)}</time>
                  </div>
                  <p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">
                    <span className="mr-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-foreground/60">
                      {stage.evidence}
                    </span>
                    {stage.detail}
                  </p>
                </li>
              ))}
            </ol>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  )
}
