import { NextRequest, NextResponse } from "next/server";
import { getCoreV1Api } from "@/lib/k8s";
import { formatAge } from "@/lib/format";
import type { SecretItem } from "@/lib/types";
import { V1Secret } from "@kubernetes/client-node";

export async function GET(request: NextRequest) {
  const namespace = request.nextUrl.searchParams.get("namespace") ?? "default";
  try {
    const api = getCoreV1Api(request);
    const res =
      namespace === "_all"
        ? await api.listSecretForAllNamespaces()
        : await api.listNamespacedSecret({ namespace });
    const items: SecretItem[] = (res.items || []).map((s) => secretToItem(s));
    return NextResponse.json({ items });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status = (err as { response?: { statusCode?: number } })?.response?.statusCode ?? 500;
    return NextResponse.json(
      { error: "Failed to list secrets", details: message },
      { status: status >= 400 ? status : 500 }
    );
  }
}

function secretToItem(s: V1Secret): SecretItem {
  const name = s.metadata?.name ?? "";
  const ns = s.metadata?.namespace ?? "";
  const type = s.type ?? "Opaque";
  const keys = s.data ? Object.keys(s.data) : [];
  const age = s.metadata?.creationTimestamp
    ? formatAge(s.metadata.creationTimestamp)
    : "—";
  return { name, namespace: ns, type, keys, age };
}
