"use client";

import { Settings } from "lucide-react";
import { useResourceQuotas } from "@/hooks/use-resourcequotas";
import { PageHeader, EmptyState, ErrorBanner, LoadingRows } from "@/components/layout/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatResources(hard: Record<string, string>, used: Record<string, string>): string {
  const keys = Object.keys(hard);
  if (keys.length === 0) return "—";
  return keys.map((k) => `${k}: ${used[k] ?? "0"}/${hard[k]}`).join(", ");
}

export default function ResourceQuotasPage() {
  const { data: resourceQuotas, isLoading, error } = useResourceQuotas();

  return (
    <div className="p-6 space-y-4 w-full">
      <PageHeader
        icon={<Settings className="h-4 w-4 text-white/50" />}
        title="Resource Quotas"
        count={resourceQuotas?.length}
      />

      {error && <ErrorBanner message={error.message} />}

      {isLoading ? (
        <LoadingRows />
      ) : !resourceQuotas?.length ? (
        <EmptyState message="No resource quotas found." />
      ) : (
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Name</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Namespace</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Resources</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Age</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resourceQuotas.map((rq) => (
                <TableRow key={`${rq.namespace}/${rq.name}`} className="border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <TableCell className="text-[13px] font-medium text-white">{rq.name}</TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">{rq.namespace}</TableCell>
                  <TableCell className="font-mono text-[12px] text-white/50 py-2.5">
                    {formatResources(rq.hard, rq.used)}
                  </TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">{rq.age}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
