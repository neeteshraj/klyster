"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useStore } from "@/store/use-store";
import { fetchWithKubeconfig } from "@/lib/api-client";
import type { PodDetail } from "@/lib/types";

const POD_DETAIL_QUERY_KEY = "pod-detail";

async function fetchPodDetail(
  name: string,
  namespace: string,
  customKubeconfig: string | null
): Promise<PodDetail> {
  const params = new URLSearchParams({ namespace });
  const res = await fetchWithKubeconfig(
    `/api/pod/${encodeURIComponent(name)}?${params.toString()}`,
    undefined,
    customKubeconfig
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.details || data.error || res.statusText);
  }
  return res.json();
}

export function usePodDetail(name: string | null, namespace: string) {
  const customKubeconfig = useStore((s) => s.customKubeconfig);
  const query = useQuery({
    queryKey: [POD_DETAIL_QUERY_KEY, name, namespace, customKubeconfig ?? "default"],
    queryFn: () => fetchPodDetail(name!, namespace, customKubeconfig),
    enabled: !!name && !!namespace,
    refetchInterval: 5000,
  });
  return query;
}

export function usePodDetailInvalidate() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: [POD_DETAIL_QUERY_KEY] });
}
