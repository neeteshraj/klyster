"use client";

import { useQuery } from "@tanstack/react-query";
import { useStore } from "@/store/use-store";
import { fetchWithKubeconfig } from "@/lib/api-client";
import type { IngressClassItem } from "@/lib/types";

const INGRESS_CLASSES_QUERY_KEY = "ingress-classes";

async function fetchIngressClasses(
  customKubeconfig: string | null
): Promise<IngressClassItem[]> {
  const res = await fetchWithKubeconfig(
    "/api/ingressclasses",
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

export function useIngressClasses() {
  const customKubeconfig = useStore((s) => s.customKubeconfig);
  return useQuery({
    queryKey: [INGRESS_CLASSES_QUERY_KEY, customKubeconfig ?? "default"],
    queryFn: () => fetchIngressClasses(customKubeconfig),
    refetchInterval: 30000,
  });
}
