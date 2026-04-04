"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { usePods, usePodsInvalidate } from "@/hooks/use-pods";
import { useStore } from "@/store/use-store";
import { fetchWithKubeconfig } from "@/lib/api-client";
import { PageHeader, EmptyState, ErrorBanner, LoadingRows } from "@/components/layout/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PodStatusBadge } from "@/components/pods/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Boxes,
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
    <div className="p-6 space-y-4 w-full">
      <PageHeader
        icon={<Boxes className="h-4 w-4 text-white/50" />}
        title="Pods"
        count={filteredPods.length}
      >
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20" />
          <Input
            placeholder="Search pods..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-8 w-64 bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/20 text-sm rounded-lg"
          />
        </div>
      </PageHeader>

      {error && <ErrorBanner message={error.message} />}

      {isLoading ? (
        <LoadingRows count={5} />
      ) : !filteredPods.length ? (
        <EmptyState
          message={pods?.length && search.trim() ? "No pods match your search." : "No pods found."}
        />
      ) : (
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/[0.04] hover:bg-transparent">
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Name</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Namespace</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">CPU</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Memory</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9 w-8"> </TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Restarts</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Controlled By</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Node</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">QoS</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Status</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Age</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9 w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPods.map((pod) => (
                <TableRow key={`${pod.namespace}/${pod.name}`} className="border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <TableCell className="text-[13px] font-medium">
                    <button
                      type="button"
                      onClick={() => setDetailsPod(pod)}
                      className="text-white hover:text-primary transition-colors text-left"
                    >
                      {pod.name}
                    </button>
                  </TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">
                    {pod.namespace}
                  </TableCell>
                  <TableCell className="font-mono text-[12px] text-white/50 py-2.5">
                    {pod.cpu ?? "N/A"}
                  </TableCell>
                  <TableCell className="font-mono text-[12px] text-white/50 py-2.5">
                    {pod.memory ?? "N/A"}
                  </TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">
                    <span
                      className={`inline-block w-2.5 h-2.5 rounded-sm ${
                        pod.containersReady ? "bg-green-500" : "bg-amber-500"
                      }`}
                      title={pod.containersReady ? "All containers ready" : "Not all ready"}
                    />
                  </TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">{pod.restarts}</TableCell>
                  <TableCell className="font-mono text-[12px] text-white/50 py-2.5">
                    {pod.controlledBy ?? "\u2014"}
                  </TableCell>
                  <TableCell className="font-mono text-[12px] text-white/50 py-2.5">
                    {pod.node && pod.node !== "\u2014" ? (
                      <Link href={`/nodes/${pod.node}`} className="text-white hover:text-primary transition-colors">
                        {pod.node}
                      </Link>
                    ) : (
                      pod.node ?? "\u2014"
                    )}
                  </TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">
                    {pod.qos ? (
                      <Badge variant="secondary" className="text-[11px] font-medium">
                        {pod.qos}
                      </Badge>
                    ) : "\u2014"}
                  </TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">
                    <PodStatusBadge status={pod.status} />
                  </TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">
                    {pod.age}
                  </TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-white/30 hover:text-white/70">
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
              {evicting ? "Evicting\u2026" : "Evict"}
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
              {deleting ? "Deleting\u2026" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={!!detailsPod} onOpenChange={(open) => !open && setDetailsPod(null)}>
        <SheetContent side="right" className="flex flex-col p-0">
          <SheetHeader className="border-b border-white/[0.06] px-4 py-3">
            <div className="flex items-center justify-between gap-2 pr-8">
              <SheetTitle className="text-base font-semibold text-white">
                Pod: {detailsPod?.name ?? "\u2014"}
              </SheetTitle>
              {detailsPod && podDetail && (
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white" asChild>
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
                    className="h-8 w-8 text-white/40 hover:text-white"
                    onClick={() => copyPodLink(detailsPod)}
                    title="Copy link"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white/40 hover:text-white"
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
                    className="h-8 w-8 text-destructive hover:text-destructive"
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
                <Skeleton className="h-24 w-full bg-white/[0.04]" />
                <Skeleton className="h-32 w-full bg-white/[0.04]" />
              </div>
            ) : podDetail ? (
              <div className="space-y-6 p-4">
                <section>
                  <h3 className="text-[11px] uppercase tracking-wider text-white/30 font-semibold mb-3">Properties</h3>
                  <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[13px]">
                    <dt className="text-white/40">Name</dt>
                    <dd className="font-mono text-[12px] text-white/70">{podDetail.name}</dd>
                    <dt className="text-white/40">Namespace</dt>
                    <dd className="text-white/70">{podDetail.namespace}</dd>
                    <dt className="text-white/40">Status</dt>
                    <dd><PodStatusBadge status={podDetail.status} /></dd>
                    <dt className="text-white/40">Restarts</dt>
                    <dd className="text-white/70">{podDetail.restarts}</dd>
                    <dt className="text-white/40">Age</dt>
                    <dd className="text-white/70">{podDetail.age}</dd>
                    {podDetail.node && (
                      <>
                        <dt className="text-white/40">Node</dt>
                        <dd><Link href={`/nodes/${podDetail.node}`} className="text-white hover:text-primary transition-colors font-mono text-[12px]">{podDetail.node}</Link></dd>
                      </>
                    )}
                    {podDetail.ip && (
                      <>
                        <dt className="text-white/40">Pod IP</dt>
                        <dd className="font-mono text-[12px] text-white/50">{podDetail.ip}</dd>
                      </>
                    )}
                    {detailsPod?.controlledBy && detailsPod.controlledBy !== "\u2014" && (
                      <>
                        <dt className="text-white/40">Controlled By</dt>
                        <dd className="font-mono text-[12px] text-white/50">{detailsPod.controlledBy}</dd>
                      </>
                    )}
                    {detailsPod?.qos && detailsPod.qos !== "\u2014" && (
                      <>
                        <dt className="text-white/40">QoS Class</dt>
                        <dd>
                          <Badge variant="secondary" className="text-[11px] font-medium">
                            {detailsPod.qos}
                          </Badge>
                        </dd>
                      </>
                    )}
                  </dl>
                </section>
                <section>
                  <h3 className="text-[11px] uppercase tracking-wider text-white/30 font-semibold mb-3">Containers</h3>
                  <ul className="space-y-3">
                    {(podDetail.containers ?? []).map((container) => (
                      <li key={container} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-[13px]">
                        <div className="flex items-center gap-2 font-medium text-white/80">
                          <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                          {container}
                        </div>
                        {detailsPod && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" className="h-7 text-xs border-white/[0.06] text-white/50 hover:text-white" asChild>
                              <Link href={`/tools/port-forward?namespace=${encodeURIComponent(detailsPod.namespace)}`}>
                                <Radio className="h-3 w-3 mr-1" />
                                Forward...
                              </Link>
                            </Button>
                            <Button variant="outline" size="sm" className="h-7 text-xs border-white/[0.06] text-white/50 hover:text-white" asChild>
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
                  <Button variant="outline" size="sm" className="w-full border-white/[0.06] text-white/50 hover:text-white" asChild>
                    <Link href={detailsPod ? `/workloads/pods/${detailsPod.name}?namespace=${encodeURIComponent(detailsPod.namespace)}` : "#"}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open full details page
                    </Link>
                  </Button>
                </section>
              </div>
            ) : detailsPod ? (
              <p className="p-4 text-sm text-white/30">Failed to load pod details.</p>
            ) : null}
          </SheetBody>
        </SheetContent>
      </Sheet>
    </div>
  );
}
