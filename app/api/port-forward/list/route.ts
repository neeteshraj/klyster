import { NextResponse } from "next/server";
import { listActiveForwards } from "@/lib/port-forward-server";

export async function GET() {
  try {
    const items = listActiveForwards();
    return NextResponse.json({ items });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Failed to list port forwards", details: message },
      { status: 500 }
    );
  }
}
