"use client";

import Link from "next/link";
import { Boxes } from "lucide-react";
import { useDaemonSets } from "@/hooks/use-daemonsets";
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

export default function DaemonSetsPage() {
  const selectedNamespace = useStore((s) => s.selectedNamespace);
  const { data: daemonsets, isLoading, error } = useDaemonSets();

  return (
    <div className="p-6 space-y-4 w-full">
      <PageHeader
        icon={<Boxes className="h-4 w-4 text-white/50" />}
        title="Daemon Sets"
        count={daemonsets?.length}
      />

      {error && <ErrorBanner message={error.message} />}

      {isLoading ? (
        <LoadingRows />
      ) : !daemonsets?.length ? (
        <EmptyState message="No daemonsets found." />
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
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Up To Date</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Available</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Age</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {daemonsets.map((ds) => (
                <TableRow key={`${ds.namespace}/${ds.name}`} className="border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <TableCell className="text-[13px] font-medium">
                    <Link
                      href={`/workloads/daemonsets/${ds.name}?namespace=${encodeURIComponent(ds.namespace)}`}
                      className="text-white hover:text-primary transition-colors"
                    >
                      {ds.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">{ds.namespace}</TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">{ds.desired}</TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">{ds.current}</TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">{ds.ready}</TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">{ds.upToDate}</TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">{ds.available}</TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">{ds.age}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
