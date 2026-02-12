import { NextRequest, NextResponse } from "next/server";
import { getCoreV1Api, getMetrics } from "@/lib/k8s";
import { formatAge, parseQuantityToNumber } from "@/lib/format";
import type { NodeDetail } from "@/lib/types";
import { V1Node } from "@kubernetes/client-node";
import * as yaml from "js-yaml";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  if (!name) {
    return NextResponse.json(
      { error: "Node name is required" },
      { status: 400 }
    );
  }
  try {
    const api = getCoreV1Api(_request);
    const node = await api.readNode({ name });

    const statusStr =
      node.status?.conditions?.find((c) => c.type === "Ready")?.status === "True"
        ? "Ready"
        : "NotReady";
    const age = node.metadata?.creationTimestamp
      ? formatAge(node.metadata.creationTimestamp as string | Date)
      : "—";

    const capacity = {
      cpu: node.status?.capacity?.["cpu"] ?? "—",
      memory: node.status?.capacity?.["memory"] ?? "—",
    };
    const allocatable = {
      cpu: node.status?.allocatable?.["cpu"] ?? "—",
      memory: node.status?.allocatable?.["memory"] ?? "—",
    };

    let usage: { cpu: string; memory: string } | undefined;
    let cpuUsagePercent: number | undefined;
    let memoryUsagePercent: number | undefined;
    try {
      const metrics = getMetrics(_request);
      const list = await metrics.getNodeMetrics();
      const m = list.items?.find((item) => item.metadata?.name === name);
      if (m?.usage) {
        usage = { cpu: m.usage.cpu ?? "0", memory: m.usage.memory ?? "0" };
      }
      if (usage) {
        const cpuCap = parseQuantityToNumber(capacity.cpu);
        const memCap = parseQuantityToNumber(capacity.memory);
        if (cpuCap > 0) cpuUsagePercent = (parseQuantityToNumber(usage.cpu) / cpuCap) * 100;
        if (memCap > 0) memoryUsagePercent = (parseQuantityToNumber(usage.memory) / memCap) * 100;
      }
    } catch {
      // metrics-server not available
    }

    const addresses = (node.status?.addresses ?? []).map((a) => ({
      type: a.type ?? "",
      address: a.address ?? "",
    }));
    const nodeInfo = node.status?.nodeInfo
      ? {
          osImage: node.status.nodeInfo.osImage,
          kernelVersion: node.status.nodeInfo.kernelVersion,
          containerRuntimeVersion: node.status.nodeInfo.containerRuntimeVersion,
          kubeletVersion: node.status.nodeInfo.kubeletVersion,
          architecture: node.status.nodeInfo.architecture,
          operatingSystem: node.status.nodeInfo.operatingSystem,
        }
      : undefined;
    const conditions = (node.status?.conditions ?? []).map((c) => ({
      type: c.type ?? "",
      status: c.status ?? "",
      message: c.message,
    }));

    let yamlStr: string | undefined;
    try {
      yamlStr = yaml.dump(node as unknown as Record<string, unknown>, {
        indent: 2,
        lineWidth: -1,
      });
    } catch {
      yamlStr = undefined;
    }

    const detail: NodeDetail = {
      name,
      status: statusStr,
      age,
      capacity,
      allocatable,
      usage,
      cpuUsagePercent,
      memoryUsagePercent,
      addresses,
      nodeInfo,
      conditions,
      yaml: yamlStr,
    };

    return NextResponse.json(detail);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status = (err as { response?: { statusCode?: number } })?.response?.statusCode ?? 500;
    return NextResponse.json(
      { error: `Failed to get node ${name}`, details: message },
      { status: status >= 400 ? status : 500 }
    );
  }
}
