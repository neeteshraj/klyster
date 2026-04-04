import { NextRequest, NextResponse } from "next/server";
import { getCoreV1Api } from "@/lib/k8s";
import { formatAge } from "@/lib/format";
import { V1LimitRange } from "@kubernetes/client-node";

export interface LimitRangeLimit {
  type: string;
  resource: string;
  min?: string;
  max?: string;
  default?: string;
  defaultRequest?: string;
}

export interface LimitRangeItem {
  name: string;
  namespace: string;
  age: string;
  limits: LimitRangeLimit[];
}

export async function GET(request: NextRequest) {
  const namespace = request.nextUrl.searchParams.get("namespace") ?? "default";
  try {
    const api = getCoreV1Api(request);
    const res =
      namespace === "_all"
        ? await api.listLimitRangeForAllNamespaces()
        : await api.listNamespacedLimitRange({ namespace });
    const items: LimitRangeItem[] = (res.items || []).map((lr) =>
      limitRangeToItem(lr)
    );
    return NextResponse.json({ items });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status = (err as { response?: { statusCode?: number } })?.response?.statusCode ?? 500;
    return NextResponse.json(
      { error: "Failed to list limit ranges", details: message },
      { status: status >= 400 ? status : 500 }
    );
  }
}

function flattenLimits(lr: V1LimitRange): LimitRangeLimit[] {
  const result: LimitRangeLimit[] = [];
  for (const limit of lr.spec?.limits || []) {
    const type = limit.type ?? "unknown";
    const allResources = new Set<string>();
    for (const key of Object.keys(limit.min || {})) allResources.add(key);
    for (const key of Object.keys(limit.max || {})) allResources.add(key);
    for (const key of Object.keys(limit._default || {})) allResources.add(key);
    for (const key of Object.keys(limit.defaultRequest || {})) allResources.add(key);

    for (const resource of allResources) {
      result.push({
        type,
        resource,
        min: (limit.min as Record<string, string> | undefined)?.[resource],
        max: (limit.max as Record<string, string> | undefined)?.[resource],
        default: (limit._default as Record<string, string> | undefined)?.[resource],
        defaultRequest: (limit.defaultRequest as Record<string, string> | undefined)?.[resource],
      });
    }
  }
  return result;
}

function limitRangeToItem(lr: V1LimitRange): LimitRangeItem {
  const name = lr.metadata?.name ?? "";
  const ns = lr.metadata?.namespace ?? "";
  const age = lr.metadata?.creationTimestamp
    ? formatAge(lr.metadata.creationTimestamp as string | Date)
    : "—";
  return {
    name,
    namespace: ns,
    age,
    limits: flattenLimits(lr),
  };
}
