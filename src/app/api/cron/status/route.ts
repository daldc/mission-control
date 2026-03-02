import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const GIST_ID = "8e29068c94557579b1c3456a0551ebe5";
const RAW_URL = `https://gist.githubusercontent.com/daldc/${GIST_ID}/raw/cron-status.json`;

export async function GET() {
  try {
    const res = await fetch(RAW_URL, {
      next: { revalidate: 0 },
      headers: { "Cache-Control": "no-cache" },
    });

    if (!res.ok) {
      throw new Error(`Gist fetch failed: ${res.status}`);
    }

    const jobs = await res.json();

    return NextResponse.json({
      jobs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron status fetch error:", error);
    return NextResponse.json(
      { jobs: [], error: "Failed to fetch cron status", timestamp: new Date().toISOString() },
      { status: 200 }
    );
  }
}
