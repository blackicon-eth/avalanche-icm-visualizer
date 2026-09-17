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
})

export const env = serverEnvSchema.parse({
  AVALANCHE_RPC_URL: process.env.AVALANCHE_RPC_URL,
})

export const publicEnv = clientEnvSchema.parse({
  NEXT_PUBLIC_AVALANCHE_RPC_URL: process.env.NEXT_PUBLIC_AVALANCHE_RPC_URL,
})
