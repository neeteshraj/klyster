import { NextRequest, NextResponse } from "next/server";
import { getCoreV1Api } from "@/lib/k8s";
import { V1ConfigMap } from "@kubernetes/client-node";
import * as yaml from "js-yaml";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const namespace = request.nextUrl.searchParams.get("namespace") ?? "default";
  if (!name) {
    return NextResponse.json({ error: "ConfigMap name is required" }, { status: 400 });
  }
  try {
    const api = getCoreV1Api(request);
    const cm = await api.readNamespacedConfigMap({ name, namespace });
    const keys = cm.data ? Object.keys(cm.data) : [];
    let yamlStr: string | undefined;
    try {
      yamlStr = yaml.dump(cm as unknown as Record<string, unknown>, {
        indent: 2,
        lineWidth: -1,
      });
    } catch {
      yamlStr = undefined;
    }
    return NextResponse.json({
      name: cm.metadata?.name ?? name,
      namespace: cm.metadata?.namespace ?? namespace,
      keys,
      yaml: yamlStr,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status = (err as { response?: { statusCode?: number } })?.response?.statusCode ?? 500;
    return NextResponse.json(
      { error: `Failed to get configmap ${name}`, details: message },
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
    return NextResponse.json({ error: "ConfigMap name is required" }, { status: 400 });
  }
  try {
    const api = getCoreV1Api(request);
    await api.deleteNamespacedConfigMap({ name, namespace });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status = (err as { response?: { statusCode?: number } })?.response?.statusCode ?? 500;
    return NextResponse.json(
      { error: `Failed to delete configmap ${name}`, details: message },
      { status: status >= 400 ? status : 500 }
    );
  }
}
