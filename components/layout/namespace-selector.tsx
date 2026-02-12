"use client";

import { useNamespaces } from "@/hooks/use-namespaces";
import { useStore } from "@/store/use-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function NamespaceSelector() {
  const { data: namespaces, isLoading, error } = useNamespaces();
  const selectedNamespace = useStore((s) => s.selectedNamespace);
  const setSelectedNamespace = useStore((s) => s.setSelectedNamespace);

  const displayNs =
    selectedNamespace === "_all" ? "All namespaces" : selectedNamespace;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="min-w-[160px] justify-between"
          disabled={isLoading}
        >
          <span className={cn("truncate", !selectedNamespace && "text-muted-foreground")}>
            {isLoading ? "Loading…" : error ? "Error" : displayNs}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-[300px] overflow-auto">
        <DropdownMenuItem onClick={() => setSelectedNamespace("_all")}>
          All namespaces
        </DropdownMenuItem>
        {(namespaces ?? []).map((ns) => (
          <DropdownMenuItem
            key={ns.name}
            onClick={() => setSelectedNamespace(ns.name)}
          >
            {ns.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
