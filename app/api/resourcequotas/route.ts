import { NextRequest, NextResponse } from "next/server";
import { getCoreV1Api } from "@/lib/k8s";
import { formatAge } from "@/lib/format";
import { V1ResourceQuota } from "@kubernetes/client-node";

export interface ResourceQuotaItem {
  name: string;
  namespace: string;
  age: string;
  hard: Record<string, string>;
  used: Record<string, string>;
}

export async function GET(request: NextRequest) {
  const namespace = request.nextUrl.searchParams.get("namespace") ?? "default";
  try {
    const api = getCoreV1Api(request);
    const res =
      namespace === "_all"
        ? await api.listResourceQuotaForAllNamespaces()
        : await api.listNamespacedResourceQuota({ namespace });
    const items: ResourceQuotaItem[] = (res.items || []).map((rq) =>
      resourceQuotaToItem(rq)
    );
    return NextResponse.json({ items });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status = (err as { response?: { statusCode?: number } })?.response?.statusCode ?? 500;
    return NextResponse.json(
      { error: "Failed to list resource quotas", details: message },
      { status: status >= 400 ? status : 500 }
    );
  }
}

function toStringRecord(obj: Record<string, string> | undefined): Record<string, string> {
  if (!obj) return {};
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = String(value);
  }
  return result;
}

function resourceQuotaToItem(rq: V1ResourceQuota): ResourceQuotaItem {
  const name = rq.metadata?.name ?? "";
  const ns = rq.metadata?.namespace ?? "";
  const age = rq.metadata?.creationTimestamp
    ? formatAge(rq.metadata.creationTimestamp as string | Date)
    : "—";
  return {
    name,
    namespace: ns,
    age,
    hard: toStringRecord(rq.spec?.hard as Record<string, string> | undefined),
    used: toStringRecord(rq.status?.used as Record<string, string> | undefined),
  };
}
