"use client";

import Link from "next/link";
import { List } from "lucide-react";
import { useIngressClasses } from "@/hooks/use-ingress-classes";
import { PageHeader, EmptyState, ErrorBanner, LoadingRows } from "@/components/layout/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function IngressClassesPage() {
  const { data: ingressClasses, isLoading, error } = useIngressClasses();

  return (
    <div className="p-6 space-y-4 w-full">
      <PageHeader
        icon={<List className="h-4 w-4 text-white/50" />}
        title="Ingress Classes"
        count={ingressClasses?.length}
        showNamespace={false}
      />

      {error && <ErrorBanner message={error.message} />}

      {isLoading ? (
        <LoadingRows count={3} />
      ) : !ingressClasses?.length ? (
        <EmptyState message="No ingress classes found." />
      ) : (
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Name</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Controller</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Age</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ingressClasses.map((ic) => (
                <TableRow key={ic.name} className="border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <TableCell className="text-[13px] font-medium">
                    <Link
                      href={`/network/ingress-classes/${ic.name}`}
                      className="text-white hover:text-primary transition-colors"
                    >
                      {ic.name}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-[12px] text-white/50 py-2.5">{ic.controller}</TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">{ic.age}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
