import { NextRequest, NextResponse } from "next/server";
import { getAppsV1Api } from "@/lib/k8s";
import { formatAge } from "@/lib/format";
import { V1ReplicaSet } from "@kubernetes/client-node";

export interface ReplicaSetItem {
  name: string;
  namespace: string;
  desired: number;
  current: number;
  ready: number;
  age: string;
}

export async function GET(request: NextRequest) {
  const namespace = request.nextUrl.searchParams.get("namespace") ?? "default";
  try {
    const api = getAppsV1Api(request);
    const res =
      namespace === "_all"
        ? await api.listReplicaSetForAllNamespaces()
        : await api.listNamespacedReplicaSet({ namespace });
    const items: ReplicaSetItem[] = (res.items || []).map((d) =>
      replicaSetToItem(d)
    );
    return NextResponse.json({ items });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status = (err as { response?: { statusCode?: number } })?.response?.statusCode ?? 500;
    return NextResponse.json(
      { error: "Failed to list replicasets", details: message },
      { status: status >= 400 ? status : 500 }
    );
  }
}

function replicaSetToItem(d: V1ReplicaSet): ReplicaSetItem {
  const name = d.metadata?.name ?? "";
  const ns = d.metadata?.namespace ?? "";
  const desired = d.spec?.replicas ?? 0;
  const current = d.status?.replicas ?? 0;
  const ready = d.status?.readyReplicas ?? 0;
  const age = d.metadata?.creationTimestamp
    ? formatAge(d.metadata.creationTimestamp as string | Date)
    : "—";
  return {
    name,
    namespace: ns,
    desired,
    current,
    ready,
    age,
  };
}
