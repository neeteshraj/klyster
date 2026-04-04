import { NextRequest, NextResponse } from "next/server";
import { getBatchV1Api } from "@/lib/k8s";
import { formatAge } from "@/lib/format";
import { V1Job } from "@kubernetes/client-node";

export interface JobItem {
  name: string;
  namespace: string;
  completions: string;
  duration: string;
  status: "Complete" | "Running" | "Failed";
  age: string;
}

export async function GET(request: NextRequest) {
  const namespace = request.nextUrl.searchParams.get("namespace") ?? "default";
  try {
    const api = getBatchV1Api(request);
    const res =
      namespace === "_all"
        ? await api.listJobForAllNamespaces()
        : await api.listNamespacedJob({ namespace });
    const items: JobItem[] = (res.items || []).map((j) => jobToItem(j));
    return NextResponse.json({ items });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status = (err as { response?: { statusCode?: number } })?.response?.statusCode ?? 500;
    return NextResponse.json(
      { error: "Failed to list jobs", details: message },
      { status: status >= 400 ? status : 500 }
    );
  }
}

function jobToItem(j: V1Job): JobItem {
  const name = j.metadata?.name ?? "";
  const ns = j.metadata?.namespace ?? "";
  const specCompletions = j.spec?.completions ?? 1;
  const succeeded = j.status?.succeeded ?? 0;
  const active = j.status?.active ?? 0;
  const failed = j.status?.failed ?? 0;

  let status: JobItem["status"] = "Running";
  if (succeeded >= specCompletions) {
    status = "Complete";
  } else if (failed > 0 && active === 0) {
    status = "Failed";
  }

  const completions = `${succeeded}/${specCompletions}`;

  let duration = "—";
  if (j.status?.startTime) {
    const start = new Date(j.status.startTime as string | Date).getTime();
    const end = j.status?.completionTime
      ? new Date(j.status.completionTime as string | Date).getTime()
      : Date.now();
    const sec = Math.floor((end - start) / 1000);
    if (sec < 60) duration = `${sec}s`;
    else if (sec < 3600) duration = `${Math.floor(sec / 60)}m${sec % 60}s`;
    else duration = `${Math.floor(sec / 3600)}h${Math.floor((sec % 3600) / 60)}m`;
  }

  const age = j.metadata?.creationTimestamp
    ? formatAge(j.metadata.creationTimestamp as string | Date)
    : "—";

  return { name, namespace: ns, completions, duration, status, age };
}
