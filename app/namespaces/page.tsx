"use client";

import { useNamespaces } from "@/hooks/use-namespaces";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Layers } from "lucide-react";
import { PageHeader, EmptyState, ErrorBanner, LoadingRows } from "@/components/layout/page-header";

function StatusBadge({ status }: { status: string }) {
  const isActive = status === "Active";
  return (
    <Badge
      variant="secondary"
      className={
        isActive
          ? "text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          : "text-[11px] font-medium bg-amber-500/10 text-amber-400 border-amber-500/20"
      }
    >
      {status}
    </Badge>
  );
}

export default function NamespacesPage() {
  const { data: namespaces, isLoading, error } = useNamespaces();

  return (
    <div className="p-6 space-y-4 w-full">
      <PageHeader
        icon={<Layers className="h-4 w-4 text-white/50" />}
        title="Namespaces"
        count={namespaces?.length}
        showNamespace={false}
      />

      {error && <ErrorBanner message={error.message} />}

      {isLoading ? (
        <LoadingRows count={3} />
      ) : !namespaces?.length ? (
        <EmptyState message="No namespaces found." />
      ) : (
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Name</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Status</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Age</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {namespaces.map((ns) => (
                <TableRow key={ns.name} className="border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <TableCell className="text-[13px] font-medium text-white">{ns.name}</TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">
                    <StatusBadge status={ns.status} />
                  </TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">
                    {ns.age}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
