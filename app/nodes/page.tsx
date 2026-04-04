"use client";

import Link from "next/link";
import { useNodes } from "@/hooks/use-nodes";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Server } from "lucide-react";
import { PageHeader, EmptyState, ErrorBanner, LoadingRows } from "@/components/layout/page-header";

function UsageBar({ percent, label }: { percent?: number; label: string }) {
  if (percent == null) return <span className="text-white/30 text-xs">—</span>;
  const p = Math.min(100, Math.round(percent));
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            p >= 90 ? "bg-red-500" : p >= 75 ? "bg-amber-500" : "bg-primary"
          )}
          style={{ width: `${p}%` }}
        />
      </div>
      <span className="text-xs tabular-nums w-10 text-white/50">{p}%</span>
    </div>
  );
}

export default function NodesPage() {
  const { data: nodes, isLoading, error } = useNodes();

  return (
    <div className="p-6 space-y-4 w-full">
      <PageHeader
        icon={<Server className="h-4 w-4 text-white/50" />}
        title="Nodes"
        count={nodes?.length}
        showNamespace={false}
      />

      {error && <ErrorBanner message={error.message} />}

      {isLoading ? (
        <LoadingRows count={5} />
      ) : !nodes?.length ? (
        <EmptyState message="No nodes found." />
      ) : (
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Name</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Status</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Age</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">CPU (capacity / allocatable)</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Memory (capacity / allocatable)</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">CPU usage</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Memory usage</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {nodes.map((node) => (
                <TableRow key={node.name} className="border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <TableCell className="text-[13px] font-medium">
                    <Link
                      href={`/nodes/${encodeURIComponent(node.name)}`}
                      className="text-white hover:text-primary transition-colors"
                    >
                      {node.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">
                    <Badge
                      variant="secondary"
                      className={
                        node.status === "Ready"
                          ? "text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "text-[11px] font-medium bg-red-500/10 text-red-400 border-red-500/20"
                      }
                    >
                      {node.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">{node.age}</TableCell>
                  <TableCell className="font-mono text-[12px] text-white/50">
                    {node.cpuCapacity} / {node.cpuAllocatable}
                  </TableCell>
                  <TableCell className="font-mono text-[12px] text-white/50">
                    {node.memoryCapacity} / {node.memoryAllocatable}
                  </TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">
                    <UsageBar percent={node.cpuUsagePercent} label="CPU" />
                  </TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">
                    <UsageBar percent={node.memoryUsagePercent} label="Memory" />
                  </TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/nodes/${encodeURIComponent(node.name)}`}>
                        Details
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
