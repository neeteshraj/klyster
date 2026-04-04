"use client";

import Link from "next/link";
import { Boxes } from "lucide-react";
import { useJobs } from "@/hooks/use-jobs";
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

function statusBadgeClass(status: string) {
  switch (status) {
    case "Complete":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "Running":
      return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case "Failed":
      return "bg-red-500/10 text-red-400 border-red-500/20";
    default:
      return "";
  }
}

export default function JobsPage() {
  const selectedNamespace = useStore((s) => s.selectedNamespace);
  const { data: jobs, isLoading, error } = useJobs();

  return (
    <div className="p-6 space-y-4 w-full">
      <PageHeader
        icon={<Boxes className="h-4 w-4 text-white/50" />}
        title="Jobs"
        count={jobs?.length}
      />

      {error && <ErrorBanner message={error.message} />}

      {isLoading ? (
        <LoadingRows />
      ) : !jobs?.length ? (
        <EmptyState message="No jobs found." />
      ) : (
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Name</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Namespace</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Completions</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Duration</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Status</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-white/30 font-semibold bg-white/[0.02] h-9">Age</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={`${job.namespace}/${job.name}`} className="border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <TableCell className="text-[13px] font-medium">
                    <Link
                      href={`/workloads/jobs/${job.name}?namespace=${encodeURIComponent(job.namespace)}`}
                      className="text-white hover:text-primary transition-colors"
                    >
                      {job.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">{job.namespace}</TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">{job.completions}</TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">{job.duration}</TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">
                    <Badge variant="secondary" className={`text-[11px] font-medium ${statusBadgeClass(job.status)}`}>
                      {job.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[13px] text-white/70 py-2.5">{job.age}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
