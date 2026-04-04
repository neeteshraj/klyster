"use client";

import { useState } from "react";
import Link from "next/link";
import { useDeployments, useDeploymentsInvalidate } from "@/hooks/use-deployments";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutGrid,
  MoreHorizontal,
  RotateCw,
  SlidersHorizontal,
  ScrollText,
  Pencil,
  Trash2,
  ExternalLink,
} from "lucide-react";

export default function DeploymentsPage() {
  const customKubeconfig = useStore((s) => s.customKubeconfig);
  const { data: deployments, isLoading, error } = useDeployments();
  const invalidate = useDeploymentsInvalidate();
  const [scaleOpen, setScaleOpen] = useState(false);
  const [scaleTarget, setScaleTarget] = useState<{
    name: string;
    namespace: string;
    replicas: number;
  } | null>(null);
  const [replicasInput, setReplicasInput] = useState("0");
  const [scaling, setScaling] = useState(false);
  const [restarting, setRestarting] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ name: string; namespace: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openScale = (name: string, namespace: string, replicas: number) => {
    setScaleTarget({ name, namespace, replicas });
    setReplicasInput(String(replicas));
    setScaleOpen(true);
  };

  const handleRestart = async (name: string, namespace: string) => {
    setRestarting(`${namespace}/${name}`);
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
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.details || data.error || "Restart failed");
      }
      invalidate();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setRestarting(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetchWithKubeconfig(
        `/api/deployment/${encodeURIComponent(deleteTarget.name)}?namespace=${encodeURIComponent(deleteTarget.namespace)}`,
        { method: "DELETE" },
        customKubeconfig
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.details || data.error || "Delete failed");
      }
      invalidate();
      setDeleteTarget(null);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  const handleScale = async () => {
    if (!scaleTarget) return;
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
          body: JSON.stringify({
            namespace: scaleTarget.namespace,
            name: scaleTarget.name,
            replicas,
          }),
        },
        customKubeconfig
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.details || data.error || "Scale failed");
      }
      invalidate();
      setScaleOpen(false);
      setScaleTarget(null);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setScaling(false);
    }
  };

  return (
    <div className="p-6 space-y-4 w-full">
      <PageHeader
        icon={<LayoutGrid className="h-4 w-4 text-white/50" />}
        title="Deployments"
        count={deployments?.length}
      />

      {error && <ErrorBanner message={error.message} />}

      {isLoading ? (
        <LoadingRows count={5} />
      ) : !deployments?.length ? (
        <EmptyState message="No deployments found." />
      ) : (
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/[0.04] hover:bg-transparent">
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Name</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Namespace</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Ready</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Up-to-date</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Available</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Age</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9 w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deployments.map((d) => (
                <TableRow key={`${d.namespace}/${d.name}`} className="border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <TableCell className="text-[13px] font-medium">
                    <Link
                      href={`/workloads/deployments/${encodeURIComponent(d.name)}?namespace=${encodeURIComponent(d.namespace)}`}
                      className="text-white hover:text-primary transition-colors"
                    >
                      {d.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">
                    {d.namespace}
                  </TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">
                    <Badge variant={d.available === d.replicas ? "success" : "warning"}>
                      {d.ready}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">{d.upToDate}</TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">{d.available}</TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">{d.age}</TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-white/30 hover:text-white/70">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/workloads/deployments/${encodeURIComponent(d.name)}?namespace=${encodeURIComponent(d.namespace)}`}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Show details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openScale(d.name, d.namespace, d.replicas)}>
                          <SlidersHorizontal className="h-4 w-4 mr-2" />
                          Scale
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleRestart(d.name, d.namespace)}
                          disabled={restarting === `${d.namespace}/${d.name}`}
                        >
                          <RotateCw className="h-4 w-4 mr-2" />
                          {restarting === `${d.namespace}/${d.name}` ? "Restarting\u2026" : "Restart"}
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/workloads/pods?namespace=${encodeURIComponent(d.namespace)}`}>
                            <ScrollText className="h-4 w-4 mr-2" />
                            Logs
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/workloads/deployments/${encodeURIComponent(d.name)}?namespace=${encodeURIComponent(d.namespace)}`}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteTarget({ name: d.name, namespace: d.namespace })}
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

      <Dialog open={scaleOpen} onOpenChange={setScaleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Scale deployment</DialogTitle>
            <DialogDescription>
              {scaleTarget && (
                <>
                  Set replicas for &quot;{scaleTarget.name}&quot; in namespace &quot;{scaleTarget.namespace}&quot;.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-[11px] uppercase tracking-wider text-white/30 font-semibold mb-2 block">Replicas</label>
            <Input
              type="number"
              min={0}
              value={replicasInput}
              onChange={(e) => setReplicasInput(e.target.value)}
              className="h-9 bg-white/[0.03] border-white/[0.06] text-white text-sm rounded-lg"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScaleOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleScale} disabled={scaling}>
              {scaling ? "Scaling\u2026" : "Scale"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete deployment</DialogTitle>
            <DialogDescription>
              {deleteTarget && (
                <>
                  Delete &quot;{deleteTarget.name}&quot; in namespace &quot;{deleteTarget.namespace}&quot;? This cannot be undone.
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
    </div>
  );
}
