"use client";

import { useQuery } from "@tanstack/react-query";
import { useStore } from "@/store/use-store";
import { fetchWithKubeconfig } from "@/lib/api-client";
import type { SecretItem } from "@/lib/types";

const SECRETS_QUERY_KEY = "secrets";

async function fetchSecrets(
  namespace: string,
  customKubeconfig: string | null
): Promise<SecretItem[]> {
  const params = new URLSearchParams();
  if (namespace) params.set("namespace", namespace);
  const res = await fetchWithKubeconfig(
    `/api/secrets?${params.toString()}`,
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

export function useSecrets() {
  const selectedNamespace = useStore((s) => s.selectedNamespace);
  const customKubeconfig = useStore((s) => s.customKubeconfig);
  return useQuery({
    queryKey: [SECRETS_QUERY_KEY, selectedNamespace, customKubeconfig ?? "default"],
    queryFn: () => fetchSecrets(selectedNamespace, customKubeconfig),
    refetchInterval: 10000,
  });
}
