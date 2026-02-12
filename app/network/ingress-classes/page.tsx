"use client";

import Link from "next/link";
import { useIngressClasses } from "@/hooks/use-ingress-classes";
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

export default function IngressClassesPage() {
  const { data: ingressClasses, isLoading, error } = useIngressClasses();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Ingress Classes</h1>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {error.message}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Ingress Classes</CardTitle>
          <p className="text-sm text-muted-foreground">
            Cluster-wide ingress controller types.
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !ingressClasses?.length ? (
            <p className="text-muted-foreground py-8 text-center">
              No ingress classes found.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Controller</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ingressClasses.map((ic) => (
                  <TableRow key={ic.name}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/network/ingress-classes/${ic.name}`}
                        className="text-primary hover:underline"
                      >
                        {ic.name}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{ic.controller}</TableCell>
                    <TableCell>{ic.age}</TableCell>
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
