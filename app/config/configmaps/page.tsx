"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { useConfigMaps } from "@/hooks/use-configmaps";
import { PageHeader, EmptyState, ErrorBanner, LoadingRows } from "@/components/layout/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ConfigMapsPage() {
  const { data: configMaps, isLoading, error } = useConfigMaps();

  return (
    <div className="p-6 space-y-4 w-full">
      <PageHeader
        icon={<FileText className="h-4 w-4 text-white/50" />}
        title="Config Maps"
        count={configMaps?.length}
      />

      {error && <ErrorBanner message={error.message} />}

      {isLoading ? (
        <LoadingRows />
      ) : !configMaps?.length ? (
        <EmptyState message="No config maps found." />
      ) : (
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Name</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Namespace</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Keys</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Age</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {configMaps.map((cm) => (
                <TableRow key={`${cm.namespace}/${cm.name}`} className="border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <TableCell className="text-[13px] font-medium">
                    <Link
                      href={`/config/configmaps/${cm.name}?namespace=${encodeURIComponent(cm.namespace)}`}
                      className="text-white hover:text-primary transition-colors"
                    >
                      {cm.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">{cm.namespace}</TableCell>
                  <TableCell className="font-mono text-[12px] text-white/50 py-2.5">
                    {cm.keys.length ? cm.keys.join(", ") : "—"}
                  </TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">{cm.age}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
