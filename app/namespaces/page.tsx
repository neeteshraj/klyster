"use client";

import { useNamespaces } from "@/hooks/use-namespaces";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "Active"
      ? "success"
      : status === "Terminating"
        ? "destructive"
        : "secondary";
  return <Badge variant={variant}>{status}</Badge>;
}

export default function NamespacesPage() {
  const { data: namespaces, isLoading, error } = useNamespaces();

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Namespaces</h1>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {error.message}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All namespaces</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !namespaces?.length ? (
            <p className="text-muted-foreground py-8 text-center">
              No namespaces found.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Age</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {namespaces.map((ns) => (
                  <TableRow key={ns.name}>
                    <TableCell className="font-medium">{ns.name}</TableCell>
                    <TableCell>
                      <StatusBadge status={ns.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {ns.age}
                    </TableCell>
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
