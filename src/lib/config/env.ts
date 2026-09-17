import { z } from "zod"

const optionalUrl = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.url().optional(),
)

const serverEnvSchema = z.object({
  AVALANCHE_RPC_URL: optionalUrl,
})

const clientEnvSchema = z.object({
  NEXT_PUBLIC_AVALANCHE_RPC_URL: optionalUrl,
  NEXT_PUBLIC_DATA_MODE: z.enum(["mock", "live"]).default("mock"),
})

export type DataMode = "mock" | "live"

export const env = serverEnvSchema.parse({
  AVALANCHE_RPC_URL: process.env.AVALANCHE_RPC_URL,
})

export const publicEnv = clientEnvSchema.parse({
  NEXT_PUBLIC_AVALANCHE_RPC_URL: process.env.NEXT_PUBLIC_AVALANCHE_RPC_URL,
  NEXT_PUBLIC_DATA_MODE: process.env.NEXT_PUBLIC_DATA_MODE,
})

export const isLiveDataMode = publicEnv.NEXT_PUBLIC_DATA_MODE === "live"
