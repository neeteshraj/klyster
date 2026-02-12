"use client";

export interface DonutSegment {
  value: number;
  color: string;
  label?: string;
}

function getSegments(
  usage: number,
  allocatable: number,
  capacity: number,
  usageColor: string,
  allocatableColor: string,
  capacityColor: string
): DonutSegment[] {
  const total = Math.max(capacity, usage, 1);
  const segments: DonutSegment[] = [];
  if (usage > 0) {
    segments.push({ value: usage, color: usageColor });
  }
  const allocatableRemaining = Math.max(0, allocatable - usage);
  if (allocatableRemaining > 0) {
    segments.push({ value: allocatableRemaining, color: allocatableColor });
  }
  const capacityRemaining = Math.max(0, capacity - allocatable);
  if (capacityRemaining > 0) {
    segments.push({ value: capacityRemaining, color: capacityColor });
  }
  if (segments.length === 0) {
    segments.push({ value: 1, color: capacityColor });
  }
  return segments;
}

function segmentToPath(
  segment: DonutSegment,
  total: number,
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  offset: number
): string {
  const ratio = segment.value / total;
  const angle = ratio * 2 * Math.PI;
  const endAngle = offset + angle;
  const x1o = cx + outerR * Math.sin(offset);
  const y1o = cy - outerR * Math.cos(offset);
  const x2o = cx + outerR * Math.sin(endAngle);
  const y2o = cy - outerR * Math.cos(endAngle);
  const x2i = cx + innerR * Math.sin(endAngle);
  const y2i = cy - innerR * Math.cos(endAngle);
  const x1i = cx + innerR * Math.sin(offset);
  const y1i = cy - innerR * Math.cos(offset);
  const large = ratio > 0.5 ? 1 : 0;
  return `M ${x1o} ${y1o} A ${outerR} ${outerR} 0 ${large} 1 ${x2o} ${y2o} L ${x2i} ${y2i} A ${innerR} ${innerR} 0 ${large} 0 ${x1i} ${y1i} Z`;
}

export function ResourceDonut({
  usage,
  allocatable,
  capacity,
  size = 120,
  strokeWidth = 12,
  usageColor = "hsl(var(--chart-1))",
  allocatableColor = "hsl(var(--chart-4))",
  capacityColor = "hsl(var(--chart-5))",
}: {
  usage: number;
  allocatable: number;
  capacity: number;
  size?: number;
  strokeWidth?: number;
  usageColor?: string;
  allocatableColor?: string;
  capacityColor?: string;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 2;
  const innerR = Math.max(2, outerR - strokeWidth);
  const total = Math.max(capacity, usage, 1);
  const segments = getSegments(
    usage,
    allocatable,
    capacity,
    usageColor,
    allocatableColor,
    capacityColor
  );
  let offset = -Math.PI / 2;
  return (
    <svg width={size} height={size} className="shrink-0">
      {segments.map((seg, i) => {
        const path = segmentToPath(
          seg,
          total,
          cx,
          cy,
          outerR,
          innerR,
          offset
        );
        offset += (seg.value / total) * 2 * Math.PI;
        return (
          <path
            key={i}
            d={path}
            fill={seg.color}
            stroke="transparent"
            strokeWidth={0}
          />
        );
      })}
    </svg>
  );
}
