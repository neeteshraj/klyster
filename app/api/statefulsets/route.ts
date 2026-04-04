import { NextRequest, NextResponse } from "next/server";
import { getAppsV1Api } from "@/lib/k8s";
import { formatAge } from "@/lib/format";
import { V1StatefulSet } from "@kubernetes/client-node";

export interface StatefulSetItem {
  name: string;
  namespace: string;
  ready: string;
  replicas: number;
  age: string;
}

export async function GET(request: NextRequest) {
  const namespace = request.nextUrl.searchParams.get("namespace") ?? "default";
  try {
    const api = getAppsV1Api(request);
    const res =
      namespace === "_all"
        ? await api.listStatefulSetForAllNamespaces()
        : await api.listNamespacedStatefulSet({ namespace });
    const items: StatefulSetItem[] = (res.items || []).map((d) =>
      statefulSetToItem(d)
    );
    return NextResponse.json({ items });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status = (err as { response?: { statusCode?: number } })?.response?.statusCode ?? 500;
    return NextResponse.json(
      { error: "Failed to list statefulsets", details: message },
      { status: status >= 400 ? status : 500 }
    );
  }
}

function statefulSetToItem(d: V1StatefulSet): StatefulSetItem {
  const name = d.metadata?.name ?? "";
  const ns = d.metadata?.namespace ?? "";
  const replicas = d.status?.replicas ?? 0;
  const ready = d.status?.readyReplicas ?? 0;
  const age = d.metadata?.creationTimestamp
    ? formatAge(d.metadata.creationTimestamp as string | Date)
    : "—";
  return {
    name,
    namespace: ns,
    ready: `${ready}/${replicas}`,
    replicas,
    age,
  };
}
