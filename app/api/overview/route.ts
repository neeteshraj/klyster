import { NextRequest, NextResponse } from "next/server";
import { getCoreV1Api, getCurrentContext, getMetrics } from "@/lib/k8s";
import { parseQuantityToNumber } from "@/lib/format";
import type { ClusterOverview } from "@/lib/types";

function getResource(
  status: { capacity?: Record<string, string>; allocatable?: Record<string, string> } | null | undefined,
  key: "capacity" | "allocatable"
): { cpu: string; memory: string } {
  const map = status?.[key];
  if (!map) return { cpu: "0", memory: "0" };
  return {
    cpu: map["cpu"] ?? map["nvidia.com/gpu"] ?? "0",
    memory: map["memory"] ?? "0",
  };
}

export async function GET(request: NextRequest) {
  try {
    const coreApi = getCoreV1Api(request);
    const [nsRes, podsRes, nodesRes] = await Promise.all([
      coreApi.listNamespace(),
      coreApi.listPodForAllNamespaces(),
      coreApi.listNode().catch(() => ({ items: [] })),
    ]);
    const namespacesCount = nsRes.items?.length ?? 0;
    const podsCount = podsRes.items?.length ?? 0;
    const nodes = nodesRes.items ?? [];
    const nodesCount = nodes.length;
    const context = getCurrentContext(request);

    let resourceUtilization: ClusterOverview["resourceUtilization"] | undefined;
    try {
      const metrics = getMetrics(request);
      const nodeMetricsList = await metrics.getNodeMetrics();
      const usageByNode = new Map<string | undefined, { cpu: string; memory: string }>();
      for (const m of nodeMetricsList.items ?? []) {
        const name = m.metadata?.name;
        if (name && m.usage) {
          usageByNode.set(name, {
            cpu: m.usage.cpu ?? "0",
            memory: m.usage.memory ?? "0",
          });
        }
      }

      let cpuUsage = 0,
        cpuCapacity = 0,
        cpuAllocatable = 0;
      let memoryUsage = 0,
        memoryCapacity = 0,
        memoryAllocatable = 0;
      let podsCapacity = 0,
        podsAllocatable = 0;

      for (const node of nodes) {
        const name = node.metadata?.name;
        const cap = getResource(node.status as never, "capacity");
        const alloc = getResource(node.status as never, "allocatable");
        const usage = usageByNode.get(name);

        cpuCapacity += parseQuantityToNumber(cap.cpu);
        cpuAllocatable += parseQuantityToNumber(alloc.cpu);
        memoryCapacity += parseQuantityToNumber(cap.memory);
        memoryAllocatable += parseQuantityToNumber(alloc.memory);
        if (usage) {
          cpuUsage += parseQuantityToNumber(usage.cpu);
          memoryUsage += parseQuantityToNumber(usage.memory);
        }
        podsCapacity += parseQuantityToNumber((node.status as { capacity?: Record<string, string> })?.capacity?.["pods"] ?? "0");
        podsAllocatable += parseQuantityToNumber((node.status as { allocatable?: Record<string, string> })?.allocatable?.["pods"] ?? "0");
      }

      resourceUtilization = {
        cpu: { usage: cpuUsage, capacity: cpuCapacity, allocatable: cpuAllocatable },
        memory: {
          usageBytes: memoryUsage,
          capacityBytes: memoryCapacity,
          allocatableBytes: memoryAllocatable,
        },
        podsCount,
        podsAllocatable,
        podsCapacity,
      };
    } catch {
      // metrics-server or node stats unavailable
    }

    const overview: ClusterOverview = {
      namespacesCount,
      podsCount,
      context,
      nodesCount,
      resourceUtilization,
    };
    return NextResponse.json(overview);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status = (err as { response?: { statusCode?: number } })?.response?.statusCode ?? 500;
    return NextResponse.json(
      { error: "Failed to get cluster overview", details: message },
      { status: status >= 400 ? status : 500 }
    );
  }
}
