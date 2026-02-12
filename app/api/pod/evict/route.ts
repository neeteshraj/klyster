import { NextRequest, NextResponse } from "next/server";
import { getCoreV1Api } from "@/lib/k8s";
import { V1Eviction } from "@kubernetes/client-node";

export async function POST(request: NextRequest) {
  let body: { namespace: string; name: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }
  const { namespace, name } = body;
  if (!namespace || !name) {
    return NextResponse.json(
      { error: "namespace and name are required" },
      { status: 400 }
    );
  }
  try {
    const api = getCoreV1Api(request);
    const eviction: V1Eviction = {
      apiVersion: "policy/v1",
      kind: "Eviction",
      metadata: {
        name,
        namespace,
      },
    };
    await api.createNamespacedPodEviction({
      name,
      namespace,
      body: eviction,
    });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status = (err as { response?: { statusCode?: number } })?.response?.statusCode ?? 500;
    return NextResponse.json(
      { error: "Failed to evict pod", details: message },
      { status: status >= 400 ? status : 500 }
    );
  }
}
