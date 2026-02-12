import { NextRequest, NextResponse } from "next/server";
import { getKubeConfigFromRequest } from "@/lib/k8s";
import { startPortForward } from "@/lib/port-forward-server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { namespace, pod, localPort, remotePort } = body as {
      namespace?: string;
      pod?: string;
      localPort?: number;
      remotePort?: number;
    };

    if (!namespace || !pod || localPort == null || remotePort == null) {
      return NextResponse.json(
        { error: "Missing namespace, pod, localPort, or remotePort" },
        { status: 400 }
      );
    }

    const local = Number(localPort);
    const remote = Number(remotePort);
    if (!Number.isInteger(local) || local < 1 || local > 65535) {
      return NextResponse.json(
        { error: "localPort must be 1–65535" },
        { status: 400 }
      );
    }
    if (!Number.isInteger(remote) || remote < 1 || remote > 65535) {
      return NextResponse.json(
        { error: "remotePort must be 1–65535" },
        { status: 400 }
      );
    }

    const kubeConfig = getKubeConfigFromRequest(request);
    await startPortForward(kubeConfig, namespace, pod, local, remote);

    return NextResponse.json({
      ok: true,
      localPort: local,
      remotePort: remote,
      message: `Forwarding localhost:${local} → ${namespace}/${pod}:${remote}`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Failed to start port forward", details: message },
      { status: 500 }
    );
  }
}
