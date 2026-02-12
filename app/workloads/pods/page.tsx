"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { usePods, usePodsInvalidate } from "@/hooks/use-pods";
import { useStore } from "@/store/use-store";
import { fetchWithKubeconfig } from "@/lib/api-client";
import { NamespaceSelector } from "@/components/layout/namespace-selector";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PodStatusBadge } from "@/components/pods/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody } from "@/components/ui/sheet";
import {
  MoreHorizontal,
  ExternalLink,
  Link2,
  Terminal,
  LogOut,
  Share2,
  ScrollText,
  Pencil,
  Trash2,
  Search,
  Radio,
} from "lucide-react";
import type { PodItem } from "@/lib/types";
import type { PodDetail } from "@/lib/types";

function podDetailUrl(pod: PodItem): string {
  if (typeof window === "undefined") return "#";
  return `${window.location.origin}/workloads/pods/${encodeURIComponent(pod.name)}?namespace=${encodeURIComponent(pod.namespace)}`;
}

export default function PodsPage() {
  const selectedNamespace = useStore((s) => s.selectedNamespace);
  const customKubeconfig = useStore((s) => s.customKubeconfig);
  const { data: pods, isLoading, error } = usePods();
  const invalidatePods = usePodsInvalidate();
  const [search, setSearch] = useState("");
  const [evictTarget, setEvictTarget] = useState<PodItem | null>(null);
  const [evicting, setEvicting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PodItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [shareCopied, setShareCopied] = useState<string | null>(null);
  const [detailsPod, setDetailsPod] = useState<PodItem | null>(null);

  const { data: podDetail, isLoading: podDetailLoading } = useQuery({
    queryKey: ["pod", detailsPod?.name, detailsPod?.namespace, customKubeconfig ?? "default"],
    queryFn: async () => {
      if (!detailsPod) return null;
      const res = await fetchWithKubeconfig(
        `/api/pod/${encodeURIComponent(detailsPod.name)}?namespace=${encodeURIComponent(detailsPod.namespace)}`,
        undefined,
        customKubeconfig
      );
      if (!res.ok) throw new Error("Failed to load pod");
      return res.json() as Promise<PodDetail>;
    },
    enabled: !!detailsPod?.name && !!detailsPod?.namespace,
  });

  const filteredPods = useMemo(() => {
    if (!pods) return [];
    if (!search.trim()) return pods;
    const q = search.trim().toLowerCase();
    return pods.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.namespace.toLowerCase().includes(q) ||
        (p.node ?? "").toLowerCase().includes(q) ||
        (p.controlledBy ?? "").toLowerCase().includes(q)
    );
  }, [pods, search]);

  const copyPodLink = (pod: PodItem) => {
    const url = podDetailUrl(pod);
    navigator.clipboard.writeText(url);
    setShareCopied(pod.name);
    setTimeout(() => setShareCopied(null), 2000);
  };

  const handleEvict = async () => {
    if (!evictTarget) return;
    setEvicting(true);
    try {
      const res = await fetchWithKubeconfig(
        "/api/pod/evict",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ namespace: evictTarget.namespace, name: evictTarget.name }),
        },
        customKubeconfig
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.details || data.error || "Evict failed");
      }
      setEvictTarget(null);
      invalidatePods();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setEvicting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetchWithKubeconfig(
        `/api/pod/${encodeURIComponent(deleteTarget.name)}?namespace=${encodeURIComponent(deleteTarget.namespace)}`,
        { method: "DELETE" },
        customKubeconfig
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.details || data.error || "Delete failed");
      }
      setDeleteTarget(null);
      invalidatePods();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-semibold">Pods</h1>
        <NamespaceSelector />
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {error.message}
        </div>
      )}

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>
              Pods
              {selectedNamespace !== "_all" && (
                <span className="text-muted-foreground font-normal ml-2">
                  in {selectedNamespace}
                </span>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:flex-initial sm:w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search pods..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {filteredPods.length} {filteredPods.length === 1 ? "item" : "items"}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !filteredPods.length ? (
            <p className="text-muted-foreground py-8 text-center">
              {pods?.length && search.trim() ? "No pods match your search." : "No pods found."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Namespace</TableHead>
                    <TableHead>CPU</TableHead>
                    <TableHead>Memory</TableHead>
                    <TableHead className="w-8"> </TableHead>
                    <TableHead>Restarts</TableHead>
                    <TableHead>Controlled By</TableHead>
                    <TableHead>Node</TableHead>
                    <TableHead>QoS</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPods.map((pod) => (
                    <TableRow key={`${pod.namespace}/${pod.name}`}>
                      <TableCell className="font-medium">
                        <button
                          type="button"
                          onClick={() => setDetailsPod(pod)}
                          className="text-primary hover:underline text-left"
                        >
                          {pod.name}
                        </button>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {pod.namespace}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {pod.cpu ?? "N/A"}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {pod.memory ?? "N/A"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-block w-2.5 h-2.5 rounded-sm ${
                            pod.containersReady ? "bg-green-500" : "bg-amber-500"
                          }`}
                          title={pod.containersReady ? "All containers ready" : "Not all ready"}
                        />
                      </TableCell>
                      <TableCell>{pod.restarts}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">
                        {pod.controlledBy ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">
                        {pod.node && pod.node !== "—" ? (
                          <Link href={`/nodes/${pod.node}`} className="hover:underline">
                            {pod.node}
                          </Link>
                        ) : (
                          pod.node ?? "—"
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {pod.qos ?? "—"}
                      </TableCell>
                      <TableCell>
                        <PodStatusBadge status={pod.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {pod.age}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setDetailsPod(pod)}>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Show details
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/workloads/pods/${pod.name}?namespace=${encodeURIComponent(pod.namespace)}#attach`}
                              >
                                <Link2 className="h-4 w-4 mr-2" />
                                Attach
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/workloads/pods/${pod.name}?namespace=${encodeURIComponent(pod.namespace)}#shell`}
                              >
                                <Terminal className="h-4 w-4 mr-2" />
                                Shell
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEvictTarget(pod)}>
                              <LogOut className="h-4 w-4 mr-2" />
                              Evict
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => copyPodLink(pod)}>
                              <Share2 className="h-4 w-4 mr-2" />
                              {shareCopied === pod.name ? "Copied!" : "Share"}
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/workloads/pods/${pod.name}?namespace=${encodeURIComponent(pod.namespace)}`}
                              >
                                <ScrollText className="h-4 w-4 mr-2" />
                                Logs
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/workloads/pods/${pod.name}?namespace=${encodeURIComponent(pod.namespace)}`}
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteTarget(pod)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!evictTarget} onOpenChange={(open) => !open && setEvictTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Evict pod</DialogTitle>
            <DialogDescription>
              {evictTarget && (
                <>
                  Evict &quot;{evictTarget.name}&quot; in namespace &quot;{evictTarget.namespace}&quot;?
                  The controller will create a replacement pod.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEvictTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={evicting} onClick={handleEvict}>
              {evicting ? "Evicting…" : "Evict"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete pod</DialogTitle>
            <DialogDescription>
              {deleteTarget && (
                <>
                  Delete &quot;{deleteTarget.name}&quot; in namespace &quot;{deleteTarget.namespace}&quot;?
                  This cannot be undone.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={deleting} onClick={handleDelete}>
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={!!detailsPod} onOpenChange={(open) => !open && setDetailsPod(null)}>
        <SheetContent side="right" className="flex flex-col p-0">
          <SheetHeader className="border-b px-4 py-3">
            <div className="flex items-center justify-between gap-2 pr-8">
              <SheetTitle className="text-base font-semibold">
                Pod: {detailsPod?.name ?? "—"}
              </SheetTitle>
              {detailsPod && podDetail && (
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link
                      href={`/workloads/pods/${detailsPod.name}?namespace=${encodeURIComponent(detailsPod.namespace)}`}
                      title="Open full page"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => copyPodLink(detailsPod)}
                    title="Copy link"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    asChild
                    title="Logs"
                  >
                    <Link href={`/workloads/pods/${detailsPod.name}?namespace=${encodeURIComponent(detailsPod.namespace)}`}>
                      <ScrollText className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => {
                      setDeleteTarget(detailsPod);
                      setDetailsPod(null);
                    }}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </SheetHeader>
          <SheetBody className="flex-1 overflow-y-auto">
            {podDetailLoading ? (
              <div className="space-y-3 p-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : podDetail ? (
              <div className="space-y-6 p-4">
                <section>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Properties</h3>
                  <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                    <dt className="text-muted-foreground">Name</dt>
                    <dd className="font-mono">{podDetail.name}</dd>
                    <dt className="text-muted-foreground">Namespace</dt>
                    <dd>{podDetail.namespace}</dd>
                    <dt className="text-muted-foreground">Status</dt>
                    <dd><PodStatusBadge status={podDetail.status} /></dd>
                    <dt className="text-muted-foreground">Restarts</dt>
                    <dd>{podDetail.restarts}</dd>
                    <dt className="text-muted-foreground">Age</dt>
                    <dd>{podDetail.age}</dd>
                    {podDetail.node && (
                      <>
                        <dt className="text-muted-foreground">Node</dt>
                        <dd><Link href={`/nodes/${podDetail.node}`} className="text-primary hover:underline font-mono">{podDetail.node}</Link></dd>
                      </>
                    )}
                    {podDetail.ip && (
                      <>
                        <dt className="text-muted-foreground">Pod IP</dt>
                        <dd className="font-mono">{podDetail.ip}</dd>
                      </>
                    )}
                    {detailsPod?.controlledBy && detailsPod.controlledBy !== "—" && (
                      <>
                        <dt className="text-muted-foreground">Controlled By</dt>
                        <dd className="font-mono text-xs">{detailsPod.controlledBy}</dd>
                      </>
                    )}
                    {detailsPod?.qos && detailsPod.qos !== "—" && (
                      <>
                        <dt className="text-muted-foreground">QoS Class</dt>
                        <dd>{detailsPod.qos}</dd>
                      </>
                    )}
                  </dl>
                </section>
                <section>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Containers</h3>
                  <ul className="space-y-3">
                    {(podDetail.containers ?? []).map((container) => (
                      <li key={container} className="rounded-lg border bg-muted/30 p-3 text-sm">
                        <div className="flex items-center gap-2 font-medium">
                          <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                          {container}
                        </div>
                        {detailsPod && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                              <Link href={`/tools/port-forward?namespace=${encodeURIComponent(detailsPod.namespace)}`}>
                                <Radio className="h-3 w-3 mr-1" />
                                Forward…
                              </Link>
                            </Button>
                            <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                              <Link href={`/workloads/pods/${detailsPod.name}?namespace=${encodeURIComponent(detailsPod.namespace)}`}>
                                <ScrollText className="h-3 w-3 mr-1" />
                                Logs
                              </Link>
                            </Button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
                <section>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href={detailsPod ? `/workloads/pods/${detailsPod.name}?namespace=${encodeURIComponent(detailsPod.namespace)}` : "#"}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open full details page
                    </Link>
                  </Button>
                </section>
              </div>
            ) : detailsPod ? (
              <p className="p-4 text-sm text-muted-foreground">Failed to load pod details.</p>
            ) : null}
          </SheetBody>
        </SheetContent>
      </Sheet>
    </div>
  );
}
