import type { ICMMessage } from "./message"

export type MessageBatch = {
  id: string
  sourceChainId: string
  destinationChainId: string
  messages: ICMMessage[]
  startedAt: number
}
