import { Badge } from "@/components/ui/badge";

export function PodStatusBadge({ status }: { status: string }) {
  const variant =
    status === "Running"
      ? "success"
      : status === "Pending"
        ? "warning"
        : status === "Succeeded"
          ? "default"
          : status === "Failed" || status === "Error"
            ? "error"
            : "secondary";
  return <Badge variant={variant}>{status}</Badge>;
}
