/**
 * In-process TCP server that forwards connections to a pod via Kubernetes port-forward.
 * Used by the Port Forward tool so users can "Forward to localhost" from the UI.
 */

import net from "node:net";
import type { KubeConfig } from "@kubernetes/client-node";
import { PortForward } from "@kubernetes/client-node";

export interface ActiveForward {
  server: net.Server;
  namespace: string;
  pod: string;
  remotePort: number;
}

const active = new Map<number, ActiveForward>();

export function getActiveForward(localPort: number): ActiveForward | undefined {
  return active.get(localPort);
}

export function listActiveForwards(): { localPort: number; namespace: string; pod: string; remotePort: number }[] {
  return Array.from(active.entries()).map(([localPort, f]) => ({
    localPort,
    namespace: f.namespace,
    pod: f.pod,
    remotePort: f.remotePort,
  }));
}

export function startPortForward(
  kubeConfig: KubeConfig,
  namespace: string,
  pod: string,
  localPort: number,
  remotePort: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (active.has(localPort)) {
      reject(new Error(`Port ${localPort} is already in use by another forward.`));
      return;
    }

    const portForward = new PortForward(kubeConfig);

    const server = net.createServer((socket) => {
      socket.setNoDelay(true);
      const onError = (err: Error) => {
        console.error("[port-forward] connection error:", err.message);
        socket.destroy();
      };
      socket.on("error", onError);
      portForward
        .portForward(namespace, pod, [remotePort], socket, null, socket)
        .catch((err) => {
          onError(err instanceof Error ? err : new Error(String(err)));
        });
    });

    server.on("error", (err) => {
      active.delete(localPort);
      reject(err);
    });

    server.listen(localPort, "0.0.0.0", () => {
      active.set(localPort, { server, namespace, pod, remotePort });
      resolve();
    });
  });
}

export function stopPortForward(localPort: number): Promise<void> {
  return new Promise((resolve) => {
    const entry = active.get(localPort);
    if (!entry) {
      resolve();
      return;
    }
    active.delete(localPort);
    entry.server.close(() => resolve());
  });
}
