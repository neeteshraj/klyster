import { NextRequest, NextResponse } from "next/server";
import { getCoreV1Api } from "@/lib/k8s";
import { formatAge } from "@/lib/format";
import type { NamespaceItem } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const api = getCoreV1Api(request);
    const res = await api.listNamespace();
    const items: NamespaceItem[] = (res.items || []).map((ns) => {
      const status = ns.status?.phase ?? "Unknown";
      const age = ns.metadata?.creationTimestamp
        ? formatAge(ns.metadata.creationTimestamp)
        : "—";
      return {
        name: ns.metadata?.name ?? "",
        status,
        age,
      };
    });
    return NextResponse.json({ items });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status = (err as { response?: { statusCode?: number } })?.response?.statusCode ?? 500;
    return NextResponse.json(
      { error: "Failed to list namespaces", details: message },
      { status: status >= 400 ? status : 500 }
    );
  }
}
