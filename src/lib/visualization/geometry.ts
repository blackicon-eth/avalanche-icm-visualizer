import type { Point, RadialLayoutDimensions } from "@/types/visualization"

const DEFAULT_ANGLE_OFFSET = 0
const DEFAULT_RADIUS_RATIO = 0.36

function finite(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback
}

export function getDistance(first: Point, second: Point): number {
  return Math.hypot(second.x - first.x, second.y - first.y)
}

export function getRadialPosition(
  index: number,
  chainCount: number,
  width: number,
  height: number,
  radius?: number,
): Point
export function getRadialPosition(index: number, chainCount: number, dimensions: RadialLayoutDimensions): Point
export function getRadialPosition(
  index: number,
  chainCount: number,
  widthOrDimensions: number | RadialLayoutDimensions,
  height?: number,
  radius?: number,
): Point {
  const dimensions =
    typeof widthOrDimensions === "number"
      ? { width: widthOrDimensions, height: height ?? 0, radius }
      : widthOrDimensions
  const width = finite(dimensions.width, 0)
  const resolvedHeight = finite(dimensions.height, 0)
  const count = Math.max(0, Math.floor(chainCount))

  if (count === 0) {
    return { x: width / 2, y: resolvedHeight / 2 }
  }

  const resolvedRadius = Math.max(
    0,
    finite(dimensions.radius ?? Math.min(width, resolvedHeight) * DEFAULT_RADIUS_RATIO, 0),
  )
  const angle = (2 * Math.PI * index) / count + (dimensions.angleOffset ?? DEFAULT_ANGLE_OFFSET)

  return {
    x: width / 2 + resolvedRadius * Math.cos(angle),
    y: resolvedHeight / 2 + resolvedRadius * Math.sin(angle),
  }
}

export function getControlPoint(source: Point, destination: Point, curvature = 0.2): Point {
  const midpoint = {
    x: (source.x + destination.x) / 2,
    y: (source.y + destination.y) / 2,
  }
  const dx = destination.x - source.x
  const dy = destination.y - source.y
  const distance = Math.hypot(dx, dy)

  if (distance === 0) {
    return midpoint
  }

  const offset = finite(curvature, 0) * distance
  return {
    x: midpoint.x - (dy / distance) * offset,
    y: midpoint.y + (dx / distance) * offset,
  }
}

export function getArcPath(source: Point, destination: Point, curvature = 0.2): string {
  const controlPoint = getControlPoint(source, destination, curvature)
  return `M ${source.x} ${source.y} Q ${controlPoint.x} ${controlPoint.y} ${destination.x} ${destination.y}`
}
