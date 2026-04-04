import { NextRequest, NextResponse } from "next/server";
import { getBatchV1Api } from "@/lib/k8s";
import { formatAge } from "@/lib/format";
import { V1CronJob } from "@kubernetes/client-node";

export interface CronJobItem {
  name: string;
  namespace: string;
  schedule: string;
  suspend: boolean;
  active: number;
  lastSchedule: string;
  age: string;
}

export async function GET(request: NextRequest) {
  const namespace = request.nextUrl.searchParams.get("namespace") ?? "default";
  try {
    const api = getBatchV1Api(request);
    const res =
      namespace === "_all"
        ? await api.listCronJobForAllNamespaces()
        : await api.listNamespacedCronJob({ namespace });
    const items: CronJobItem[] = (res.items || []).map((c) =>
      cronJobToItem(c)
    );
    return NextResponse.json({ items });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status = (err as { response?: { statusCode?: number } })?.response?.statusCode ?? 500;
    return NextResponse.json(
      { error: "Failed to list cronjobs", details: message },
      { status: status >= 400 ? status : 500 }
    );
  }
}

function cronJobToItem(c: V1CronJob): CronJobItem {
  const name = c.metadata?.name ?? "";
  const ns = c.metadata?.namespace ?? "";
  const schedule = c.spec?.schedule ?? "";
  const suspend = c.spec?.suspend ?? false;
  const active = c.status?.active?.length ?? 0;
  const lastSchedule = c.status?.lastScheduleTime
    ? formatAge(c.status.lastScheduleTime as string | Date)
    : "—";
  const age = c.metadata?.creationTimestamp
    ? formatAge(c.metadata.creationTimestamp as string | Date)
    : "—";

  return { name, namespace: ns, schedule, suspend, active, lastSchedule, age };
}
