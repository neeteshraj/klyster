/**
 * Server-Sent Events (SSE) endpoint for streaming pod logs.
 * Client connects with query: namespace, pod, container (optional).
 * Server polls Kubernetes logs and sends new lines as SSE events.
 */

import { getCoreV1Api } from "@/lib/k8s";

export const dynamic = "force-dynamic";

const POLL_INTERVAL_MS = 1500;
const TAIL_LINES = 500;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const namespace = searchParams.get("namespace") ?? "default";
  const pod = searchParams.get("pod");
  const container = searchParams.get("container") ?? "";

  if (!pod) {
    return new Response(
      JSON.stringify({ error: "Query parameter 'pod' is required" }),
      { status: 400 }
    );
  }

  const encoder = new TextEncoder();
  let lastContent = "";

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: string) => {
        if (data) controller.enqueue(encoder.encode(`data: ${data.replace(/\n/g, "\ndata: ")}\n\n`));
      };
      const sendEvent = (event: string, data: string) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${data}\n\n`));
      };

      const poll = async () => {
        try {
          const api = getCoreV1Api(request);
          const log = await api.readNamespacedPodLog({
            name: pod!,
            namespace,
            container: container || undefined,
            tailLines: TAIL_LINES,
          });
          const text = typeof log === "string" ? log : "";
          if (text !== lastContent) {
            const prefixLen = lastContent.length;
            if (text.length > prefixLen || text !== lastContent.slice(0, text.length)) {
              const newContent = lastContent ? text.slice(prefixLen) : text;
              if (newContent) send(newContent);
            }
            lastContent = text;
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          sendEvent("error", message);
        }
      };

      sendEvent("connected", "stream started");
      await poll();
      const interval = setInterval(poll, POLL_INTERVAL_MS);

      // Allow client to close; we don't have request.signal in all runtimes, so use a timeout to stop after 1 hour
      const timeout = setTimeout(() => {
        clearInterval(interval);
        controller.close();
      }, 3600000);

      // If request is aborted, clean up (Next.js may pass signal)
      if (request.signal) {
        request.signal.addEventListener("abort", () => {
          clearInterval(interval);
          clearTimeout(timeout);
          controller.close();
        });
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
