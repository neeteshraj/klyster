"use client";

import { useQuery } from "@tanstack/react-query";
import { useStore } from "@/store/use-store";
import { fetchWithKubeconfig } from "@/lib/api-client";
import type { NodeItem } from "@/lib/types";

const NODES_QUERY_KEY = "nodes";

async function fetchNodes(customKubeconfig: string | null): Promise<NodeItem[]> {
  const res = await fetchWithKubeconfig("/api/nodes", undefined, customKubeconfig);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.details || data.error || res.statusText);
  }
  const data = await res.json();
  return data.items ?? [];
}

export function useNodes() {
  const customKubeconfig = useStore((s) => s.customKubeconfig);
  return useQuery({
    queryKey: [NODES_QUERY_KEY, customKubeconfig ?? "default"],
    queryFn: () => fetchNodes(customKubeconfig),
    refetchInterval: 10000,
  });
}
