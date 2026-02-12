"use client";

import { useQuery } from "@tanstack/react-query";
import { useStore } from "@/store/use-store";
import { fetchWithKubeconfig } from "@/lib/api-client";
import type { NodeDetail } from "@/lib/types";

const NODE_DETAIL_QUERY_KEY = "node-detail";

async function fetchNodeDetail(
  name: string,
  customKubeconfig: string | null
): Promise<NodeDetail> {
  const res = await fetchWithKubeconfig(
    `/api/node/${encodeURIComponent(name)}`,
    undefined,
    customKubeconfig
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.details || data.error || res.statusText);
  }
  return res.json();
}

export function useNodeDetail(name: string | null) {
  const customKubeconfig = useStore((s) => s.customKubeconfig);
  return useQuery({
    queryKey: [NODE_DETAIL_QUERY_KEY, name, customKubeconfig ?? "default"],
    queryFn: () => fetchNodeDetail(name!, customKubeconfig),
    enabled: !!name,
    refetchInterval: 10000,
  });
}
