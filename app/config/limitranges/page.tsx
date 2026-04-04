"use client";

import { Settings } from "lucide-react";
import { useLimitRanges } from "@/hooks/use-limitranges";
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

export default function LimitRangesPage() {
  const { data: limitRanges, isLoading, error } = useLimitRanges();

  return (
    <div className="p-6 space-y-4 w-full">
      <PageHeader
        icon={<Settings className="h-4 w-4 text-white/50" />}
        title="Limit Ranges"
        count={limitRanges?.length}
      />

      {error && <ErrorBanner message={error.message} />}

      {isLoading ? (
        <LoadingRows />
      ) : !limitRanges?.length ? (
        <EmptyState message="No limit ranges found." />
      ) : (
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Name</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Namespace</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Types</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Age</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {limitRanges.map((lr) => (
                <TableRow key={`${lr.namespace}/${lr.name}`} className="border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <TableCell className="text-[13px] font-medium text-white">{lr.name}</TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">{lr.namespace}</TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">
                    {[...new Set(lr.limits.map((l) => l.type))].map((type) => (
                      <Badge key={type} variant="secondary" className="text-[11px] font-medium mr-1">
                        {type}
                      </Badge>
                    ))}
                  </TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">{lr.age}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
