"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { useSecrets } from "@/hooks/use-secrets";
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

export default function SecretsPage() {
  const { data: secrets, isLoading, error } = useSecrets();

  return (
    <div className="p-6 space-y-4 w-full">
      <PageHeader
        icon={<Lock className="h-4 w-4 text-white/50" />}
        title="Secrets"
        count={secrets?.length}
      />

      {error && <ErrorBanner message={error.message} />}

      {isLoading ? (
        <LoadingRows />
      ) : !secrets?.length ? (
        <EmptyState message="No secrets found." />
      ) : (
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Name</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Namespace</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Type</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Keys</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Age</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {secrets.map((s) => (
                <TableRow key={`${s.namespace}/${s.name}`} className="border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <TableCell className="text-[13px] font-medium">
                    <Link
                      href={`/config/secrets/${s.name}?namespace=${encodeURIComponent(s.namespace)}`}
                      className="text-white hover:text-primary transition-colors"
                    >
                      {s.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">{s.namespace}</TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">
                    <Badge variant="secondary" className="text-[11px] font-medium">{s.type ?? "Opaque"}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-[12px] text-white/50 py-2.5">
                    {s.keys.length ? s.keys.join(", ") : "—"}
                  </TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">{s.age}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
