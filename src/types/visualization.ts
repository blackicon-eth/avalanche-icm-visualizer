export type Point = {
  x: number
  y: number
}

export type ChainPosition = Point & {
  chainId: string
}

export type RadialLayoutDimensions = {
  width: number
  height: number
  radius?: number
  angleOffset?: number
}

export type NetworkLayoutOptions = {
  width?: number
  height?: number
  radius?: number
  angleOffset?: number
  enabledChainIds?: readonly string[]
  containerRef?: import("react").RefObject<HTMLElement | null>
}
