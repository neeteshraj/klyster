"use client";

import { useQuery } from "@tanstack/react-query";
import { useStore } from "@/store/use-store";
import { fetchWithKubeconfig } from "@/lib/api-client";
import type { ClusterOverview } from "@/lib/types";

const OVERVIEW_QUERY_KEY = "overview";

async function fetchOverview(customKubeconfig: string | null): Promise<ClusterOverview> {
  const res = await fetchWithKubeconfig("/api/overview", undefined, customKubeconfig);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.details || data.error || res.statusText);
  }
  return res.json();
}

export function useOverview() {
  const customKubeconfig = useStore((s) => s.customKubeconfig);
  return useQuery({
    queryKey: [OVERVIEW_QUERY_KEY, customKubeconfig ?? "default"],
    queryFn: () => fetchOverview(customKubeconfig),
    refetchInterval: 10000,
  });
}
