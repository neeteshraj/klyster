"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useStore } from "@/store/use-store";
import { fetchWithKubeconfig } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Trash2, Eye, EyeOff, Copy, Check } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ThemedEditor } from "@/components/ui/themed-editor";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export default function SecretDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const name = params?.name as string;
  const namespace = searchParams?.get("namespace") ?? "default";
  const customKubeconfig = useStore((s) => s.customKubeconfig);
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [animateItems, setAnimateItems] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["secret", name, namespace, customKubeconfig ?? "default"],
    queryFn: async () => {
      const res = await fetchWithKubeconfig(
        `/api/secret/${encodeURIComponent(name)}?namespace=${encodeURIComponent(namespace)}`,
        undefined,
        customKubeconfig
      );
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).details || "Failed to load");
      return res.json();
    },
    enabled: !!name && !!namespace,
  });

  const handleDelete = useCallback(async () => {
    const res = await fetchWithKubeconfig(
      `/api/secret/${encodeURIComponent(name)}?namespace=${encodeURIComponent(namespace)}`,
      { method: "DELETE" },
      customKubeconfig
    );
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).details || "Delete failed");
    router.push("/config/secrets");
  }, [name, namespace, customKubeconfig, router]);

  const toggleReveal = (key: string) => {
    setRevealedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const decodeBase64 = (value: string): string => {
    try {
      return atob(value);
    } catch {
      return "[decode error]";
    }
  };

  const handleCopy = async (value: string, key: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Trigger staggered animation when sheet opens
  useEffect(() => {
    if (sheetOpen) {
      // Small delay so the sheet slide-in starts first, then items fade in
      const timer = setTimeout(() => setAnimateItems(true), 150);
      return () => clearTimeout(timer);
    } else {
      setAnimateItems(false);
    }
  }, [sheetOpen]);

  if (!name) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Secret name is required.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/config/secrets?namespace=${encodeURIComponent(namespace)}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{name}</h1>
            {data && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {data.namespace} · <Badge variant="secondary" className="ml-1">{data.type ?? "Opaque"}</Badge>
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {data?.data && Object.keys(data.data).length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSheetOpen(true)}
              className="gap-1.5"
            >
              <Eye className="h-3.5 w-3.5" />
              View Data
            </Button>
          )}
          {data && (
            <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {(error as Error).message}
        </div>
      )}

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : data?.yaml ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">YAML</CardTitle>
            <p className="text-xs text-muted-foreground">
              Keys: {data.keys?.join(", ") || "—"}
            </p>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <ThemedEditor height="500px" language="yaml" value={data.yaml} />
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Secret data sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Secret Data
            </SheetTitle>
            <p className="text-xs text-muted-foreground">
              {name} · {Object.keys(data?.data ?? {}).length} key(s)
            </p>
          </SheetHeader>

          <div className="mt-6 divide-y divide-border">
            {Object.entries(data?.data ?? {}).map(([key, value], index) => {
              const isRevealed = revealedKeys.has(key);
              const base64Value = value as string;
              const decodedValue = decodeBase64(base64Value);
              const displayValue = isRevealed ? decodedValue : base64Value;
              const isCopied = copiedKey === key;

              return (
                <SecretItem
                  key={key}
                  keyName={key}
                  isRevealed={isRevealed}
                  displayValue={displayValue}
                  isCopied={isCopied}
                  index={index}
                  animate={animateItems}
                  onToggleReveal={() => toggleReveal(key)}
                  onCopy={() => handleCopy(displayValue, key)}
                />
              );
            })}

            {Object.keys(data?.data ?? {}).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No data keys in this secret.</p>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete confirmation */}
      {deleteOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setDeleteOpen(false)}>
          <div className="bg-card rounded-lg p-6 max-w-sm shadow-xl border" onClick={(e) => e.stopPropagation()}>
            <p className="font-medium mb-2 text-foreground">Delete secret &quot;{name}&quot;?</p>
            <p className="text-sm text-muted-foreground mb-4">This cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
              <Button variant="destructive" disabled={deleting} onClick={async () => { setDeleting(true); try { await handleDelete(); } catch (e) { alert((e as Error).message); } finally { setDeleting(false); setDeleteOpen(false); } }}>
                {deleting ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SecretItem({
  keyName,
  isRevealed,
  displayValue,
  isCopied,
  index,
  animate,
  onToggleReveal,
  onCopy,
}: {
  keyName: string;
  isRevealed: boolean;
  displayValue: string;
  isCopied: boolean;
  index: number;
  animate: boolean;
  onToggleReveal: () => void;
  onCopy: () => void;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | undefined>(undefined);

  // Measure content height for smooth transitions when toggling decode
  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [displayValue, isRevealed]);

  return (
    <div
      className="transition-all duration-300 ease-out"
      style={{
        opacity: animate ? 1 : 0,
        transform: animate ? "translateY(0)" : "translateY(8px)",
        transitionDelay: `${index * 60}ms`,
      }}
    >
      {/* Row: key name on left, actions on right */}
      <div className="flex items-center justify-between px-1 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[13px] font-semibold text-foreground font-mono truncate">
            {keyName}
          </span>
          <Badge
            variant={isRevealed ? "warning" : "secondary"}
            className="text-[10px] shrink-0"
          >
            {isRevealed ? "decoded" : "base64"}
          </Badge>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={onToggleReveal}
            title={isRevealed ? "Show base64" : "Decode to plain text"}
          >
            {isRevealed ? (
              <EyeOff className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={onCopy}
            title="Copy value"
          >
            {isCopied ? (
              <Check className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Value area with smooth height transition */}
      <div
        className="overflow-hidden transition-all duration-200 ease-in-out"
        style={{
          maxHeight: contentHeight !== undefined ? `${contentHeight}px` : "none",
        }}
      >
        <div
          ref={contentRef}
          className={`rounded-md px-3 py-2 mb-3 mx-1 transition-colors duration-200 ${
            isRevealed
              ? "bg-amber-500/10"
              : "bg-muted/40"
          }`}
        >
          <pre
            className={`text-[12px] font-mono whitespace-pre-wrap break-all leading-relaxed max-h-40 overflow-auto ${
              isRevealed
                ? "text-amber-600 dark:text-amber-400"
                : "text-muted-foreground"
            }`}
          >
            {displayValue}
          </pre>
        </div>
      </div>
    </div>
  );
}
