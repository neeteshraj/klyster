import { NextRequest, NextResponse } from "next/server";
import { getCoreV1Api } from "@/lib/k8s";

/**
 * GET /api/logs?namespace=default&pod=my-pod&container=app&tail=100
 * Returns pod logs (non-streaming). For streaming, use WebSocket /api/logs/stream.
 */
export async function GET(request: NextRequest) {
  const namespace = request.nextUrl.searchParams.get("namespace") ?? "default";
  const pod = request.nextUrl.searchParams.get("pod");
  const container = request.nextUrl.searchParams.get("container");
  const tail = parseInt(request.nextUrl.searchParams.get("tail") ?? "100", 10);

  if (!pod) {
    return NextResponse.json(
      { error: "Query parameter 'pod' is required" },
      { status: 400 }
    );
  }
  try {
    const api = getCoreV1Api(request);
    const log = await api.readNamespacedPodLog({
      name: pod,
      namespace,
      container: container ?? undefined,
      tailLines: tail,
    });
    return new NextResponse(log, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status = (err as { response?: { statusCode?: number } })?.response?.statusCode ?? 500;
    return NextResponse.json(
      { error: "Failed to get pod logs", details: message },
      { status: status >= 400 ? status : 500 }
    );
  }
}
