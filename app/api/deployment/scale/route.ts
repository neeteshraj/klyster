import { NextRequest, NextResponse } from "next/server";
import { getAppsV1Api } from "@/lib/k8s";
import type { DeploymentScalePayload } from "@/lib/types";

export async function POST(request: NextRequest) {
  let body: DeploymentScalePayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }
  const { namespace, name, replicas } = body;
  if (!namespace || !name || typeof replicas !== "number" || replicas < 0) {
    return NextResponse.json(
      { error: "namespace, name, and replicas (number >= 0) are required" },
      { status: 400 }
    );
  }
  try {
    const api = getAppsV1Api(request);
    const deployment = await api.readNamespacedDeployment({ name, namespace });
    if (!deployment?.spec) {
      return NextResponse.json(
        { error: "Deployment has no spec" },
        { status: 400 }
      );
    }
    deployment.spec.replicas = replicas;
    await api.replaceNamespacedDeployment({ name, namespace, body: deployment });
    return NextResponse.json({ success: true, replicas });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status = (err as { response?: { statusCode?: number } })?.response?.statusCode ?? 500;
    return NextResponse.json(
      { error: "Failed to scale deployment", details: message },
      { status: status >= 400 ? status : 500 }
    );
  }
}
