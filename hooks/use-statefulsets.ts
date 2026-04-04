"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useStore } from "@/store/use-store";
import { fetchWithKubeconfig } from "@/lib/api-client";

export interface StatefulSetItem {
  name: string;
  namespace: string;
  ready: string;
  replicas: number;
  age: string;
}

async function fetchStatefulSets(
  namespace: string,
  customKubeconfig: string | null
): Promise<StatefulSetItem[]> {
  const params = new URLSearchParams();
  if (namespace) params.set("namespace", namespace);
  const res = await fetchWithKubeconfig(
    `/api/statefulsets?${params.toString()}`,
    undefined,
    customKubeconfig
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.details || data.error || res.statusText);
  }
  const data = await res.json();
  return data.items ?? [];
}

const STATEFULSETS_QUERY_KEY = "statefulsets";

export function useStatefulSets() {
  const selectedNamespace = useStore((s) => s.selectedNamespace);
  const customKubeconfig = useStore((s) => s.customKubeconfig);
  return useQuery({
    queryKey: [STATEFULSETS_QUERY_KEY, selectedNamespace, customKubeconfig ?? "default"],
    queryFn: () => fetchStatefulSets(selectedNamespace, customKubeconfig),
    refetchInterval: 8000,
  });
}

export function useStatefulSetsInvalidate() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: [STATEFULSETS_QUERY_KEY] });
}
