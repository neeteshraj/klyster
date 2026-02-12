"use client";

import { useQuery } from "@tanstack/react-query";
import { useStore } from "@/store/use-store";
import { fetchWithKubeconfig } from "@/lib/api-client";
import type { IngressItem } from "@/lib/types";

const INGRESSES_QUERY_KEY = "ingresses";

async function fetchIngresses(
  namespace: string,
  customKubeconfig: string | null
): Promise<IngressItem[]> {
  const params = new URLSearchParams();
  if (namespace) params.set("namespace", namespace);
  const res = await fetchWithKubeconfig(
    `/api/ingresses?${params.toString()}`,
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

export function useIngresses() {
  const selectedNamespace = useStore((s) => s.selectedNamespace);
  const customKubeconfig = useStore((s) => s.customKubeconfig);
  return useQuery({
    queryKey: [INGRESSES_QUERY_KEY, selectedNamespace, customKubeconfig ?? "default"],
    queryFn: () => fetchIngresses(selectedNamespace, customKubeconfig),
    refetchInterval: 10000,
  });
}
