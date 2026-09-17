export type NetworkLegendProps = { className?: string }

export function NetworkLegend({ className }: NetworkLegendProps) {
  return (
    <div className={`flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-[#8d99a8] ${className ?? ""}`} aria-label="Network legend">
      <span><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#e84142]" />Warp</span>
      <span><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#f4b860]" />Teleporter</span>
      <span><i className="mr-1.5 inline-block h-2 w-2 rounded-full border border-[#687382]" />Chain</span>
    </div>
  )
}
