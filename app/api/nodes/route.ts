import { NextRequest, NextResponse } from "next/server";
import { getCoreV1Api, getMetrics } from "@/lib/k8s";
import { formatAge } from "@/lib/format";
import { parseQuantityToNumber } from "@/lib/format";
import type { NodeItem } from "@/lib/types";
import { V1Node } from "@kubernetes/client-node";

function getResource(
  status: V1Node["status"] | null | undefined,
  key: "capacity" | "allocatable"
) {
  const map = status?.[key as keyof NonNullable<typeof status>] as Record<string, string> | undefined;
  if (!map) return { cpu: "—", memory: "—" };
  const cpu = map["cpu"] ?? map["nvidia.com/gpu"] ?? "—";
  const memory = map["memory"] ?? "—";
  return { cpu, memory };
}

function getNodeStatus(node: V1Node): string {
  const conditions = node.status?.conditions ?? [];
  const ready = conditions.find((c) => c.type === "Ready");
  if (ready?.status === "True") return "Ready";
  if (ready?.status === "False") return ready.reason ?? "NotReady";
  return node.status?.phase ?? "Unknown";
}

export async function GET(request: NextRequest) {
  try {
    const api = getCoreV1Api(request);
    const res = await api.listNode();
    const nodes = res.items ?? [];

    let nodeMetricsMap: Map<string, { cpu: string; memory: string }> = new Map();
    try {
      const metrics = getMetrics(request);
      const metricsList = await metrics.getNodeMetrics();
      for (const m of metricsList.items ?? []) {
        const name = m.metadata?.name;
        if (name && m.usage) {
          nodeMetricsMap.set(name, {
            cpu: m.usage.cpu ?? "0",
            memory: m.usage.memory ?? "0",
          });
        }
      }
    } catch {
      // metrics-server not available; skip usage
    }

    const items: NodeItem[] = nodes.map((node) => {
      const name = node.metadata?.name ?? "";
      const status = getNodeStatus(node);
      const age = node.metadata?.creationTimestamp
        ? formatAge(node.metadata.creationTimestamp as string | Date)
        : "—";
      const cap = getResource(node.status, "capacity");
      const alloc = getResource(node.status, "allocatable");
      const usage = nodeMetricsMap.get(name);

      let cpuUsagePercent: number | undefined;
      let memoryUsagePercent: number | undefined;
      if (usage) {
        const cpuCap = parseQuantityToNumber(cap.cpu);
        const memCap = parseQuantityToNumber(cap.memory);
        if (cpuCap > 0) cpuUsagePercent = (parseQuantityToNumber(usage.cpu) / cpuCap) * 100;
        if (memCap > 0) memoryUsagePercent = (parseQuantityToNumber(usage.memory) / memCap) * 100;
      }

      return {
        name,
        status,
        age,
        cpuCapacity: cap.cpu,
        cpuAllocatable: alloc.cpu,
        memoryCapacity: cap.memory,
        memoryAllocatable: alloc.memory,
        cpuUsage: usage?.cpu,
        memoryUsage: usage?.memory,
        cpuUsagePercent,
        memoryUsagePercent,
      };
    });

    return NextResponse.json({ items });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status = (err as { response?: { statusCode?: number } })?.response?.statusCode ?? 500;
    return NextResponse.json(
      { error: "Failed to list nodes", details: message },
      { status: status >= 400 ? status : 500 }
    );
  }
}
