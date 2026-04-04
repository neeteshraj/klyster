/**
 * Format Kubernetes resource age from creationTimestamp.
 */
export function formatAge(creationTimestamp: string | Date): string {
  const then = new Date(creationTimestamp).getTime();
  const now = Date.now();
  const sec = Math.floor((now - then) / 1000);
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h`;
  return `${Math.floor(sec / 86400)}d`;
}

/**
 * Parse Kubernetes quantity to a number for comparison/percentage.
 * CPU: returns cores (e.g. "1000m" -> 1, "2" -> 2).
 * Memory: returns bytes (e.g. "1Gi" -> 1073741824).
 */
export function parseQuantityToNumber(q: string): number {
  const s = (q || "").trim();
  if (!s) return 0;
  const num = parseFloat(s);
  if (s.endsWith("n") && !s.endsWith("min")) {
    return (parseFloat(s.slice(0, -1)) || 0) / 1_000_000_000;
  }
  if (s.endsWith("u")) {
    return (parseFloat(s.slice(0, -1)) || 0) / 1_000_000;
  }
  if (s.endsWith("m") && !s.endsWith("Gi") && !s.endsWith("Mi") && !s.endsWith("Ki")) {
    return (parseFloat(s.slice(0, -1)) || 0) / 1000;
  }
  if (s.endsWith("Ki")) return (parseFloat(s.slice(0, -2)) || 0) * 1024;
  if (s.endsWith("Mi")) return (parseFloat(s.slice(0, -2)) || 0) * 1024 * 1024;
  if (s.endsWith("Gi")) return (parseFloat(s.slice(0, -2)) || 0) * 1024 * 1024 * 1024;
  if (s.endsWith("Ti")) return (parseFloat(s.slice(0, -2)) || 0) * 1024 * 1024 * 1024 * 1024;
  if (s.endsWith("K")) return (parseFloat(s.slice(0, -1)) || 0) * 1000;
  if (s.endsWith("M")) return (parseFloat(s.slice(0, -1)) || 0) * 1000 * 1000;
  if (s.endsWith("G")) return (parseFloat(s.slice(0, -1)) || 0) * 1000 * 1000 * 1000;
  return Number.isNaN(num) ? 0 : num;
}

/** Format bytes for display (e.g. 1073741824 -> "1.00 Gi"). */
export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} Gi`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} Mi`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} Ki`;
  return `${bytes} B`;
}
