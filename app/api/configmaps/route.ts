import { NextRequest, NextResponse } from "next/server";
import { getCoreV1Api } from "@/lib/k8s";
import { formatAge } from "@/lib/format";
import type { ConfigMapItem } from "@/lib/types";
import { V1ConfigMap } from "@kubernetes/client-node";

export async function GET(request: NextRequest) {
  const namespace = request.nextUrl.searchParams.get("namespace") ?? "default";
  try {
    const api = getCoreV1Api(request);
    const res =
      namespace === "_all"
        ? await api.listConfigMapForAllNamespaces()
        : await api.listNamespacedConfigMap({ namespace });
    const items: ConfigMapItem[] = (res.items || []).map((c) => configMapToItem(c));
    return NextResponse.json({ items });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status = (err as { response?: { statusCode?: number } })?.response?.statusCode ?? 500;
    return NextResponse.json(
      { error: "Failed to list configmaps", details: message },
      { status: status >= 400 ? status : 500 }
    );
  }
}

function configMapToItem(c: V1ConfigMap): ConfigMapItem {
  const name = c.metadata?.name ?? "";
  const ns = c.metadata?.namespace ?? "";
  const keys = c.data ? Object.keys(c.data) : [];
  const age = c.metadata?.creationTimestamp
    ? formatAge(c.metadata.creationTimestamp)
    : "—";
  return { name, namespace: ns, keys, age };
}
