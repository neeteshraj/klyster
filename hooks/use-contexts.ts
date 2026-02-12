"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useStore } from "@/store/use-store";
import { fetchWithKubeconfig } from "@/lib/api-client";

export interface ContextInfo {
  name: string;
  cluster?: string;
  user?: string;
}

export interface ContextsResponse {
  configPath: string;
  configPaths: string[];
  currentContext: string;
  contexts: ContextInfo[];
}

async function fetchContexts(customKubeconfig: string | null): Promise<ContextsResponse> {
  const res = await fetchWithKubeconfig("/api/contexts", undefined, customKubeconfig);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.details || data.error || res.statusText);
  }
  return res.json();
}

const CONTEXTS_QUERY_KEY = "contexts";

export function useContexts() {
  const customKubeconfig = useStore((s) => s.customKubeconfig);
  return useQuery({
    queryKey: [CONTEXTS_QUERY_KEY, customKubeconfig ?? "default"],
    queryFn: () => fetchContexts(customKubeconfig),
    refetchInterval: 30000,
  });
}

export function useSetContext() {
  const queryClient = useQueryClient();
  const setSelectedCluster = useStore((s) => s.setSelectedCluster);
  const customKubeconfig = useStore((s) => s.customKubeconfig);
  return useMutation({
    mutationFn: async (context: string) => {
      const res = await fetchWithKubeconfig(
        "/api/context",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ context }),
        },
        customKubeconfig
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.details || data.error || res.statusText);
      }
      return res.json();
    },
    onSuccess: (_, context) => {
      setSelectedCluster(context);
      queryClient.invalidateQueries({ queryKey: [CONTEXTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["overview"] });
      queryClient.invalidateQueries({ queryKey: ["namespaces"] });
      queryClient.invalidateQueries({ queryKey: ["pods"] });
      queryClient.invalidateQueries({ queryKey: ["deployments"] });
    },
  });
}
