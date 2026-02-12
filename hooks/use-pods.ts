"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useStore } from "@/store/use-store";
import { fetchWithKubeconfig } from "@/lib/api-client";
import type { PodItem } from "@/lib/types";

const PODS_QUERY_KEY = "pods";

async function fetchPods(namespace: string, customKubeconfig: string | null): Promise<PodItem[]> {
  const params = new URLSearchParams();
  if (namespace) params.set("namespace", namespace);
  const res = await fetchWithKubeconfig(`/api/pods?${params.toString()}`, undefined, customKubeconfig);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.details || data.error || res.statusText);
  }
  const data = await res.json();
  return data.items ?? [];
}

export function usePods() {
  const selectedNamespace = useStore((s) => s.selectedNamespace);
  const customKubeconfig = useStore((s) => s.customKubeconfig);
  const query = useQuery({
    queryKey: [PODS_QUERY_KEY, selectedNamespace, customKubeconfig ?? "default"],
    queryFn: () => fetchPods(selectedNamespace, customKubeconfig),
    refetchInterval: 8000,
  });
  return query;
}

export function usePodsInvalidate() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: [PODS_QUERY_KEY] });
}
