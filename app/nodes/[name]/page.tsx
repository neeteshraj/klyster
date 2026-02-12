"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useNodeDetail } from "@/hooks/use-node-detail";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBytes, parseQuantityToNumber } from "@/lib/format";

const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((mod) => mod.default),
  { ssr: false }
);

function UsageCard({
  title,
  capacity,
  allocatable,
  usage,
  usagePercent,
  isMemory,
}: {
  title: string;
  capacity: string;
  allocatable: string;
  usage?: string;
  usagePercent?: number;
  isMemory?: boolean;
}) {
  const display = (v: string) =>
    isMemory && v !== "—" ? formatBytes(parseQuantityToNumber(v)) : v;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span className="text-muted-foreground">Capacity</span>
          <span className="font-mono text-xs">{display(capacity)}</span>
          <span className="text-muted-foreground">Allocatable</span>
          <span className="font-mono text-xs">{display(allocatable)}</span>
          {usage != null && (
            <>
              <span className="text-muted-foreground">Usage</span>
              <span className="font-mono text-xs">{display(usage)}</span>
            </>
          )}
        </div>
        {usagePercent != null && (
          <div className="pt-2">
            <div className="flex justify-between text-xs mb-1">
              <span>Usage</span>
              <span className="tabular-nums">{usagePercent.toFixed(1)}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  usagePercent >= 90 ? "bg-destructive" : usagePercent >= 75 ? "bg-amber-500" : "bg-primary"
                )}
                style={{ width: `${Math.min(100, usagePercent)}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function NodeDetailPage() {
  const params = useParams();
  const name = params?.name as string;
  const { data: node, isLoading, error } = useNodeDetail(name);

  if (!name) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Node name is required.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/nodes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">{name}</h1>
        {node && (
          <Badge variant={node.status === "Ready" ? "success" : "destructive"}>
            {node.status}
          </Badge>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {error.message}
        </div>
      )}

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : node ? (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <UsageCard
              title="CPU"
              capacity={node.capacity.cpu}
              allocatable={node.allocatable.cpu}
              usage={node.usage?.cpu}
              usagePercent={node.cpuUsagePercent}
            />
            <UsageCard
              title="Memory"
              capacity={node.capacity.memory}
              allocatable={node.allocatable.memory}
              usage={node.usage?.memory}
              usagePercent={node.memoryUsagePercent}
              isMemory
            />
          </div>

          {node.addresses && node.addresses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Addresses</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {node.addresses.map((a, i) => (
                      <TableRow key={i}>
                        <TableCell>{a.type}</TableCell>
                        <TableCell className="font-mono text-xs">{a.address}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {node.nodeInfo && (
            <Card>
              <CardHeader>
                <CardTitle>Node info</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                {node.nodeInfo.operatingSystem && (
                  <>
                    <span className="text-muted-foreground">OS</span>
                    <span>{node.nodeInfo.operatingSystem}</span>
                  </>
                )}
                {node.nodeInfo.osImage && (
                  <>
                    <span className="text-muted-foreground">OS Image</span>
                    <span>{node.nodeInfo.osImage}</span>
                  </>
                )}
                {node.nodeInfo.kernelVersion && (
                  <>
                    <span className="text-muted-foreground">Kernel</span>
                    <span className="font-mono text-xs">{node.nodeInfo.kernelVersion}</span>
                  </>
                )}
                {node.nodeInfo.containerRuntimeVersion && (
                  <>
                    <span className="text-muted-foreground">Container runtime</span>
                    <span className="font-mono text-xs">{node.nodeInfo.containerRuntimeVersion}</span>
                  </>
                )}
                {node.nodeInfo.kubeletVersion && (
                  <>
                    <span className="text-muted-foreground">Kubelet</span>
                    <span className="font-mono text-xs">{node.nodeInfo.kubeletVersion}</span>
                  </>
                )}
                {node.nodeInfo.architecture && (
                  <>
                    <span className="text-muted-foreground">Architecture</span>
                    <span>{node.nodeInfo.architecture}</span>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {node.conditions && node.conditions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {node.conditions.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <Badge variant={c.status === "True" ? "success" : "secondary"}>
                        {c.type}
                      </Badge>
                      <span className="text-muted-foreground">{c.status}</span>
                      {c.message && (
                        <span className="text-muted-foreground truncate">— {c.message}</span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>YAML</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border h-[400px] overflow-hidden">
                <MonacoEditor
                  height="400px"
                  language="yaml"
                  value={node.yaml ?? "# No YAML"}
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    wordWrap: "on",
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <p className="text-muted-foreground">Node not found.</p>
      )}
    </div>
  );
}
