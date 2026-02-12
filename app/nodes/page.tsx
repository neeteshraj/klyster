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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function UsageBar({ percent, label }: { percent?: number; label: string }) {
  if (percent == null) return <span className="text-muted-foreground text-xs">—</span>;
  const p = Math.min(100, Math.round(percent));
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            p >= 90 ? "bg-destructive" : p >= 75 ? "bg-amber-500" : "bg-primary"
          )}
          style={{ width: `${p}%` }}
        />
      </div>
      <span className="text-xs tabular-nums w-10">{p}%</span>
    </div>
  );
}

export default function NodesPage() {
  const { data: nodes, isLoading, error } = useNodes();

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Nodes</h1>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {error.message}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Cluster nodes</CardTitle>
          <p className="text-sm text-muted-foreground">
            CPU and memory usage require metrics-server. Capacity and allocatable are always shown.
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !nodes?.length ? (
            <p className="text-muted-foreground py-8 text-center">
              No nodes found.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>CPU (capacity / allocatable)</TableHead>
                  <TableHead>Memory (capacity / allocatable)</TableHead>
                  <TableHead>CPU usage</TableHead>
                  <TableHead>Memory usage</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nodes.map((node) => (
                  <TableRow key={node.name}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/nodes/${encodeURIComponent(node.name)}`}
                        className="text-primary hover:underline"
                      >
                        {node.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={node.status === "Ready" ? "success" : "destructive"}>
                        {node.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{node.age}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {node.cpuCapacity} / {node.cpuAllocatable}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {node.memoryCapacity} / {node.memoryAllocatable}
                    </TableCell>
                    <TableCell>
                      <UsageBar percent={node.cpuUsagePercent} label="CPU" />
                    </TableCell>
                    <TableCell>
                      <UsageBar percent={node.memoryUsagePercent} label="Memory" />
                    </TableCell>
                    <TableCell>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
