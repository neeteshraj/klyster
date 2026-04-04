"use client";

export function ResourceDonut({
  usage,
  allocatable,
  capacity,
  size = 130,
  strokeWidth = 10,
  usageColor = "hsl(var(--chart-1))",
  allocatableColor = "hsl(var(--chart-4))",
  capacityColor = "hsl(var(--chart-5))",
  label,
}: {
  usage: number;
  allocatable: number;
  capacity: number;
  size?: number;
  strokeWidth?: number;
  usageColor?: string;
  allocatableColor?: string;
  capacityColor?: string;
  label?: string;
}) {
  const total = Math.max(capacity, usage, 1);
  const usagePct = Math.min((usage / total) * 100, 100);
  const allocatablePct = Math.min((allocatable / total) * 100, 100);

  const cx = size / 2;
  const cy = size / 2;
  const radius = (size - strokeWidth - 4) / 2;
  const circumference = 2 * Math.PI * radius;

  const usageOffset = circumference - (usagePct / 100) * circumference;
  const allocatableOffset = circumference - (allocatablePct / 100) * circumference;

  return (
    <div className="relative shrink-0 overflow-hidden rounded-full" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Track */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-muted-foreground/10"
          strokeWidth={strokeWidth}
        />
        {/* Allocatable ring */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={allocatableColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={allocatableOffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out opacity-30"
        />
        {/* Usage ring */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={usageColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={usageOffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
          style={{
            filter: `drop-shadow(0 0 6px ${usageColor})`,
          }}
        />
      </svg>
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-foreground tabular-nums">
          {Math.round(usagePct)}%
        </span>
        {label && (
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
