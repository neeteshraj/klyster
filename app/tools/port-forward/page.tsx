"use client";

import { useState, useEffect, useCallback } from "react";
import { useStore } from "@/store/use-store";
import { usePods } from "@/hooks/use-pods";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NamespaceSelector } from "@/components/layout/namespace-selector";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Terminal, Play, Square, ExternalLink, List } from "lucide-react";

// Option value is "namespace/name" so we have real namespace for command and API
const POD_VALUE_SEP = "/";

export interface ActiveForwardItem {
  localPort: number;
  namespace: string;
  pod: string;
  remotePort: number;
}

export default function PortForwardPage() {
  const selectedNamespace = useStore((s) => s.selectedNamespace);
  const customKubeconfig = useStore((s) => s.customKubeconfig);
  const { data: pods, isLoading } = usePods();
  const [podValue, setPodValue] = useState(""); // "namespace/name"
  const [localPort, setLocalPort] = useState("8080");
  const [remotePort, setRemotePort] = useState("80");
  const [copied, setCopied] = useState(false);
  const [activeForwards, setActiveForwards] = useState<ActiveForwardItem[]>([]);
  const [forwardsLoading, setForwardsLoading] = useState(true);
  const [forwardError, setForwardError] = useState<string | null>(null);
  const [stoppingPort, setStoppingPort] = useState<number | null>(null);

  const fetchActiveForwards = useCallback(async () => {
    try {
      const res = await fetch("/api/port-forward/list");
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.items)) {
        setActiveForwards(data.items);
      }
    } catch {
      setActiveForwards([]);
    } finally {
      setForwardsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveForwards();
    const interval = setInterval(fetchActiveForwards, 3000);
    return () => clearInterval(interval);
  }, [fetchActiveForwards]);

  const [podNamespace, podName] = podValue.includes(POD_VALUE_SEP)
    ? podValue.split(POD_VALUE_SEP, 2)
    : ["", ""];
  const namespace = podNamespace || (selectedNamespace === "_all" ? "default" : selectedNamespace);
  const pod = podName;
  const cmd = `kubectl port-forward -n ${namespace} ${pod || "<pod>"} ${localPort || "8080"}:${remotePort || "80"}`;

  const copyCommand = () => {
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startForward = async () => {
    if (!pod || !podNamespace) {
      setForwardError("Select a pod first.");
      return;
    }
    const local = parseInt(localPort, 10);
    const remote = parseInt(remotePort, 10);
    if (!Number.isInteger(local) || local < 1 || local > 65535) {
      setForwardError("Enter a valid local port (1–65535).");
      return;
    }
    if (!Number.isInteger(remote) || remote < 1 || remote > 65535) {
      setForwardError("Enter a valid remote port (1–65535).");
      return;
    }
    setForwardError(null);
    const headers: Record<string, string> = {};
    if (customKubeconfig?.trim()) {
      try {
        const base64 =
          typeof btoa !== "undefined"
            ? btoa(unescape(encodeURIComponent(customKubeconfig)))
            : Buffer.from(customKubeconfig, "utf-8").toString("base64");
        headers["X-Kubeconfig"] = base64;
      } catch {
        setForwardError("Invalid kubeconfig.");
        return;
      }
    }
    try {
      const res = await fetch("/api/port-forward/start", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({
          namespace: podNamespace,
          pod,
          localPort: local,
          remotePort: remote,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setForwardError(data.details || data.error || res.statusText || "Failed to start port forward");
        return;
      }
      await fetchActiveForwards();
    } catch (e) {
      setForwardError(e instanceof Error ? e.message : "Failed to start port forward");
    }
  };

  const stopForward = async (port: number) => {
    setStoppingPort(port);
    try {
      await fetch(`/api/port-forward/stop?port=${port}`, { method: "DELETE" });
      await fetchActiveForwards();
    } finally {
      setStoppingPort(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Port Forward</h1>
        <NamespaceSelector />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Forward local port to a pod
          </CardTitle>
          <CardDescription>
            Select a pod and ports, then run the kubectl command in your terminal to forward
            traffic from your machine to the pod.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Active port forwards list */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <List className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Active port forwards</Label>
            </div>
            {forwardsLoading ? (
              <Skeleton className="h-16 w-full rounded-lg" />
            ) : activeForwards.length === 0 ? (
              <p className="text-sm text-muted-foreground rounded-lg border border-dashed p-4">
                No active port forwards. Start one below.
              </p>
            ) : (
              <>
                <ul className="space-y-2">
                {activeForwards.map((f) => {
                  const connectHost = typeof window !== "undefined" ? window.location.hostname : "localhost";
                  const connectUrl = `http://${connectHost}:${f.localPort}`;
                  return (
                  <li
                    key={f.localPort}
                    className="flex flex-col gap-2 rounded-lg border border-green-500/30 bg-green-500/5 p-3 text-sm"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-green-700 dark:text-green-400">
                        {connectHost}:{f.localPort} → {f.namespace}/{f.pod}:{f.remotePort}
                      </span>
                      <a
                        href={connectUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Open
                      </a>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => stopForward(f.localPort)}
                        disabled={stoppingPort === f.localPort}
                      >
                        <Square className="h-3.5 w-3.5 mr-1" />
                        {stoppingPort === f.localPort ? "Stopping…" : "Stop"}
                      </Button>
                    </div>
                  </li>
                  );
                })}
              </ul>
              <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 mt-2 text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">Can&apos;t connect?</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>The link above uses your current host ({typeof window !== "undefined" ? window.location.hostname : "localhost"}). Use it from the same machine where this app is running.</li>
                  <li><strong>Docker:</strong> Publish the port when starting the container, e.g. <code className="bg-muted px-1 rounded">-p {activeForwards[0]?.localPort ?? "PORT"}:{activeForwards[0]?.localPort ?? "PORT"}</code>, then open the same host and port from your host machine.</li>
                  <li><strong>Remote server:</strong> Connect to <code className="bg-muted px-1 rounded">http://&lt;server-ip&gt;:{activeForwards[0]?.localPort ?? "PORT"}</code> and ensure the server firewall allows that port.</li>
                </ul>
              </div>
              </>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pod">Pod</Label>
              {isLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <select
                  id="pod"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={podValue}
                  onChange={(e) => setPodValue(e.target.value)}
                >
                  <option value="">Select a pod</option>
                  {(pods ?? []).map((p) => (
                    <option key={`${p.namespace}/${p.name}`} value={`${p.namespace}${POD_VALUE_SEP}${p.name}`}>
                      {p.name} ({p.namespace})
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="local">Local port</Label>
              <Input
                id="local"
                type="number"
                min={1}
                max={65535}
                value={localPort}
                onChange={(e) => setLocalPort(e.target.value)}
                placeholder="8080"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="remote">Remote (container) port</Label>
              <Input
                id="remote"
                type="number"
                min={1}
                max={65535}
                value={remotePort}
                onChange={(e) => setRemotePort(e.target.value)}
                placeholder="80"
              />
            </div>
          </div>

          {forwardError && (
            <p className="text-sm text-destructive">{forwardError}</p>
          )}
          <Button onClick={startForward} disabled={!pod}>
            <Play className="h-4 w-4 mr-2" />
            Forward to localhost
          </Button>

          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <Label className="text-muted-foreground text-xs">kubectl command</Label>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-background px-3 py-2 text-sm font-mono break-all">
                {cmd}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={copyCommand}
                title="Copy command"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            {copied && (
              <p className="text-xs text-muted-foreground">Copied to clipboard.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
