"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useStore } from "@/store/use-store";
import { fetchWithKubeconfig } from "@/lib/api-client";

export interface LimitRangeLimit {
  type: string;
  resource: string;
  min?: string;
  max?: string;
  default?: string;
  defaultRequest?: string;
}

export interface LimitRangeItem {
  name: string;
  namespace: string;
  age: string;
  limits: LimitRangeLimit[];
}

async function fetchLimitRanges(
  namespace: string,
  customKubeconfig: string | null
): Promise<LimitRangeItem[]> {
  const params = new URLSearchParams();
  if (namespace) params.set("namespace", namespace);
  const res = await fetchWithKubeconfig(
    `/api/limitranges?${params.toString()}`,
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

const LIMITRANGES_QUERY_KEY = "limitranges";

export function useLimitRanges() {
  const selectedNamespace = useStore((s) => s.selectedNamespace);
  const customKubeconfig = useStore((s) => s.customKubeconfig);
  return useQuery({
    queryKey: [LIMITRANGES_QUERY_KEY, selectedNamespace, customKubeconfig ?? "default"],
    queryFn: () => fetchLimitRanges(selectedNamespace, customKubeconfig),
    refetchInterval: 10000,
  });
}

export function useLimitRangesInvalidate() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: [LIMITRANGES_QUERY_KEY] });
}
