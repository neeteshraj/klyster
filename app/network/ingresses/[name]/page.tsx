"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useStore } from "@/store/use-store";
import { fetchWithKubeconfig } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ThemedEditor } from "@/components/ui/themed-editor";


export default function IngressDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const name = params?.name as string;
  const namespace = searchParams?.get("namespace") ?? "default";
  const customKubeconfig = useStore((s) => s.customKubeconfig);
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["ingress", name, namespace, customKubeconfig ?? "default"],
    queryFn: async () => {
      const res = await fetchWithKubeconfig(
        `/api/ingress/${encodeURIComponent(name)}?namespace=${encodeURIComponent(namespace)}`,
        undefined,
        customKubeconfig
      );
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).details || "Failed to load");
      return res.json();
    },
    enabled: !!name && !!namespace,
  });

  const handleDelete = useCallback(async () => {
    const res = await fetchWithKubeconfig(
      `/api/ingress/${encodeURIComponent(name)}?namespace=${encodeURIComponent(namespace)}`,
      { method: "DELETE" },
      customKubeconfig
    );
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).details || "Delete failed");
    router.push("/network/ingresses");
  }, [name, namespace, customKubeconfig, router]);

  if (!name) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Ingress name is required.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/network/ingresses?namespace=${encodeURIComponent(namespace)}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">{name}</h1>
        {data && (
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
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
            <CardTitle>YAML</CardTitle>
            <p className="text-sm text-muted-foreground">{data.namespace}</p>
          </CardHeader>
          <CardContent>
            <ThemedEditor height="400px" language="yaml" value={data.yaml} options={{ readOnly: true }} />
          </CardContent>
        </Card>
      ) : null}

      {deleteOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setDeleteOpen(false)}>
          <div className="bg-card rounded-lg p-6 max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
            <p className="font-medium mb-2">Delete ingress &quot;{name}&quot;?</p>
            <p className="text-sm text-muted-foreground mb-4">This cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
              <Button variant="destructive" disabled={deleting} onClick={async () => { setDeleting(true); try { await handleDelete(); } catch (e) { alert((e as Error).message); } finally { setDeleting(false); setDeleteOpen(false); } }}>
                {deleting ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
