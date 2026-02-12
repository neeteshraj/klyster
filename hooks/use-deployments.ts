"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useStore } from "@/store/use-store";
import { fetchWithKubeconfig } from "@/lib/api-client";

export interface DeploymentItem {
  name: string;
  namespace: string;
  ready: string;
  replicas: number;
  upToDate: number;
  available: number;
  age: string;
}

async function fetchDeployments(
  namespace: string,
  customKubeconfig: string | null
): Promise<DeploymentItem[]> {
  const params = new URLSearchParams();
  if (namespace) params.set("namespace", namespace);
  const res = await fetchWithKubeconfig(
    `/api/deployments?${params.toString()}`,
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

const DEPLOYMENTS_QUERY_KEY = "deployments";

export function useDeployments() {
  const selectedNamespace = useStore((s) => s.selectedNamespace);
  const customKubeconfig = useStore((s) => s.customKubeconfig);
  return useQuery({
    queryKey: [DEPLOYMENTS_QUERY_KEY, selectedNamespace, customKubeconfig ?? "default"],
    queryFn: () => fetchDeployments(selectedNamespace, customKubeconfig),
    refetchInterval: 8000,
  });
}

export function useDeploymentsInvalidate() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: [DEPLOYMENTS_QUERY_KEY] });
}
