import { getArcPath as buildArcPath } from "@/lib/visualization/geometry"
import type { Point } from "@/types/visualization"

/** Builds a quadratic SVG arc without requiring SVG elements in the UI. */
export function getArcPath(source: Point, destination: Point, curvature = 0.2): string {
  return buildArcPath(source, destination, curvature)
}

export const buildCurvedPath = getArcPath
