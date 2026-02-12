import { NextRequest, NextResponse } from "next/server";
import { getNetworkingV1Api } from "@/lib/k8s";
import { V1Ingress } from "@kubernetes/client-node";
import * as yaml from "js-yaml";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const namespace = request.nextUrl.searchParams.get("namespace") ?? "default";
  if (!name) {
    return NextResponse.json({ error: "Ingress name is required" }, { status: 400 });
  }
  try {
    const api = getNetworkingV1Api(request);
    const ingress = await api.readNamespacedIngress({ name, namespace });
    let yamlStr: string | undefined;
    try {
      yamlStr = yaml.dump(ingress as unknown as Record<string, unknown>, {
        indent: 2,
        lineWidth: -1,
      });
    } catch {
      yamlStr = undefined;
    }
    return NextResponse.json({
      name: ingress.metadata?.name ?? name,
      namespace: ingress.metadata?.namespace ?? namespace,
      yaml: yamlStr,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status = (err as { response?: { statusCode?: number } })?.response?.statusCode ?? 500;
    return NextResponse.json(
      { error: `Failed to get ingress ${name}`, details: message },
      { status: status >= 400 ? status : 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const namespace = request.nextUrl.searchParams.get("namespace") ?? "default";
  if (!name) {
    return NextResponse.json({ error: "Ingress name is required" }, { status: 400 });
  }
  try {
    const api = getNetworkingV1Api(request);
    await api.deleteNamespacedIngress({ name, namespace });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status = (err as { response?: { statusCode?: number } })?.response?.statusCode ?? 500;
    return NextResponse.json(
      { error: `Failed to delete ingress ${name}`, details: message },
      { status: status >= 400 ? status : 500 }
    );
  }
}
