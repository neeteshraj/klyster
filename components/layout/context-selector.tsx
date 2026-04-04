"use client";

import { useContexts, useSetContext } from "@/hooks/use-contexts";
import { useStore } from "@/store/use-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export function ContextSelector() {
  const { data, isLoading, error } = useContexts();
  const setContextMutation = useSetContext();
  const selectedCluster = useStore((s) => s.selectedCluster);
  const setSelectedCluster = useStore((s) => s.setSelectedCluster);

  const currentContext =
    (data?.currentContext ?? selectedCluster) || "default";
  const contexts = data?.contexts ?? [];
  const configPath = data?.configPath ?? "";
  const configPaths = data?.configPaths ?? [];

  const handleSelect = (name: string) => {
    setSelectedCluster(name);
    setContextMutation.mutate(name);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="min-w-[200px] max-w-[320px] justify-between font-mono text-xs px-3"
          disabled={isLoading}
        >
          <span className="truncate min-w-0">
            {isLoading ? "Loading…" : error ? "Error" : currentContext || "Select context"}
          </span>
          <ChevronDown className="ml-1.5 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[320px]">
        <DropdownMenuLabel className="text-muted-foreground font-normal">
          <div className="flex items-center gap-2 text-xs">
            <FileText className="h-3.5 w-3.5 shrink-0" />
            <span className="font-medium text-foreground">Config path</span>
          </div>
          <div className="mt-1 break-all font-mono text-[11px] text-muted-foreground">
            {configPath || "—"}
          </div>
          {configPaths.length > 1 && (
            <div className="mt-2 text-[11px] text-muted-foreground">
              All paths: {configPaths.join(" ; ")}
            </div>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {contexts.length === 0 ? (
          <DropdownMenuItem disabled>No contexts found</DropdownMenuItem>
        ) : (
          contexts.map((ctx) => (
            <DropdownMenuItem
              key={ctx.name}
              onClick={() => handleSelect(ctx.name)}
              disabled={setContextMutation.isPending}
              className={cn(
                "flex flex-col items-start gap-0.5 font-mono text-xs",
                ctx.name === currentContext && "bg-primary/10 text-primary"
              )}
            >
              <span>{ctx.name}</span>
              {(ctx.cluster || ctx.user) && (
                <span className="text-[10px] font-sans normal-case text-muted-foreground">
                  {[ctx.cluster, ctx.user].filter(Boolean).join(" → ")}
                </span>
              )}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
