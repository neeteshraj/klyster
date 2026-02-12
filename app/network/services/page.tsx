"use client";

import Link from "next/link";
import { useServices } from "@/hooks/use-services";
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

export default function ServicesPage() {
  const selectedNamespace = useStore((s) => s.selectedNamespace);
  const { data: services, isLoading, error } = useServices();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Services</h1>
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
            Services
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
          ) : !services?.length ? (
            <p className="text-muted-foreground py-8 text-center">
              No services found.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Namespace</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Cluster IP</TableHead>
                  <TableHead>Ports</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((svc) => (
                  <TableRow key={`${svc.namespace}/${svc.name}`}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/network/services/${svc.name}?namespace=${encodeURIComponent(svc.namespace)}`}
                        className="text-primary hover:underline"
                      >
                        {svc.name}
                      </Link>
                    </TableCell>
                    <TableCell>{svc.namespace}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{svc.type}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{svc.clusterIP}</TableCell>
                    <TableCell className="font-mono text-xs">{svc.ports}</TableCell>
                    <TableCell>{svc.age}</TableCell>
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
