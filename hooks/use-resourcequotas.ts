"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useStore } from "@/store/use-store";
import { fetchWithKubeconfig } from "@/lib/api-client";

export interface ResourceQuotaItem {
  name: string;
  namespace: string;
  age: string;
  hard: Record<string, string>;
  used: Record<string, string>;
}

async function fetchResourceQuotas(
  namespace: string,
  customKubeconfig: string | null
): Promise<ResourceQuotaItem[]> {
  const params = new URLSearchParams();
  if (namespace) params.set("namespace", namespace);
  const res = await fetchWithKubeconfig(
    `/api/resourcequotas?${params.toString()}`,
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

const RESOURCEQUOTAS_QUERY_KEY = "resourcequotas";

export function useResourceQuotas() {
  const selectedNamespace = useStore((s) => s.selectedNamespace);
  const customKubeconfig = useStore((s) => s.customKubeconfig);
  return useQuery({
    queryKey: [RESOURCEQUOTAS_QUERY_KEY, selectedNamespace, customKubeconfig ?? "default"],
    queryFn: () => fetchResourceQuotas(selectedNamespace, customKubeconfig),
    refetchInterval: 10000,
  });
}

export function useResourceQuotasInvalidate() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: [RESOURCEQUOTAS_QUERY_KEY] });
}
