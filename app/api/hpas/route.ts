import { NextRequest, NextResponse } from "next/server";
import { getAutoscalingV2Api } from "@/lib/k8s";
import { formatAge } from "@/lib/format";
import { V2HorizontalPodAutoscaler } from "@kubernetes/client-node";

export interface HPAItem {
  name: string;
  namespace: string;
  reference: string;
  minReplicas: number;
  maxReplicas: number;
  currentReplicas: number;
  age: string;
}

export async function GET(request: NextRequest) {
  const namespace = request.nextUrl.searchParams.get("namespace") ?? "default";
  try {
    const api = getAutoscalingV2Api(request);
    const res =
      namespace === "_all"
        ? await api.listHorizontalPodAutoscalerForAllNamespaces()
        : await api.listNamespacedHorizontalPodAutoscaler({ namespace });
    const items: HPAItem[] = (res.items || []).map((hpa) =>
      hpaToItem(hpa)
    );
    return NextResponse.json({ items });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status = (err as { response?: { statusCode?: number } })?.response?.statusCode ?? 500;
    return NextResponse.json(
      { error: "Failed to list HPAs", details: message },
      { status: status >= 400 ? status : 500 }
    );
  }
}

function hpaToItem(hpa: V2HorizontalPodAutoscaler): HPAItem {
  const name = hpa.metadata?.name ?? "";
  const ns = hpa.metadata?.namespace ?? "";
  const ref = hpa.spec?.scaleTargetRef;
  const reference = ref ? `${ref.kind}/${ref.name}` : "—";
  const age = hpa.metadata?.creationTimestamp
    ? formatAge(hpa.metadata.creationTimestamp as string | Date)
    : "—";
  return {
    name,
    namespace: ns,
    reference,
    minReplicas: hpa.spec?.minReplicas ?? 0,
    maxReplicas: hpa.spec?.maxReplicas ?? 0,
    currentReplicas: hpa.status?.currentReplicas ?? 0,
    age,
  };
}
