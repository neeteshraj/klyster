import { NextRequest, NextResponse } from "next/server";
import { getNetworkingV1Api } from "@/lib/k8s";
import { V1IngressClass } from "@kubernetes/client-node";
import * as yaml from "js-yaml";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  if (!name) {
    return NextResponse.json({ error: "IngressClass name is required" }, { status: 400 });
  }
  try {
    const api = getNetworkingV1Api(_request);
    const ic = await api.readIngressClass({ name });
    let yamlStr: string | undefined;
    try {
      yamlStr = yaml.dump(ic as unknown as Record<string, unknown>, {
        indent: 2,
        lineWidth: -1,
      });
    } catch {
      yamlStr = undefined;
    }
    return NextResponse.json({
      name: ic.metadata?.name ?? name,
      controller: ic.spec?.controller ?? "—",
      yaml: yamlStr,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status = (err as { response?: { statusCode?: number } })?.response?.statusCode ?? 500;
    return NextResponse.json(
      { error: `Failed to get ingress class ${name}`, details: message },
      { status: status >= 400 ? status : 500 }
    );
  }
}
