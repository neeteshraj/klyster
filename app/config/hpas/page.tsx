"use client";

import { Settings } from "lucide-react";
import { useHPAs } from "@/hooks/use-hpas";
import { PageHeader, EmptyState, ErrorBanner, LoadingRows } from "@/components/layout/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function HPAsPage() {
  const { data: hpas, isLoading, error } = useHPAs();

  return (
    <div className="p-6 space-y-4 w-full">
      <PageHeader
        icon={<Settings className="h-4 w-4 text-white/50" />}
        title="Horizontal Pod Autoscalers"
        count={hpas?.length}
      />

      {error && <ErrorBanner message={error.message} />}

      {isLoading ? (
        <LoadingRows />
      ) : !hpas?.length ? (
        <EmptyState message="No horizontal pod autoscalers found." />
      ) : (
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Name</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Namespace</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Reference</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Min Pods</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Max Pods</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Current</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Age</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hpas.map((hpa) => (
                <TableRow key={`${hpa.namespace}/${hpa.name}`} className="border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <TableCell className="text-[13px] font-medium text-white">{hpa.name}</TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">{hpa.namespace}</TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">
                    <Badge variant="secondary" className="text-[11px] font-medium">{hpa.reference}</Badge>
                  </TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">{hpa.minReplicas}</TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">{hpa.maxReplicas}</TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">{hpa.currentReplicas}</TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">{hpa.age}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
