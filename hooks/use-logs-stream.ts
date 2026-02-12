"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/store/use-store";
import { getKubeconfigHeader } from "@/lib/api-client";

export function useLogsStream(
  namespace: string,
  pod: string,
  container: string,
  enabled: boolean
) {
  const customKubeconfig = useStore((s) => s.customKubeconfig);
  const [logs, setLogs] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!enabled || !pod || !namespace) {
      setLogs("");
      setError(null);
      setConnected(false);
      return;
    }

    const params = new URLSearchParams({
      namespace,
      pod,
    });
    if (container) params.set("container", container);
    const header = getKubeconfigHeader(customKubeconfig);
    const kubeconfigB64 = header["X-Kubeconfig"];
    if (kubeconfigB64) params.set("kubeconfig", kubeconfigB64);
    const url = `/api/logs/stream?${params.toString()}`;
    const eventSource = new EventSource(url);

    eventSource.onopen = () => setConnected(true);
    eventSource.onerror = () => {
      setError("Connection lost");
      eventSource.close();
    };
    eventSource.addEventListener("connected", () => {
      setError(null);
    });
    eventSource.addEventListener("error", ((e: MessageEvent) => {
      setError(e.data || "Stream error");
    }) as EventListener);

    eventSource.onmessage = (event) => {
      const text = event.data;
      setLogs((prev) => {
        const next = prev + text;
        rafRef.current = requestAnimationFrame(() => {
          logEndRef.current?.scrollIntoView({ behavior: "smooth" });
        });
        return next;
      });
    };

    return () => {
      eventSource.close();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setConnected(false);
    };
  }, [enabled, namespace, pod, container, customKubeconfig]);

  return { logs, error, connected, logEndRef };
}
