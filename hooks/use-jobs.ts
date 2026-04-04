"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useStore } from "@/store/use-store";
import { fetchWithKubeconfig } from "@/lib/api-client";

export interface JobItem {
  name: string;
  namespace: string;
  completions: string;
  duration: string;
  status: "Complete" | "Running" | "Failed";
  age: string;
}

async function fetchJobs(
  namespace: string,
  customKubeconfig: string | null
): Promise<JobItem[]> {
  const params = new URLSearchParams();
  if (namespace) params.set("namespace", namespace);
  const res = await fetchWithKubeconfig(
    `/api/jobs?${params.toString()}`,
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

const JOBS_QUERY_KEY = "jobs";

export function useJobs() {
  const selectedNamespace = useStore((s) => s.selectedNamespace);
  const customKubeconfig = useStore((s) => s.customKubeconfig);
  return useQuery({
    queryKey: [JOBS_QUERY_KEY, selectedNamespace, customKubeconfig ?? "default"],
    queryFn: () => fetchJobs(selectedNamespace, customKubeconfig),
    refetchInterval: 8000,
  });
}

export function useJobsInvalidate() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: [JOBS_QUERY_KEY] });
}
