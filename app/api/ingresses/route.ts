import { NextRequest, NextResponse } from "next/server";
import { getNetworkingV1Api } from "@/lib/k8s";
import { formatAge } from "@/lib/format";
import type { IngressItem } from "@/lib/types";
import { V1Ingress } from "@kubernetes/client-node";

export async function GET(request: NextRequest) {
  const namespace = request.nextUrl.searchParams.get("namespace") ?? "default";
  try {
    const api = getNetworkingV1Api(request);
    const res =
      namespace === "_all"
        ? await api.listIngressForAllNamespaces()
        : await api.listNamespacedIngress({ namespace });
    const items: IngressItem[] = (res.items || []).map((i) => ingressToItem(i));
    return NextResponse.json({ items });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status = (err as { response?: { statusCode?: number } })?.response?.statusCode ?? 500;
    return NextResponse.json(
      { error: "Failed to list ingresses", details: message },
      { status: status >= 400 ? status : 500 }
    );
  }
}

function ingressToItem(i: V1Ingress): IngressItem {
  const name = i.metadata?.name ?? "";
  const ns = i.metadata?.namespace ?? "";
  const classAnnotation = i.metadata?.annotations?.["kubernetes.io/ingress.class"];
  const specClass = (i.spec as { ingressClassName?: string })?.ingressClassName;
  const ingressClass = specClass ?? classAnnotation ?? "—";
  const rules = i.spec?.rules ?? [];
  const hosts = rules.map((r) => r.host ?? "").filter(Boolean).join(", ") || "—";
  const age = i.metadata?.creationTimestamp
    ? formatAge(i.metadata.creationTimestamp)
    : "—";
  return { name, namespace: ns, class: ingressClass, hosts, age };
}
