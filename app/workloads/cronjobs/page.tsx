"use client";

import Link from "next/link";
import { Boxes } from "lucide-react";
import { useCronJobs } from "@/hooks/use-cronjobs";
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
import { Badge } from "@/components/ui/badge";

export default function CronJobsPage() {
  const selectedNamespace = useStore((s) => s.selectedNamespace);
  const { data: cronjobs, isLoading, error } = useCronJobs();

  return (
    <div className="p-6 space-y-4 w-full">
      <PageHeader
        icon={<Boxes className="h-4 w-4 text-white/50" />}
        title="Cron Jobs"
        count={cronjobs?.length}
      />

      {error && <ErrorBanner message={error.message} />}

      {isLoading ? (
        <LoadingRows />
      ) : !cronjobs?.length ? (
        <EmptyState message="No cronjobs found." />
      ) : (
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Name</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Namespace</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Schedule</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Suspend</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Active</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Last Schedule</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Age</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cronjobs.map((cj) => (
                <TableRow key={`${cj.namespace}/${cj.name}`} className="border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <TableCell className="text-[13px] font-medium">
                    <Link
                      href={`/workloads/cronjobs/${cj.name}?namespace=${encodeURIComponent(cj.namespace)}`}
                      className="text-white hover:text-primary transition-colors"
                    >
                      {cj.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">{cj.namespace}</TableCell>
                  <TableCell className="font-mono text-[12px] text-white/50 py-2.5">{cj.schedule}</TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">
                    <Badge
                      variant="secondary"
                      className={`text-[11px] font-medium ${
                        cj.suspend
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      }`}
                    >
                      {cj.suspend ? "Suspended" : "Active"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">{cj.active}</TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">{cj.lastSchedule}</TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">{cj.age}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
