"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useStore } from "@/store/use-store";
import { fetchWithKubeconfig } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Trash2, RotateCw, SlidersHorizontal, FileText, ScrollText } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((mod) => mod.default),
  { ssr: false }
);

export default function DeploymentDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const name = params?.name as string;
  const namespace = searchParams?.get("namespace") ?? "default";
  const customKubeconfig = useStore((s) => s.customKubeconfig);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [scaleOpen, setScaleOpen] = useState(false);
  const [replicasInput, setReplicasInput] = useState("0");
  const [scaling, setScaling] = useState(false);
  const [restarting, setRestarting] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["deployment", name, namespace, customKubeconfig ?? "default"],
    queryFn: async () => {
      const res = await fetchWithKubeconfig(
        `/api/deployment/${encodeURIComponent(name)}?namespace=${encodeURIComponent(namespace)}`,
        undefined,
        customKubeconfig
      );
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).details || "Failed to load");
      return res.json();
    },
    enabled: !!name && !!namespace,
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["deployment", name, namespace] });
    queryClient.invalidateQueries({ queryKey: ["deployments"] });
  }, [queryClient, name, namespace]);

  const handleDelete = useCallback(async () => {
    const res = await fetchWithKubeconfig(
      `/api/deployment/${encodeURIComponent(name)}?namespace=${encodeURIComponent(namespace)}`,
      { method: "DELETE" },
      customKubeconfig
    );
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).details || "Delete failed");
    setDeleteOpen(false);
    router.push("/workloads/deployments");
  }, [name, namespace, customKubeconfig, router]);

  const handleRestart = useCallback(async () => {
    setRestarting(true);
    try {
      const res = await fetchWithKubeconfig(
        "/api/deployment/restart",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ namespace, name }),
        },
        customKubeconfig
      );
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).details || "Restart failed");
      invalidate();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setRestarting(false);
    }
  }, [name, namespace, customKubeconfig, invalidate]);

  const openScale = useCallback(() => {
    const replicas = data?.raw?.spec?.replicas ?? 0;
    setReplicasInput(String(replicas));
    setScaleOpen(true);
  }, [data?.raw?.spec?.replicas]);

  const handleScale = useCallback(async () => {
    const replicas = parseInt(replicasInput, 10);
    if (isNaN(replicas) || replicas < 0) {
      alert("Replicas must be a non-negative number.");
      return;
    }
    setScaling(true);
    try {
      const res = await fetchWithKubeconfig(
        "/api/deployment/scale",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ namespace, name, replicas }),
        },
        customKubeconfig
      );
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).details || "Scale failed");
      setScaleOpen(false);
      invalidate();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setScaling(false);
    }
  }, [name, namespace, replicasInput, customKubeconfig, invalidate]);

  if (!name) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Deployment name is required.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/workloads/deployments?namespace=${encodeURIComponent(namespace)}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">{name}</h1>
        <span className="text-muted-foreground text-sm">in {namespace}</span>
        {data && (
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleRestart} disabled={restarting}>
              <RotateCw className="h-4 w-4 mr-1" />
              {restarting ? "Restarting…" : "Restart"}
            </Button>
            <Button variant="outline" size="sm" onClick={openScale}>
              <SlidersHorizontal className="h-4 w-4 mr-1" />
              Scale
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/workloads/pods?namespace=${encodeURIComponent(namespace)}`}>
                <ScrollText className="h-4 w-4 mr-1" />
                Logs
              </Link>
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {(error as Error).message}
        </div>
      )}

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : data?.yaml ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              YAML
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Replicas: {data.raw?.spec?.replicas ?? "—"}
            </p>
          </CardHeader>
          <CardContent>
            <MonacoEditor height="500px" language="yaml" value={data.yaml} options={{ readOnly: true }} />
          </CardContent>
        </Card>
      ) : data && !data.yaml ? (
        <p className="text-muted-foreground">No YAML representation.</p>
      ) : null}

      <Dialog open={scaleOpen} onOpenChange={setScaleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Scale deployment</DialogTitle>
            <DialogDescription>
              Set replicas for &quot;{name}&quot; in namespace &quot;{namespace}&quot;.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">Replicas</label>
            <Input
              type="number"
              min={0}
              value={replicasInput}
              onChange={(e) => setReplicasInput(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScaleOpen(false)}>Cancel</Button>
            <Button onClick={handleScale} disabled={scaling}>{scaling ? "Scaling…" : "Scale"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete deployment</DialogTitle>
            <DialogDescription>
              Delete &quot;{name}&quot; in namespace &quot;{namespace}&quot;? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" disabled={deleting} onClick={async () => { setDeleting(true); try { await handleDelete(); } catch (e) { alert((e as Error).message); } finally { setDeleting(false); } }}>
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
