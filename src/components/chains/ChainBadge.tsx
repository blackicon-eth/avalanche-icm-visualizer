import type { Chain } from "@/types"
import Image from "next/image"
import { cn } from "@/lib/utils"

type ChainBadgeProps = { chain: Pick<Chain, "name" | "shortName" | "color" | "icon">; compact?: boolean; className?: string }

export function ChainBadge({ chain, compact = false, className }: ChainBadgeProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)} title={chain.name}>
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/10 text-[10px] font-bold" style={{ backgroundColor: chain.color ?? "#334155" }}>
        {chain.icon ? <Image src={chain.icon} alt="" width={28} height={28} unoptimized className="h-full w-full rounded-full object-cover" /> : chain.shortName.slice(0, 2).toUpperCase()}
      </span>
      {!compact && <span className="truncate text-sm font-medium">{chain.name}</span>}
    </span>
  )
}
