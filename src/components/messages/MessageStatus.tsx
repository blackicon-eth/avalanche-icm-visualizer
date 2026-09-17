import type { ICMMessageStatus } from "@/types"

const statusCopy: Record<ICMMessageStatus, { label: string; tone: string; dot: string }> = {
  observed: { label: "Observed", tone: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300", dot: "bg-sky-500" },
  relaying: { label: "Relaying", tone: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300", dot: "bg-amber-500" },
  delivered: { label: "Delivered", tone: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500" },
  failed: { label: "Failed", tone: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300", dot: "bg-rose-500" },
}

export function MessageStatus({ status, compact = false }: { status: ICMMessageStatus; compact?: boolean }) {
  const copy = statusCopy[status]

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.14em] ${copy.tone}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${copy.dot} ${status === "relaying" ? "animate-pulse" : ""}`} aria-hidden="true" />
      <span>{compact ? copy.label : `Status: ${copy.label}`}</span>
    </span>
  )
}
