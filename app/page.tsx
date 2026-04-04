"use client";

import { useOverview } from "@/hooks/use-overview";
import { useNodes } from "@/hooks/use-nodes";
import { usePods } from "@/hooks/use-pods";
import { Skeleton } from "@/components/ui/skeleton";
import { ResourceDonut } from "@/components/dashboard/resource-donut";
import { formatBytes } from "@/lib/format";
import { ContextSelector } from "@/components/layout/context-selector";
import {
  CheckCircle2,
  Cpu,
  MemoryStick,
  Boxes,
  AlertCircle,
  Layers,
  Server,
  LayoutGrid,
  ArrowRight,
  Network,
  FileText,
  Lock,
  TerminalSquare,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

export default function OverviewPage() {
  const { data, isLoading, error } = useOverview();
  const { data: nodes, isLoading: nodesLoading } = useNodes();
  const { data: pods, isLoading: podsLoading } = usePods();

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

  const cpuPct = cpuCapacity > 0 ? Math.min(Math.round((cpuUsage / cpuCapacity) * 100), 100) : 0;
  const memPct = memCapacity > 0 ? Math.min(Math.round((memUsage / memCapacity) * 100), 100) : 0;
  const podPct = Math.max(podsCapacity, podsCount, 1) > 0
    ? Math.min(Math.round((podsCount / Math.max(podsCapacity, podsCount, 1)) * 100), 100)
    : 0;

  const podStatusCounts = useMemo(() => {
    if (!pods) return {};
    const counts: Record<string, number> = {};
    for (const pod of pods) {
      counts[pod.status || "Unknown"] = (counts[pod.status || "Unknown"] || 0) + 1;
    }
    return counts;
  }, [pods]);

  const highRestartPods = useMemo(() => {
    if (!pods) return [];
    return pods.filter((p) => p.restarts > 5).sort((a, b) => b.restarts - a.restarts).slice(0, 6);
  }, [pods]);

  return (
    <div className="p-6 w-full space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-foreground tracking-tight">Cluster Overview</h1>
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
              clusterHealthy
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
            }`}>
              {clusterHealthy ? <><CheckCircle2 className="h-3 w-3" /> Healthy</> : <><AlertCircle className="h-3 w-3" /> Unreachable</>}
            </div>
          </div>
          {data?.context && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <div className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </div>
              <span className="font-mono text-[11px] text-muted-foreground">{data.context}</span>
            </div>
          )}
        </div>
        <ContextSelector />
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
          <p className="text-sm text-destructive">{error.message}</p>
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { href: "/namespaces", icon: Layers, label: "Namespaces", value: data?.namespacesCount, color: "blue" as const },
          { href: "/workloads/pods", icon: Boxes, label: "Pods", value: data?.podsCount, color: "emerald" as const, pct: podPct },
          { href: "/nodes", icon: Server, label: "Nodes", value: data?.nodesCount, color: "violet" as const },
          { href: "/workloads/deployments", icon: LayoutGrid, label: "Deployments", value: data?.deploymentsCount, color: "amber" as const },
        ].map((card) => {
          const colorMap = {
            blue: { bg: "bg-blue-500", bgLight: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", border: "border-blue-500/20", ring: "ring-blue-500/20" },
            emerald: { bg: "bg-emerald-500", bgLight: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500/20", ring: "ring-emerald-500/20" },
            violet: { bg: "bg-violet-500", bgLight: "bg-violet-500/10", text: "text-violet-600 dark:text-violet-400", border: "border-violet-500/20", ring: "ring-violet-500/20" },
            amber: { bg: "bg-amber-500", bgLight: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", border: "border-amber-500/20", ring: "ring-amber-500/20" },
          };
          const c = colorMap[card.color];
          const Icon = card.icon;
          return (
            <Link key={card.href} href={card.href} className="group">
              <div className={`relative rounded-xl border border-border bg-card p-5 hover:shadow-lg hover:shadow-${card.color}-500/5 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden h-full`}>
                {/* Top accent bar */}
                <div className={`absolute top-0 inset-x-0 h-[3px] ${c.bg} opacity-60 group-hover:opacity-100 transition-opacity`} />

                <div className="flex items-start justify-between mb-4">
                  <div className={`flex items-center justify-center h-10 w-10 rounded-xl ${c.bgLight} ${c.border} border transition-transform group-hover:scale-110 duration-300`}>
                    <Icon className={`h-5 w-5 ${c.text}`} />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/20 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all" />
                </div>

                <div className="text-3xl font-extrabold text-foreground tabular-nums leading-none tracking-tight">
                  {isLoading ? <Skeleton className="h-9 w-14" /> : card.value ?? "—"}
                </div>
                <p className="text-[13px] font-medium text-muted-foreground mt-2">{card.label}</p>

                {card.pct != null && card.pct > 0 && !isLoading && (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full ${c.bg} transition-all duration-700`} style={{ width: `${card.pct}%` }} />
                    </div>
                    <span className={`text-[10px] font-bold tabular-nums ${c.text}`}>{card.pct}%</span>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* ── Resource Utilization ── */}
      {hasMetrics && (
        <div>
          <SectionHeader title="Resource Utilization" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[
              { icon: Cpu, title: "CPU", pct: cpuPct, usage: cpuUsage, alloc: cpuAllocatable, cap: cpuCapacity, usageFmt: cpuUsage.toFixed(2) + " cores", allocFmt: cpuAllocatable.toFixed(2) + " cores", capFmt: cpuCapacity.toFixed(2) + " cores", ringColor: "hsl(265, 80%, 60%)", color: "violet" as const },
              { icon: MemoryStick, title: "Memory", pct: memPct, usage: memUsage, alloc: memAllocatable, cap: memCapacity, usageFmt: formatBytes(memUsage), allocFmt: formatBytes(memAllocatable), capFmt: formatBytes(memCapacity), ringColor: "hsl(190, 80%, 50%)", color: "cyan" as const },
              { icon: Boxes, title: "Pods", pct: podPct, usage: podsCount, alloc: podsAllocatable, cap: Math.max(podsCapacity, podsCount, 1), usageFmt: String(podsCount) + " active", allocFmt: String(podsAllocatable), capFmt: String(podsCapacity), ringColor: "hsl(150, 70%, 50%)", color: "emerald" as const },
            ].map((r) => {
              const Icon = r.icon;
              const borderColor = { violet: "hover:border-violet-500/30", cyan: "hover:border-cyan-500/30", emerald: "hover:border-emerald-500/30" }[r.color];
              const dotBg = { violet: "bg-violet-500", cyan: "bg-cyan-500", emerald: "bg-emerald-500" }[r.color];
              const textColor = { violet: "text-violet-600 dark:text-violet-400", cyan: "text-cyan-600 dark:text-cyan-400", emerald: "text-emerald-600 dark:text-emerald-400" }[r.color];
              return (
                <div key={r.title} className={`rounded-xl border border-border bg-card overflow-hidden transition-all duration-300 ${borderColor}`}>
                  {/* Header with large percentage */}
                  <div className="px-5 pt-5 pb-0 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-[13px] font-semibold text-foreground">{r.title}</span>
                    </div>
                    <span className={`text-2xl font-extrabold tabular-nums ${textColor}`}>{r.pct}%</span>
                  </div>

                  {/* Donut centered */}
                  <div className="flex justify-center py-4">
                    {isLoading ? (
                      <Skeleton className="h-[120px] w-[120px] rounded-full" />
                    ) : (
                      <ResourceDonut usage={r.usage} allocatable={r.alloc} capacity={r.cap} size={120} strokeWidth={10} usageColor={r.ringColor} label={r.title.toLowerCase().slice(0, 3)} />
                    )}
                  </div>

                  {/* Metrics grid */}
                  <div className="px-5 pb-5 space-y-2.5">
                    {[
                      { label: "Used", value: r.usageFmt, dot: dotBg, bold: true },
                      { label: "Allocatable", value: r.allocFmt, dot: "bg-muted-foreground/30", bold: false },
                      { label: "Capacity", value: r.capFmt, dot: "bg-muted-foreground/15", bold: false },
                    ].map((m) => (
                      <div key={m.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${m.dot}`} />
                          <span className="text-[12px] text-muted-foreground">{m.label}</span>
                        </div>
                        <span className={`text-[12px] tabular-nums ${m.bold ? "font-bold text-foreground" : "text-muted-foreground"}`}>{m.value}</span>
                      </div>
                    ))}

                    {/* Usage bar */}
                    {!isLoading && (
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden mt-1">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${r.pct}%`, background: r.ringColor }} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Node Status + Pod Distribution ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Nodes */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-violet-500" />
              <span className="text-[13px] font-semibold text-foreground">Node Status</span>
            </div>
            <Link href="/nodes" className="text-[11px] text-primary hover:underline">View all →</Link>
          </div>
          <div className="px-5 py-3">
            {nodesLoading ? (
              <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : nodes && nodes.length > 0 ? (
              <div className="space-y-2">
                {nodes.map((node) => (
                  <div key={node.name} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-mono font-medium text-foreground truncate">{node.name}</p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                      node.status === "Ready" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                    }`}>{node.status}</span>
                    <div className="flex items-center gap-3 shrink-0">
                      <ProgressBar value={node.cpuUsagePercent} color="bg-violet-500" label="CPU" />
                      <ProgressBar value={node.memoryUsagePercent} color="bg-cyan-500" label="MEM" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-muted-foreground text-center py-6">No nodes found</p>
            )}
          </div>
        </div>

        {/* Pod status */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Boxes className="h-4 w-4 text-emerald-500" />
              <span className="text-[13px] font-semibold text-foreground">Pod Status</span>
            </div>
            <Link href="/workloads/pods" className="text-[11px] text-primary hover:underline">View all →</Link>
          </div>
          <div className="px-5 py-3 space-y-4">
            {podsLoading ? (
              <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-8 w-full" />)}</div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(podStatusCounts).sort((a, b) => b[1] - a[1]).map(([status, count]) => (
                    <StatusPill key={status} status={status} count={count} />
                  ))}
                  {Object.keys(podStatusCounts).length === 0 && (
                    <p className="text-[12px] text-muted-foreground">No pods</p>
                  )}
                </div>

                {highRestartPods.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                      <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">High Restarts</span>
                    </div>
                    <div className="space-y-1.5">
                      {highRestartPods.map((pod) => (
                        <div key={`${pod.namespace}/${pod.name}`} className="flex items-center justify-between rounded-lg bg-amber-500/5 border border-amber-500/10 px-3 py-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <RotateCcw className="h-3 w-3 text-amber-500 shrink-0" />
                            <span className="text-[11px] font-mono text-foreground/70 truncate">{pod.namespace}/{pod.name}</span>
                          </div>
                          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 tabular-nums shrink-0 ml-2">{pod.restarts}x</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Quick Access ── */}
      <div>
        <SectionHeader title="Quick Access" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {[
            { href: "/workloads/pods", icon: Boxes, label: "Pods" },
            { href: "/workloads/deployments", icon: LayoutGrid, label: "Deployments" },
            { href: "/network/services", icon: Network, label: "Services" },
            { href: "/config/configmaps", icon: FileText, label: "ConfigMaps" },
            { href: "/config/secrets", icon: Lock, label: "Secrets" },
            { href: "/tools/terminal", icon: TerminalSquare, label: "Terminal" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="group">
                <div className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2.5 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200">
                  <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-[12px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{title}</span>
      <div className="flex-1 h-px bg-border/50" />
    </div>
  );
}

function ProgressBar({ value, color, label }: { value?: number; color: string; label: string }) {
  if (value == null) return <span className="text-[10px] text-muted-foreground w-16 text-right">N/A</span>;
  const clamped = Math.min(Math.max(value, 0), 100);
  return (
    <div className="flex items-center gap-1.5 w-20">
      <span className="text-[9px] text-muted-foreground w-6 shrink-0">{label}</span>
      <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${clamped}%` }} />
      </div>
      <span className="text-[10px] text-muted-foreground tabular-nums w-7 text-right">{Math.round(clamped)}%</span>
    </div>
  );
}

function StatusPill({ status, count }: { status: string; count: number }) {
  const s = {
    Running: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    Succeeded: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    Completed: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    Pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    ContainerCreating: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    Failed: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    Error: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    CrashLoopBackOff: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    Terminating: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  }[status] || "bg-muted text-muted-foreground border-border";
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${s}`}>
      {status} <span className="tabular-nums font-bold">{count}</span>
    </div>
  );
}
