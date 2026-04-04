"use client";

import { useCallback, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useStore } from "@/store/use-store";
import { fetchWithKubeconfig } from "@/lib/api-client";
import { usePodDetail, usePodDetailInvalidate } from "@/hooks/use-pod-detail";
import { useLogsStream } from "@/hooks/use-logs-stream";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PodStatusBadge } from "@/components/pods/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Trash2, Terminal } from "lucide-react";
import Link from "next/link";

import { ThemedEditor } from "@/components/ui/themed-editor";

const PodTerminal = dynamic(
  () => import("@/components/terminal/pod-terminal").then((mod) => mod.PodTerminal),
  { ssr: false }
);

export default function PodDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const name = params?.name as string;
  const namespace = searchParams?.get("namespace") ?? "default";
  const hash = typeof window !== "undefined" ? window.location.hash : "";
  const defaultTab = hash === "#shell" ? "shell" : "logs";
  const [container, setContainer] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState(defaultTab);

  const { data: pod, isLoading, error } = usePodDetail(name, namespace);
  const invalidate = usePodDetailInvalidate();
  const currentContainer = container || pod?.containers?.[0] || "";
  const { logs, error: logsError, connected, logEndRef } = useLogsStream(
    namespace,
    name,
    currentContainer,
    !!pod && !!currentContainer && activeTab === "logs"
  );

  const customKubeconfig = useStore((s) => s.customKubeconfig);
  const handleDelete = useCallback(async () => {
    if (!name || !namespace) return;
    setDeleting(true);
    try {
      const res = await fetchWithKubeconfig(
        `/api/pod/${encodeURIComponent(name)}?namespace=${encodeURIComponent(namespace)}`,
        { method: "DELETE" },
        customKubeconfig
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.details || data.error || "Delete failed");
      }
      invalidate();
      setDeleteOpen(false);
      router.push("/workloads/pods");
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setDeleting(false);
    }
  }, [name, namespace, invalidate, router, customKubeconfig]);

  if (!name) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Pod name is required.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/workloads/pods?namespace=${encodeURIComponent(namespace)}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">{name}</h1>
        {pod && <PodStatusBadge status={pod.status} />}
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {error.message}
        </div>
      )}

      {isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : pod ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">Namespace</span>
                <span>{pod.namespace}</span>
                <span className="text-muted-foreground">Status</span>
                <span>{pod.status}</span>
                <span className="text-muted-foreground">Restarts</span>
                <span>{pod.restarts}</span>
                <span className="text-muted-foreground">Age</span>
                <span>{pod.age}</span>
                {pod.node && (
                  <>
                    <span className="text-muted-foreground">Node</span>
                    <span className="font-mono text-xs">{pod.node}</span>
                  </>
                )}
                {pod.ip && (
                  <>
                    <span className="text-muted-foreground">IP</span>
                    <span className="font-mono text-xs">{pod.ip}</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Container selector (shared across tabs) */}
          {pod.containers?.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Container:</span>
              {pod.containers.map((c) => (
                <Button
                  key={c}
                  variant={currentContainer === c ? "default" : "outline"}
                  size="sm"
                  onClick={() => setContainer(c)}
                >
                  {c}
                </Button>
              ))}
            </div>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Pod Console</CardTitle>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete pod
              </Button>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="logs">Logs</TabsTrigger>
                  <TabsTrigger value="shell" className="gap-1.5">
                    <Terminal className="h-3.5 w-3.5" />
                    Shell
                  </TabsTrigger>
                  <TabsTrigger value="yaml">YAML</TabsTrigger>
                </TabsList>

                <TabsContent value="logs" className="mt-4">
                  <div className="rounded-md border bg-muted/30 p-3 h-[400px] overflow-auto">
                    {connected && (
                      <span className="text-xs text-muted-foreground mb-2 block">
                        Live stream
                      </span>
                    )}
                    {logsError && (
                      <p className="text-destructive text-sm">{logsError}</p>
                    )}
                    <pre className="logs-viewer text-sm whitespace-pre-wrap break-all">
                      {logs || "Waiting for logs…"}
                    </pre>
                    <div ref={logEndRef} />
                  </div>
                </TabsContent>

                <TabsContent value="shell" className="mt-4">
                  <div className="rounded-lg border border-white/[0.06] overflow-hidden h-[400px]">
                    {activeTab === "shell" && (
                      <PodTerminal
                        namespace={namespace}
                        pod={name}
                        container={currentContainer}
                      />
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="yaml" className="mt-4">
                  <div className="rounded-md border h-[400px] overflow-hidden">
                    <ThemedEditor
                      height="400px"
                      language="yaml"
                      value={pod.yaml ?? "# No YAML"}
                      options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        wordWrap: "on",
                      }}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      ) : (
        <p className="text-muted-foreground">Pod not found.</p>
      )}

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete pod</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete pod &quot;{name}&quot; in namespace &quot;{namespace}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
