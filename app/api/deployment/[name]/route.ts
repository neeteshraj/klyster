import { NextRequest, NextResponse } from "next/server";
import { getAppsV1Api } from "@/lib/k8s";
import * as yaml from "js-yaml";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const namespace = request.nextUrl.searchParams.get("namespace") ?? "default";
  if (!name) {
    return NextResponse.json(
      { error: "Deployment name is required" },
      { status: 400 }
    );
  }
  try {
    const api = getAppsV1Api(request);
    const deployment = await api.readNamespacedDeployment({ name, namespace });
    let yamlStr: string | undefined;
    try {
      yamlStr = yaml.dump(deployment as unknown as Record<string, unknown>, {
        indent: 2,
        lineWidth: -1,
      });
    } catch {
      yamlStr = undefined;
    }
    return NextResponse.json({
      name: deployment.metadata?.name,
      namespace: deployment.metadata?.namespace,
      yaml: yamlStr,
      raw: deployment,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status = (err as { response?: { statusCode?: number } })?.response?.statusCode ?? 500;
    return NextResponse.json(
      { error: `Failed to get deployment ${name}`, details: message },
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
    return NextResponse.json(
      { error: "Deployment name is required" },
      { status: 400 }
    );
  }
  try {
    const api = getAppsV1Api(request);
    await api.deleteNamespacedDeployment({ name, namespace });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status = (err as { response?: { statusCode?: number } })?.response?.statusCode ?? 500;
    return NextResponse.json(
      { error: `Failed to delete deployment ${name}`, details: message },
      { status: status >= 400 ? status : 500 }
    );
  }
}
