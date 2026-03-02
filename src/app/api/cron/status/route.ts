import { NextResponse } from "next/server";
import { execSync } from "child_process";

export const dynamic = "force-dynamic";

const GIST_RAW_URL =
  "https://gist.githubusercontent.com/daldc/8e29068c94557579b1c3456a0551ebe5/raw/cron-status.json";

interface RawJob {
  id: string;
  name: string;
  enabled: boolean;
  schedule: { kind: string; expr: string; tz?: string };
  state?: {
    nextRunAtMs?: number;
    lastRunAtMs?: number;
    lastStatus?: string;
    lastDurationMs?: number;
    consecutiveErrors?: number;
    lastError?: string;
  };
}

function cronToHuman(expr: string, tz?: string): string {
  // Simple cron-to-human for common patterns
  const parts = expr.split(" ");
  if (parts.length < 5) return expr;
  const [min, hour, , , dow] = parts;
  const tzLabel = tz ? ` ${tz.split("/")[1] || tz}` : "";
  const dayMap: Record<string, string> = {
    "*": "Daily",
    "1-5": "Weekdays",
    "6": "Saturdays",
    "0": "Sundays",
  };
  const dayStr = dayMap[dow] || `DoW ${dow}`;
  if (hour.includes(",")) {
    const hours = hour.split(",");
    return `Every 2h (${hours[0]}:${min.padStart(2, "0")}-${hours[hours.length - 1]}:${min.padStart(2, "0")}${tzLabel})`;
  }
  return `${dayStr} at ${hour}:${min.padStart(2, "0")}${tzLabel}`;
}

function formatJob(j: RawJob) {
  const state = j.state || {};
  const errors = state.consecutiveErrors || 0;
  return {
    id: j.id,
    name: j.name || j.id,
    schedule: j.schedule?.expr || "",
    schedule_human: cronToHuman(j.schedule?.expr || "", j.schedule?.tz),
    last_run: state.lastRunAtMs ? new Date(state.lastRunAtMs).toISOString() : "",
    next_run: state.nextRunAtMs ? new Date(state.nextRunAtMs).toISOString() : "",
    last_status: state.lastStatus === "ok" ? "success" : state.lastStatus === "error" ? "error" : "warning",
    last_duration_ms: state.lastDurationMs || 0,
    consecutive_errors: errors,
    last_error: state.lastError || null,
    health: errors >= 2 ? "red" : errors === 1 ? "yellow" : "green",
    enabled: j.enabled,
  };
}

async function fetchLocal(): Promise<ReturnType<typeof formatJob>[] | null> {
  try {
    const output = execSync("openclaw cron list --json 2>/dev/null", {
      timeout: 5000,
      encoding: "utf-8",
    });
    const data = JSON.parse(output);
    const jobs: RawJob[] = data.jobs || data;
    return jobs.map(formatJob);
  } catch {
    return null;
  }
}

async function fetchGist(): Promise<ReturnType<typeof formatJob>[] | null> {
  try {
    const res = await fetch(GIST_RAW_URL, {
      next: { revalidate: 0 },
      headers: { "Cache-Control": "no-cache" },
    });
    if (!res.ok) return null;
    const jobs = await res.json();
    // Gist data is already formatted
    return Array.isArray(jobs) ? jobs : [];
  } catch {
    return null;
  }
}

export async function GET() {
  // Try local first, fall back to gist
  let jobs = await fetchLocal();
  let source = "local";

  if (!jobs) {
    jobs = await fetchGist();
    source = "gist";
  }

  return NextResponse.json({
    jobs: jobs || [],
    source,
    timestamp: new Date().toISOString(),
  });
}
