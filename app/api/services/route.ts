import { NextRequest, NextResponse } from "next/server";
import { getCoreV1Api } from "@/lib/k8s";
import { formatAge } from "@/lib/format";
import type { ServiceItem } from "@/lib/types";
import { V1Service } from "@kubernetes/client-node";

export async function GET(request: NextRequest) {
  const namespace = request.nextUrl.searchParams.get("namespace") ?? "default";
  try {
    const api = getCoreV1Api(request);
    const res =
      namespace === "_all"
        ? await api.listServiceForAllNamespaces()
        : await api.listNamespacedService({ namespace });
    const items: ServiceItem[] = (res.items || []).map((s) => serviceToItem(s));
    return NextResponse.json({ items });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status = (err as { response?: { statusCode?: number } })?.response?.statusCode ?? 500;
    return NextResponse.json(
      { error: "Failed to list services", details: message },
      { status: status >= 400 ? status : 500 }
    );
  }
}

function serviceToItem(s: V1Service): ServiceItem {
  const name = s.metadata?.name ?? "";
  const ns = s.metadata?.namespace ?? "";
  const type = s.spec?.type ?? "ClusterIP";
  const clusterIP = s.spec?.clusterIP ?? "None";
  const ports = (s.spec?.ports ?? [])
    .map((p) => `${p.port}${p.targetPort != null ? `:${p.targetPort}` : ""}/${p.protocol ?? "TCP"}`)
    .join(", ") || "—";
  const age = s.metadata?.creationTimestamp
    ? formatAge(s.metadata.creationTimestamp)
    : "—";
  return { name, namespace: ns, type, clusterIP, ports, age };
}
