"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useStore } from "@/store/use-store";
import { fetchWithKubeconfig } from "@/lib/api-client";

export interface ReplicaSetItem {
  name: string;
  namespace: string;
  desired: number;
  current: number;
  ready: number;
  age: string;
}

async function fetchReplicaSets(
  namespace: string,
  customKubeconfig: string | null
): Promise<ReplicaSetItem[]> {
  const params = new URLSearchParams();
  if (namespace) params.set("namespace", namespace);
  const res = await fetchWithKubeconfig(
    `/api/replicasets?${params.toString()}`,
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

const REPLICASETS_QUERY_KEY = "replicasets";

export function useReplicaSets() {
  const selectedNamespace = useStore((s) => s.selectedNamespace);
  const customKubeconfig = useStore((s) => s.customKubeconfig);
  return useQuery({
    queryKey: [REPLICASETS_QUERY_KEY, selectedNamespace, customKubeconfig ?? "default"],
    queryFn: () => fetchReplicaSets(selectedNamespace, customKubeconfig),
    refetchInterval: 8000,
  });
}

export function useReplicaSetsInvalidate() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: [REPLICASETS_QUERY_KEY] });
}
