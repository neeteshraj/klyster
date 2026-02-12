import { NextRequest, NextResponse } from "next/server";
import { getAppsV1Api } from "@/lib/k8s";

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
    const api = getAppsV1Api(request);
    const deployment = await api.readNamespacedDeployment({ name, namespace });
    if (!deployment.spec?.template?.metadata) {
      return NextResponse.json(
        { error: "Deployment has no pod template" },
        { status: 400 }
      );
    }
    const annotations = { ...deployment.spec.template.metadata.annotations } as Record<string, string> | undefined;
    const restartedAt = new Date().toISOString();
    const patch = {
      spec: {
        template: {
          metadata: {
            annotations: {
              ...annotations,
              "kubectl.kubernetes.io/restartedAt": restartedAt,
            },
          },
        },
      },
    };
    await api.patchNamespacedDeployment({ name, namespace, body: patch });
    return NextResponse.json({ success: true, restartedAt });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status = (err as { response?: { statusCode?: number } })?.response?.statusCode ?? 500;
    return NextResponse.json(
      { error: "Failed to restart deployment", details: message },
      { status: status >= 400 ? status : 500 }
    );
  }
}
