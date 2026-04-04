"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useStore } from "@/store/use-store";
import { fetchWithKubeconfig } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ThemedEditor } from "@/components/ui/themed-editor";


export default function ServiceDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const name = params?.name as string;
  const namespace = searchParams?.get("namespace") ?? "default";
  const customKubeconfig = useStore((s) => s.customKubeconfig);

  const { data, isLoading, error } = useQuery({
    queryKey: ["service", name, namespace, customKubeconfig ?? "default"],
    queryFn: async () => {
      const res = await fetchWithKubeconfig(
        `/api/service/${encodeURIComponent(name)}?namespace=${encodeURIComponent(namespace)}`,
        undefined,
        customKubeconfig
      );
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).details || "Failed to load");
      return res.json();
    },
    enabled: !!name && !!namespace,
  });

  if (!name) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Service name is required.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/network/services?namespace=${encodeURIComponent(namespace)}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">{name}</h1>
        {data && (
          <span className="text-muted-foreground text-sm">
            {data.type} · {data.clusterIP}
          </span>
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
    </div>
  );
}
