"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useStore } from "@/store/use-store";
import { fetchWithKubeconfig } from "@/lib/api-client";

export interface HPAItem {
  name: string;
  namespace: string;
  reference: string;
  minReplicas: number;
  maxReplicas: number;
  currentReplicas: number;
  age: string;
}

async function fetchHPAs(
  namespace: string,
  customKubeconfig: string | null
): Promise<HPAItem[]> {
  const params = new URLSearchParams();
  if (namespace) params.set("namespace", namespace);
  const res = await fetchWithKubeconfig(
    `/api/hpas?${params.toString()}`,
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

const HPAS_QUERY_KEY = "hpas";

export function useHPAs() {
  const selectedNamespace = useStore((s) => s.selectedNamespace);
  const customKubeconfig = useStore((s) => s.customKubeconfig);
  return useQuery({
    queryKey: [HPAS_QUERY_KEY, selectedNamespace, customKubeconfig ?? "default"],
    queryFn: () => fetchHPAs(selectedNamespace, customKubeconfig),
    refetchInterval: 10000,
  });
}

export function useHPAsInvalidate() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: [HPAS_QUERY_KEY] });
}
