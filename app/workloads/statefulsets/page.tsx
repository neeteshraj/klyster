"use client";

import Link from "next/link";
import { Boxes } from "lucide-react";
import { useStatefulSets } from "@/hooks/use-statefulsets";
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

export default function StatefulSetsPage() {
  const selectedNamespace = useStore((s) => s.selectedNamespace);
  const { data: statefulsets, isLoading, error } = useStatefulSets();

  return (
    <div className="p-6 space-y-4 w-full">
      <PageHeader
        icon={<Boxes className="h-4 w-4 text-white/50" />}
        title="Stateful Sets"
        count={statefulsets?.length}
      />

      {error && <ErrorBanner message={error.message} />}

      {isLoading ? (
        <LoadingRows />
      ) : !statefulsets?.length ? (
        <EmptyState message="No statefulsets found." />
      ) : (
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Name</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Namespace</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Ready</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Replicas</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Age</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {statefulsets.map((sts) => (
                <TableRow key={`${sts.namespace}/${sts.name}`} className="border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <TableCell className="text-[13px] font-medium">
                    <Link
                      href={`/workloads/statefulsets/${sts.name}?namespace=${encodeURIComponent(sts.namespace)}`}
                      className="text-white hover:text-primary transition-colors"
                    >
                      {sts.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">{sts.namespace}</TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">{sts.ready}</TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">{sts.replicas}</TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">{sts.age}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
