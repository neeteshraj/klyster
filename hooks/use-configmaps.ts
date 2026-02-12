"use client";

import { useQuery } from "@tanstack/react-query";
import { useStore } from "@/store/use-store";
import { fetchWithKubeconfig } from "@/lib/api-client";
import type { ConfigMapItem } from "@/lib/types";

const CONFIGMAPS_QUERY_KEY = "configmaps";

async function fetchConfigMaps(
  namespace: string,
  customKubeconfig: string | null
): Promise<ConfigMapItem[]> {
  const params = new URLSearchParams();
  if (namespace) params.set("namespace", namespace);
  const res = await fetchWithKubeconfig(
    `/api/configmaps?${params.toString()}`,
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

export function useConfigMaps() {
  const selectedNamespace = useStore((s) => s.selectedNamespace);
  const customKubeconfig = useStore((s) => s.customKubeconfig);
  return useQuery({
    queryKey: [CONFIGMAPS_QUERY_KEY, selectedNamespace, customKubeconfig ?? "default"],
    queryFn: () => fetchConfigMaps(selectedNamespace, customKubeconfig),
    refetchInterval: 10000,
  });
}
