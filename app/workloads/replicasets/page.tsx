"use client";

import Link from "next/link";
import { Boxes } from "lucide-react";
import { useReplicaSets } from "@/hooks/use-replicasets";
import { useStore } from "@/store/use-store";
import { PageHeader, EmptyState, ErrorBanner, LoadingRows } from "@/components/layout/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ReplicaSetsPage() {
  const selectedNamespace = useStore((s) => s.selectedNamespace);
  const { data: replicasets, isLoading, error } = useReplicaSets();

  return (
    <div className="p-6 space-y-4 w-full">
      <PageHeader
        icon={<Boxes className="h-4 w-4 text-white/50" />}
        title="Replica Sets"
        count={replicasets?.length}
      />

      {error && <ErrorBanner message={error.message} />}

      {isLoading ? (
        <LoadingRows />
      ) : !replicasets?.length ? (
        <EmptyState message="No replicasets found." />
      ) : (
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Name</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Namespace</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Desired</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Current</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Ready</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Age</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {replicasets.map((rs) => (
                <TableRow key={`${rs.namespace}/${rs.name}`} className="border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <TableCell className="text-[13px] font-medium">
                    <Link
                      href={`/workloads/replicasets/${rs.name}?namespace=${encodeURIComponent(rs.namespace)}`}
                      className="text-white hover:text-primary transition-colors"
                    >
                      {rs.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">{rs.namespace}</TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">{rs.desired}</TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">{rs.current}</TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">{rs.ready}</TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">{rs.age}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
