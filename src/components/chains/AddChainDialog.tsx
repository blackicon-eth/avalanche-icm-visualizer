"use client"

import { useState, type FormEvent } from "react"
import type { Chain } from "@/types"
import { customChainSchema } from "./chainStorage"

type AddChainDialogProps = { open: boolean; onOpenChange: (open: boolean) => void; onAdd: (chain: Chain) => void }

const fields = [
  ["name", "Network name", "e.g. My Avalanche L1"],
  ["shortName", "Short name", "e.g. MYL1"],
  ["id", "Chain ID", "stable identifier"],
  ["blockchainId", "Blockchain ID", "P-Chain encoded ID"],
  ["rpcUrl", "RPC URL", "https://..."],
  ["explorerUrl", "Explorer URL", "https://..."],
] as const

export function AddChainDialog({ open, onOpenChange, onAdd }: AddChainDialogProps) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  if (!open) return null
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const result = customChainSchema.safeParse({ ...values, enabledByDefault: true, metadata: { network: "local" } })
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Check the form fields")
      return
    }
    onAdd(result.data)
    setValues({})
    setError(null)
    onOpenChange(false)
  }
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onOpenChange(false)
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-chain-title"
        className="w-full max-w-xl rounded-2xl border border-border bg-background p-8 shadow-2xl"
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Custom endpoint</p>
            <h2 id="add-chain-title" className="mt-1 text-xl font-semibold">
              Add a chain
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close dialog"
            onClick={() => onOpenChange(false)}
            className="text-xl text-muted-foreground hover:text-foreground"
          >
            ×
          </button>
        </div>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          {fields.map(([name, label, placeholder]) => (
            <label key={name} className="grid gap-2">
              <span className="text-sm font-medium">{label}</span>
              <input
                required={!name.endsWith("Url")}
                value={values[name] ?? ""}
                onChange={(event) => setValues({ ...values, [name]: event.target.value })}
                placeholder={placeholder}
                className="h-12 rounded-lg border border-border bg-muted/30 px-4 text-base outline-none placeholder:text-muted-foreground/60 focus:border-foreground"
              />
            </label>
          ))}
          {error && <p className="sm:col-span-2 text-xs text-red-400">{error}</p>}
          <div className="flex justify-end gap-2 sm:col-span-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button type="submit" className="rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background">
              Add chain
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
