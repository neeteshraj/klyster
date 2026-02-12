import { NextRequest, NextResponse } from "next/server";
import { getContextsList } from "@/lib/k8s";

/**
 * GET /api/contexts
 * Returns kubeconfig path(s) and all available contexts.
 */
export async function GET(request: NextRequest) {
  try {
    const info = getContextsList(request);
    return NextResponse.json(info);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Failed to load kubeconfig / contexts", details: message },
      { status: 500 }
    );
  }
}
