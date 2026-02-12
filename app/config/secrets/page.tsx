"use client";

import Link from "next/link";
import { useSecrets } from "@/hooks/use-secrets";
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
import { Badge } from "@/components/ui/badge";

export default function SecretsPage() {
  const selectedNamespace = useStore((s) => s.selectedNamespace);
  const { data: secrets, isLoading, error } = useSecrets();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Secrets</h1>
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
            Secrets
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
          ) : !secrets?.length ? (
            <p className="text-muted-foreground py-8 text-center">
              No secrets found.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Namespace</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Keys</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {secrets.map((s) => (
                  <TableRow key={`${s.namespace}/${s.name}`}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/config/secrets/${s.name}?namespace=${encodeURIComponent(s.namespace)}`}
                        className="text-primary hover:underline"
                      >
                        {s.name}
                      </Link>
                    </TableCell>
                    <TableCell>{s.namespace}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{s.type ?? "Opaque"}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {s.keys.length ? s.keys.join(", ") : "—"}
                    </TableCell>
                    <TableCell>{s.age}</TableCell>
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
