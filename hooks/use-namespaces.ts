"use client";

import { useQuery } from "@tanstack/react-query";
import { useStore } from "@/store/use-store";
import { fetchWithKubeconfig } from "@/lib/api-client";
import type { NamespaceItem } from "@/lib/types";

const NAMESPACES_QUERY_KEY = "namespaces";

async function fetchNamespaces(customKubeconfig: string | null): Promise<NamespaceItem[]> {
  const res = await fetchWithKubeconfig("/api/namespaces", undefined, customKubeconfig);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.details || data.error || res.statusText);
  }
  const data = await res.json();
  return data.items ?? [];
}

export function useNamespaces() {
  const customKubeconfig = useStore((s) => s.customKubeconfig);
  return useQuery({
    queryKey: [NAMESPACES_QUERY_KEY, customKubeconfig ?? "default"],
    queryFn: () => fetchNamespaces(customKubeconfig),
    refetchInterval: 10000,
  });
}
