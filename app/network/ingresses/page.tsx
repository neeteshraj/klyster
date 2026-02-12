"use client";

import Link from "next/link";
import { useIngresses } from "@/hooks/use-ingresses";
import { useStore } from "@/store/use-store";
import { NamespaceSelector } from "@/components/layout/namespace-selector";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function IngressesPage() {
  const selectedNamespace = useStore((s) => s.selectedNamespace);
  const { data: ingresses, isLoading, error } = useIngresses();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Ingresses</h1>
        <NamespaceSelector />
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {error.message}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            Ingresses
            {selectedNamespace !== "_all" && (
              <span className="text-muted-foreground font-normal ml-2">
                in {selectedNamespace}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !ingresses?.length ? (
            <p className="text-muted-foreground py-8 text-center">
              No ingresses found.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Namespace</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Hosts</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ingresses.map((ing) => (
                  <TableRow key={`${ing.namespace}/${ing.name}`}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/network/ingresses/${ing.name}?namespace=${encodeURIComponent(ing.namespace)}`}
                        className="text-primary hover:underline"
                      >
                        {ing.name}
                      </Link>
                    </TableCell>
                    <TableCell>{ing.namespace}</TableCell>
                    <TableCell className="font-mono text-xs">{ing.class ?? "—"}</TableCell>
                    <TableCell className="font-mono text-xs truncate max-w-[200px]">
                      {ing.hosts}
                    </TableCell>
                    <TableCell>{ing.age}</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
