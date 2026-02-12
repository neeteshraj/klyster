import { NextRequest, NextResponse } from "next/server";
import { getCoreV1Api, getMetrics } from "@/lib/k8s";
import { formatAge } from "@/lib/format";
import type { PodItem } from "@/lib/types";
import { V1Pod } from "@kubernetes/client-node";

export async function GET(request: NextRequest) {
  const namespace = request.nextUrl.searchParams.get("namespace") ?? "default";
  try {
    const api = getCoreV1Api(request);
    const res = namespace === "_all"
      ? await api.listPodForAllNamespaces()
      : await api.listNamespacedPod({ namespace });
    const items: PodItem[] = (res.items || []).map((pod) => podToItem(pod));

    let metricsMap: Map<string, { cpu: string; memory: string }> = new Map();
    try {
      const metrics = getMetrics(request);
      const metricsList = await metrics.getPodMetrics(namespace === "_all" ? undefined : namespace);
      for (const m of metricsList.items ?? []) {
        const ns = m.metadata?.namespace ?? "";
        const name = m.metadata?.name ?? "";
        const key = `${ns}/${name}`;
        const cpuTotal = (m.containers ?? []).reduce((sum, c) => {
          const v = String(c.usage?.cpu ?? "0").trim();
          const num = parseFloat(v) || 0;
          if (v.endsWith("n")) return sum + num / 1e9;
          if (v.endsWith("u")) return sum + num / 1e6;
          if (v.endsWith("m")) return sum + num / 1000;
          return sum + num;
        }, 0);
        const memTotal = (m.containers ?? []).reduce((sum, c) => {
          const v = String(c.usage?.memory ?? "0").trim();
          const num = parseFloat(v) || 0;
          if (v.endsWith("Ki")) return sum + num * 1024;
          if (v.endsWith("Mi")) return sum + num * 1024 * 1024;
          if (v.endsWith("Gi")) return sum + num * 1024 * 1024 * 1024;
          if (v.endsWith("K") || v.endsWith("k")) return sum + num * 1000;
          if (v.endsWith("M") || v.endsWith("m")) return sum + num * 1000 * 1000;
          if (v.endsWith("G") || v.endsWith("g")) return sum + num * 1000 * 1000 * 1000;
          return sum + num; // assume bytes if no suffix
        }, 0);
        const cpuStr = cpuTotal >= 1 ? cpuTotal.toFixed(2) : (cpuTotal * 1000).toFixed(1) + "m";
        const memStr = memTotal >= 1024 * 1024 * 1024
          ? (memTotal / (1024 * 1024 * 1024)).toFixed(1) + "Gi"
          : memTotal >= 1024 * 1024
            ? (memTotal / (1024 * 1024)).toFixed(1) + "Mi"
            : memTotal >= 1024
              ? (memTotal / 1024).toFixed(1) + "Ki"
              : memTotal + "B";
        metricsMap.set(key, { cpu: cpuStr, memory: memStr });
      }
    } catch {
      // metrics-server not available
    }

    for (const item of items) {
      const key = `${item.namespace}/${item.name}`;
      const usage = metricsMap.get(key);
      if (usage) {
        item.cpu = usage.cpu;
        item.memory = usage.memory;
      } else {
        item.cpu = "N/A";
        item.memory = "N/A";
      }
    }

    return NextResponse.json({ items });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status = (err as { response?: { statusCode?: number } })?.response?.statusCode ?? 500;
    return NextResponse.json(
      { error: "Failed to list pods", details: message },
      { status: status >= 400 ? status : 500 }
    );
  }
}

function podToItem(pod: V1Pod): PodItem {
  const name = pod.metadata?.name ?? "";
  const ns = pod.metadata?.namespace ?? "";
  const status = getPodStatus(pod);
  const restarts = (pod.status?.containerStatuses ?? []).reduce(
    (acc, cs) => acc + (cs.restartCount ?? 0),
    0
  );
  const age = pod.metadata?.creationTimestamp
    ? formatAge(pod.metadata.creationTimestamp)
    : "—";
  const node = pod.spec?.nodeName ?? "—";
  const containerStatuses = pod.status?.containerStatuses ?? [];
  const readyCount = containerStatuses.filter((c) => c.ready).length;
  const ready = containerStatuses.length
    ? `${readyCount}/${containerStatuses.length}`
    : "—";
  const ownerRef = pod.metadata?.ownerReferences?.[0];
  const controlledBy = ownerRef ? `${ownerRef.kind}/${ownerRef.name}` : "—";
  const qos = (pod.status as { qosClass?: string })?.qosClass ?? "—";
  return {
    name,
    namespace: ns,
    status,
    restarts,
    age,
    node,
    ready,
    controlledBy,
    qos,
    containersReady: containerStatuses.length > 0 && readyCount === containerStatuses.length,
  };
}

function getPodStatus(pod: V1Pod): string {
  const phase = pod.status?.phase ?? "Unknown";
  if (phase === "Running") return "Running";
  if (phase === "Pending") {
    const reasons = (pod.status?.conditions ?? [])
      .filter((c) => c.status === "False" && c.reason)
      .map((c) => c.reason);
    if (reasons.includes("ContainersNotReady")) return "Pending";
    if (reasons.length) return reasons[0] ?? "Pending";
    return "Pending";
  }
  if (phase === "Succeeded") return "Succeeded";
  if (phase === "Failed") return "Failed";
  return phase;
}
