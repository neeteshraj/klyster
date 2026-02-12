import { NextRequest, NextResponse } from "next/server";
import { setCurrentContext } from "@/lib/k8s";

/**
 * POST /api/context
 * Body: { "context": "my-context-name" }
 * Switches the active Kubernetes context for the server.
 */
export async function POST(request: NextRequest) {
  let body: { context?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }
  const contextName = body?.context;
  if (typeof contextName !== "string" || !contextName.trim()) {
    return NextResponse.json(
      { error: "Body must include 'context' (string)" },
      { status: 400 }
    );
  }
  try {
    setCurrentContext(contextName.trim(), request);
    return NextResponse.json({ success: true, context: contextName.trim() });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Failed to switch context", details: message },
      { status: 400 }
    );
  }
}
