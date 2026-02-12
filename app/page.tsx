"use client";

import { useOverview } from "@/hooks/use-overview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ResourceDonut } from "@/components/dashboard/resource-donut";
import { formatBytes } from "@/lib/format";
import { ContextSelector } from "@/components/layout/context-selector";
import { CheckCircle2, Cpu, MemoryStick, Boxes, AlertCircle } from "lucide-react";
import Link from "next/link";

function LegendItem({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-sm"
        style={{ backgroundColor: color }}
      />
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-mono font-medium tabular-nums">{value}</span>
    </div>
  );
}

export default function OverviewPage() {
  const { data, isLoading, error } = useOverview();
  const res = data?.resourceUtilization;

  const hasMetrics = res && (res.cpu.capacity > 0 || res.memory.capacityBytes > 0);
  const cpuUsage = res?.cpu.usage ?? 0;
  const cpuCapacity = res?.cpu.capacity ?? 1;
  const cpuAllocatable = res?.cpu.allocatable ?? 0;
  const memUsage = res?.memory.usageBytes ?? 0;
  const memCapacity = res?.memory.capacityBytes ?? 1;
  const memAllocatable = res?.memory.allocatableBytes ?? 0;
  const podsCount = res?.podsCount ?? data?.podsCount ?? 0;
  const podsAllocatable = res?.podsAllocatable ?? 0;
  const podsCapacity = res?.podsCapacity ?? 1;

  const clusterHealthy = !error && (data?.podsCount ?? 0) >= 0;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Cluster Overview
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {data?.context ? (
              <span className="font-mono">{data.context}</span>
            ) : (
              "—"
            )}
          </p>
        </div>
        <ContextSelector />
      </div>

      {error && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
            <p className="text-sm text-destructive">{error.message}</p>
          </CardContent>
        </Card>
      )}

      {hasMetrics && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="bg-card/80">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Cpu className="h-4 w-4" />
                CPU
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
              {isLoading ? (
                <Skeleton className="h-[120px] w-[120px] rounded-full" />
              ) : (
                <ResourceDonut
                  usage={cpuUsage}
                  allocatable={cpuAllocatable}
                  capacity={cpuCapacity}
                  size={120}
                  strokeWidth={14}
                  usageColor="hsl(var(--chart-1))"
                  allocatableColor="hsl(var(--chart-4))"
                  capacityColor="hsl(var(--chart-5))"
                />
              )}
              <div className="flex flex-col gap-1.5 min-w-0">
                <LegendItem
                  label="Usage"
                  value={cpuUsage.toFixed(2)}
                  color="hsl(var(--chart-1))"
                />
                <LegendItem
                  label="Allocatable"
                  value={cpuAllocatable.toFixed(2)}
                  color="hsl(var(--chart-4))"
                />
                <LegendItem
                  label="Capacity"
                  value={cpuCapacity.toFixed(2)}
                  color="hsl(var(--chart-5))"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/80">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <MemoryStick className="h-4 w-4" />
                Memory
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
              {isLoading ? (
                <Skeleton className="h-[120px] w-[120px] rounded-full" />
              ) : (
                <ResourceDonut
                  usage={memUsage}
                  allocatable={memAllocatable}
                  capacity={memCapacity}
                  size={120}
                  strokeWidth={14}
                  usageColor="hsl(var(--chart-1))"
                  allocatableColor="hsl(var(--chart-4))"
                  capacityColor="hsl(var(--chart-5))"
                />
              )}
              <div className="flex flex-col gap-1.5 min-w-0">
                <LegendItem
                  label="Usage"
                  value={formatBytes(memUsage)}
                  color="hsl(var(--chart-1))"
                />
                <LegendItem
                  label="Allocatable"
                  value={formatBytes(memAllocatable)}
                  color="hsl(var(--chart-4))"
                />
                <LegendItem
                  label="Capacity"
                  value={formatBytes(memCapacity)}
                  color="hsl(var(--chart-5))"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/80">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Boxes className="h-4 w-4" />
                Pods
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
              {isLoading ? (
                <Skeleton className="h-[120px] w-[120px] rounded-full" />
              ) : (
                <ResourceDonut
                  usage={podsCount}
                  allocatable={podsAllocatable}
                  capacity={Math.max(podsCapacity, podsCount, 1)}
                  size={120}
                  strokeWidth={14}
                  usageColor="hsl(var(--chart-3))"
                  allocatableColor="hsl(var(--chart-4))"
                  capacityColor="hsl(var(--chart-5))"
                />
              )}
              <div className="flex flex-col gap-1.5 min-w-0">
                <LegendItem
                  label="Usage"
                  value={String(podsCount)}
                  color="hsl(var(--chart-3))"
                />
                <LegendItem
                  label="Allocatable"
                  value={String(podsAllocatable)}
                  color="hsl(var(--chart-4))"
                />
                <LegendItem
                  label="Capacity"
                  value={String(podsCapacity)}
                  color="hsl(var(--chart-5))"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!hasMetrics && !error && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Context</p>
              {isLoading ? (
                <Skeleton className="mt-1 h-7 w-24" />
              ) : (
                <p className="mt-1 font-mono text-lg font-semibold">
                  {data?.context ?? "—"}
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Namespaces</p>
              {isLoading ? (
                <Skeleton className="mt-1 h-7 w-12" />
              ) : (
                <p className="mt-1 text-lg font-semibold">
                  {data?.namespacesCount ?? "—"}
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Pods</p>
              {isLoading ? (
                <Skeleton className="mt-1 h-7 w-12" />
              ) : (
                <p className="mt-1 text-lg font-semibold">
                  {data?.podsCount ?? "—"}
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Nodes</p>
              {isLoading ? (
                <Skeleton className="mt-1 h-7 w-12" />
              ) : (
                <p className="mt-1 text-lg font-semibold">
                  {data?.nodesCount ?? "—"}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="border-success/30 bg-success/5">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-10 sm:flex-row sm:gap-4">
          {clusterHealthy ? (
            <>
              <CheckCircle2 className="h-12 w-12 shrink-0 text-[hsl(var(--success))]" />
              <div className="text-center sm:text-left">
                <p className="font-semibold text-[hsl(var(--success))]">
                  No issues found
                </p>
                <p className="text-sm text-muted-foreground">
                  Everything is fine in the cluster
                </p>
              </div>
            </>
          ) : (
            <>
              <AlertCircle className="h-12 w-12 shrink-0 text-destructive" />
              <div className="text-center sm:text-left">
                <p className="font-semibold text-destructive">
                  Unable to reach cluster
                </p>
                <p className="text-sm text-muted-foreground">
                  Check kubeconfig and context
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick links</CardTitle>
          <p className="text-sm text-muted-foreground">
            Jump to namespaces, nodes, or workloads.
          </p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link
            href="/namespaces"
            className="text-sm font-medium text-primary hover:underline"
          >
            View namespaces →
          </Link>
          <Link
            href="/nodes"
            className="text-sm font-medium text-primary hover:underline"
          >
            View nodes →
          </Link>
          <Link
            href="/workloads/pods"
            className="text-sm font-medium text-primary hover:underline"
          >
            View pods →
          </Link>
          <Link
            href="/workloads/deployments"
            className="text-sm font-medium text-primary hover:underline"
          >
            View deployments →
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
