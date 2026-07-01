import { type NextRequest, NextResponse } from "next/server";

/**
 * Version API Route
 *
 * Returns the current build ID so the client can detect when a new
 * deployment has happened while the tab was open.
 *
 * Always served with Cache-Control: no-store so CDNs / service workers
 * never cache it — the client must always get a fresh response.
 */
export function GET(_req: NextRequest) {
  return NextResponse.json(
    { version: process.env.NEXT_PUBLIC_BUILD_ID ?? "dev" },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
