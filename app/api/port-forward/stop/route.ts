import { NextRequest, NextResponse } from "next/server";
import { stopPortForward } from "@/lib/port-forward-server";

export async function DELETE(request: NextRequest) {
  try {
    const portStr = request.nextUrl.searchParams.get("port");
    if (!portStr) {
      return NextResponse.json(
        { error: "Missing port query parameter" },
        { status: 400 }
      );
    }
    const port = parseInt(portStr, 10);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      return NextResponse.json(
        { error: "port must be 1–65535" },
        { status: 400 }
      );
    }

    await stopPortForward(port);
    return NextResponse.json({ ok: true, port });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Failed to stop port forward", details: message },
      { status: 500 }
    );
  }
}
