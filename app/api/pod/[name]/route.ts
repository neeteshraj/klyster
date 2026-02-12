import { NextRequest, NextResponse } from "next/server";
import { getCoreV1Api } from "@/lib/k8s";
import { formatAge } from "@/lib/format";
import type { PodDetail } from "@/lib/types";
import { V1Pod } from "@kubernetes/client-node";
import * as yaml from "js-yaml";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const namespace = _request.nextUrl.searchParams.get("namespace") ?? "default";
  if (!name) {
    return NextResponse.json(
      { error: "Pod name is required" },
      { status: 400 }
    );
  }
  try {
    const api = getCoreV1Api(_request);
    const pod = await api.readNamespacedPod({ name, namespace });
    const detail = podToDetail(pod);
    return NextResponse.json(detail);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status = (err as { response?: { statusCode?: number } })?.response?.statusCode ?? 500;
    return NextResponse.json(
      { error: `Failed to get pod ${name}`, details: message },
      { status: status >= 400 ? status : 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const namespace = _request.nextUrl.searchParams.get("namespace") ?? "default";
  if (!name) {
    return NextResponse.json(
      { error: "Pod name is required" },
      { status: 400 }
    );
  }
  try {
    const api = getCoreV1Api(_request);
    await api.deleteNamespacedPod({ name, namespace });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status = (err as { response?: { statusCode?: number } })?.response?.statusCode ?? 500;
    return NextResponse.json(
      { error: `Failed to delete pod ${name}`, details: message },
      { status: status >= 400 ? status : 500 }
    );
  }
}

function podToDetail(pod: V1Pod): PodDetail {
  const name = pod.metadata?.name ?? "";
  const ns = pod.metadata?.namespace ?? "";
  const phase = pod.status?.phase ?? "Unknown";
  const restarts = (pod.status?.containerStatuses ?? []).reduce(
    (acc, cs) => acc + (cs.restartCount ?? 0),
    0
  );
  const age = pod.metadata?.creationTimestamp
    ? formatAge(pod.metadata.creationTimestamp)
    : "—";
  const node = pod.spec?.nodeName;
  const ip = pod.status?.podIP;
  const containers = (pod.spec?.containers ?? []).map((c) => c.name ?? "");
  let yamlStr: string | undefined;
  try {
    yamlStr = yaml.dump(pod as unknown as Record<string, unknown>, {
      indent: 2,
      lineWidth: -1,
    });
  } catch {
    yamlStr = undefined;
  }
  return {
    name,
    namespace: ns,
    status: phase,
    restarts,
  age,
  node,
  ip,
  yaml: yamlStr,
  containers,
  };
}
