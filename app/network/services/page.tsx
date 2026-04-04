"use client";

import Link from "next/link";
import { useServices } from "@/hooks/use-services";
import { useStore } from "@/store/use-store";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Network } from "lucide-react";
import { PageHeader, EmptyState, ErrorBanner, LoadingRows } from "@/components/layout/page-header";

export default function ServicesPage() {
  const selectedNamespace = useStore((s) => s.selectedNamespace);
  const { data: services, isLoading, error } = useServices();

  return (
    <div className="p-6 space-y-4 w-full">
      <PageHeader
        icon={<Network className="h-4 w-4 text-white/50" />}
        title="Services"
        count={services?.length}
        showNamespace={true}
      />

      {error && <ErrorBanner message={error.message} />}

      {isLoading ? (
        <LoadingRows count={5} />
      ) : !services?.length ? (
        <EmptyState message="No services found." />
      ) : (
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Name</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Namespace</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Type</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Cluster IP</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Ports</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Age</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((svc) => (
                <TableRow key={`${svc.namespace}/${svc.name}`} className="border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <TableCell className="text-[13px] font-medium">
                    <Link
                      href={`/network/services/${svc.name}?namespace=${encodeURIComponent(svc.namespace)}`}
                      className="text-white hover:text-primary transition-colors"
                    >
                      {svc.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">{svc.namespace}</TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">
                    <Badge variant="secondary" className="text-[11px] font-medium">{svc.type}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-[12px] text-white/50">{svc.clusterIP}</TableCell>
                  <TableCell className="font-mono text-[12px] text-white/50">{svc.ports}</TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">{svc.age}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
