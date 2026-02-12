import { NextRequest, NextResponse } from "next/server";
import { getNetworkingV1Api } from "@/lib/k8s";
import { formatAge } from "@/lib/format";
import type { IngressClassItem } from "@/lib/types";
import { V1IngressClass } from "@kubernetes/client-node";

export async function GET(request: NextRequest) {
  try {
    const api = getNetworkingV1Api(request);
    const res = await api.listIngressClass();
    const items: IngressClassItem[] = (res.items || []).map((c) => ingressClassToItem(c));
    return NextResponse.json({ items });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status = (err as { response?: { statusCode?: number } })?.response?.statusCode ?? 500;
    return NextResponse.json(
      { error: "Failed to list ingress classes", details: message },
      { status: status >= 400 ? status : 500 }
    );
  }
}

function ingressClassToItem(c: V1IngressClass): IngressClassItem {
  const name = c.metadata?.name ?? "";
  const controller = c.spec?.controller ?? "—";
  const age = c.metadata?.creationTimestamp
    ? formatAge(c.metadata.creationTimestamp)
    : "—";
  return { name, controller, age };
}
