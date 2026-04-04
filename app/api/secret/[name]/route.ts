import { NextRequest, NextResponse } from "next/server";
import { getCoreV1Api } from "@/lib/k8s";
import { V1Secret } from "@kubernetes/client-node";
import * as yaml from "js-yaml";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const namespace = request.nextUrl.searchParams.get("namespace") ?? "default";
  if (!name) {
    return NextResponse.json({ error: "Secret name is required" }, { status: 400 });
  }
  try {
    const api = getCoreV1Api(request);
    const secret = await api.readNamespacedSecret({ name, namespace });
    const keys = secret.data ? Object.keys(secret.data) : [];
    let yamlStr: string | undefined;
    try {
      yamlStr = yaml.dump(secret as unknown as Record<string, unknown>, {
        indent: 2,
        lineWidth: -1,
      });
    } catch {
      yamlStr = undefined;
    }
    // Extract base64-encoded data values
    const dataEntries: Record<string, string> = {};
    if (secret.data) {
      for (const [k, v] of Object.entries(secret.data)) {
        dataEntries[k] = typeof v === "string" ? v : String(v);
      }
    }

    return NextResponse.json({
      name: secret.metadata?.name ?? name,
      namespace: secret.metadata?.namespace ?? namespace,
      type: secret.type ?? "Opaque",
      keys,
      data: dataEntries,
      yaml: yamlStr,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status = (err as { response?: { statusCode?: number } })?.response?.statusCode ?? 500;
    return NextResponse.json(
      { error: `Failed to get secret ${name}`, details: message },
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
    return NextResponse.json({ error: "Secret name is required" }, { status: 400 });
  }
  try {
    const api = getCoreV1Api(request);
    await api.deleteNamespacedSecret({ name, namespace });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status = (err as { response?: { statusCode?: number } })?.response?.statusCode ?? 500;
    return NextResponse.json(
      { error: `Failed to delete secret ${name}`, details: message },
      { status: status >= 400 ? status : 500 }
    );
  }
}
