import { NextRequest, NextResponse } from "next/server";
import { getAppsV1Api } from "@/lib/k8s";
import { formatAge } from "@/lib/format";
import { V1DaemonSet } from "@kubernetes/client-node";

export interface DaemonSetItem {
  name: string;
  namespace: string;
  desired: number;
  current: number;
  ready: number;
  upToDate: number;
  available: number;
  age: string;
}

export async function GET(request: NextRequest) {
  const namespace = request.nextUrl.searchParams.get("namespace") ?? "default";
  try {
    const api = getAppsV1Api(request);
    const res =
      namespace === "_all"
        ? await api.listDaemonSetForAllNamespaces()
        : await api.listNamespacedDaemonSet({ namespace });
    const items: DaemonSetItem[] = (res.items || []).map((d) =>
      daemonSetToItem(d)
    );
    return NextResponse.json({ items });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status = (err as { response?: { statusCode?: number } })?.response?.statusCode ?? 500;
    return NextResponse.json(
      { error: "Failed to list daemonsets", details: message },
      { status: status >= 400 ? status : 500 }
    );
  }
}

function daemonSetToItem(d: V1DaemonSet): DaemonSetItem {
  const name = d.metadata?.name ?? "";
  const ns = d.metadata?.namespace ?? "";
  const desired = d.status?.desiredNumberScheduled ?? 0;
  const current = d.status?.currentNumberScheduled ?? 0;
  const ready = d.status?.numberReady ?? 0;
  const upToDate = d.status?.updatedNumberScheduled ?? 0;
  const available = d.status?.numberAvailable ?? 0;
  const age = d.metadata?.creationTimestamp
    ? formatAge(d.metadata.creationTimestamp as string | Date)
    : "—";
  return {
    name,
    namespace: ns,
    desired,
    current,
    ready,
    upToDate,
    available,
    age,
  };
}
