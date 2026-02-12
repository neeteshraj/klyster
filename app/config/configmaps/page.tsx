"use client";

import Link from "next/link";
import { useConfigMaps } from "@/hooks/use-configmaps";
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

export default function ConfigMapsPage() {
  const selectedNamespace = useStore((s) => s.selectedNamespace);
  const { data: configMaps, isLoading, error } = useConfigMaps();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">ConfigMaps</h1>
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
            ConfigMaps
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
          ) : !configMaps?.length ? (
            <p className="text-muted-foreground py-8 text-center">
              No configmaps found.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Namespace</TableHead>
                  <TableHead>Keys</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configMaps.map((cm) => (
                  <TableRow key={`${cm.namespace}/${cm.name}`}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/config/configmaps/${cm.name}?namespace=${encodeURIComponent(cm.namespace)}`}
                        className="text-primary hover:underline"
                      >
                        {cm.name}
                      </Link>
                    </TableCell>
                    <TableCell>{cm.namespace}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {cm.keys.length ? cm.keys.join(", ") : "—"}
                    </TableCell>
                    <TableCell>{cm.age}</TableCell>
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
