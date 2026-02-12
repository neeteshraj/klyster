import { NextRequest, NextResponse } from "next/server";
import { getCoreV1Api } from "@/lib/k8s";
import { V1Service } from "@kubernetes/client-node";
import * as yaml from "js-yaml";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const namespace = request.nextUrl.searchParams.get("namespace") ?? "default";
  if (!name) {
    return NextResponse.json({ error: "Service name is required" }, { status: 400 });
  }
  try {
    const api = getCoreV1Api(request);
    const svc = await api.readNamespacedService({ name, namespace });
    let yamlStr: string | undefined;
    try {
      yamlStr = yaml.dump(svc as unknown as Record<string, unknown>, {
        indent: 2,
        lineWidth: -1,
      });
    } catch {
      yamlStr = undefined;
    }
    return NextResponse.json({
      name: svc.metadata?.name ?? name,
      namespace: svc.metadata?.namespace ?? namespace,
      type: svc.spec?.type ?? "ClusterIP",
      clusterIP: svc.spec?.clusterIP ?? "None",
      yaml: yamlStr,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status = (err as { response?: { statusCode?: number } })?.response?.statusCode ?? 500;
    return NextResponse.json(
      { error: `Failed to get service ${name}`, details: message },
      { status: status >= 400 ? status : 500 }
    );
  }
}
