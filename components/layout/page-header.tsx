"use client";

import { NamespaceSelector } from "@/components/layout/namespace-selector";

interface PageHeaderProps {
  icon: React.ReactNode;
  title: string;
  count?: number;
  showNamespace?: boolean;
  children?: React.ReactNode;
}

export function PageHeader({ icon, title, count, showNamespace = true, children }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-white/[0.05] border border-white/[0.08] shadow-sm">
          {icon}
        </div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-[17px] font-semibold text-white tracking-tight">{title}</h1>
          {typeof count === "number" && (
            <span className="inline-flex items-center justify-center h-[22px] min-w-[24px] px-2 rounded-full bg-primary/10 text-[11px] font-bold text-primary tabular-nums">
              {count}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        {children}
        {showNamespace && <NamespaceSelector />}
      </div>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="h-12 w-12 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
        <svg className="h-5 w-5 text-white/15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <p className="text-[13px] text-white/30">{message}</p>
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3">
      <div className="h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
      <p className="text-sm text-destructive">{message}</p>
    </div>
  );
}

export function LoadingRows({ count = 5 }: { count?: number }) {
  return (
    <div className="p-2 space-y-1.5">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="h-11 rounded-lg bg-white/[0.015] animate-pulse"
          style={{ animationDelay: `${i * 80}ms` }}
        />
      ))}
    </div>
  );
}
