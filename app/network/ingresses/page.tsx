"use client";

import Link from "next/link";
import { Globe } from "lucide-react";
import { useIngresses } from "@/hooks/use-ingresses";
import { PageHeader, EmptyState, ErrorBanner, LoadingRows } from "@/components/layout/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function IngressesPage() {
  const { data: ingresses, isLoading, error } = useIngresses();

  return (
    <div className="p-6 space-y-4 w-full">
      <PageHeader
        icon={<Globe className="h-4 w-4 text-white/50" />}
        title="Ingresses"
        count={ingresses?.length}
      />

      {error && <ErrorBanner message={error.message} />}

      {isLoading ? (
        <LoadingRows />
      ) : !ingresses?.length ? (
        <EmptyState message="No ingresses found." />
      ) : (
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Name</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Namespace</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Class</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Hosts</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Age</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ingresses.map((ing) => (
                <TableRow key={`${ing.namespace}/${ing.name}`} className="border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <TableCell className="text-[13px] font-medium">
                    <Link
                      href={`/network/ingresses/${ing.name}?namespace=${encodeURIComponent(ing.namespace)}`}
                      className="text-white hover:text-primary transition-colors"
                    >
                      {ing.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">{ing.namespace}</TableCell>
                  <TableCell className="font-mono text-[12px] text-white/50 py-2.5">{ing.class ?? "—"}</TableCell>
                  <TableCell className="font-mono text-[12px] text-white/50 py-2.5 truncate max-w-[200px]">
                    {ing.hosts}
                  </TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">{ing.age}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
