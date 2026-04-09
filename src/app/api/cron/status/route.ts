import { NextResponse } from "next/server";
import { execSync } from "child_process";

export const dynamic = "force-dynamic";

const GIST_RAW_URL =
  "https://gist.githubusercontent.com/daldc/8e29068c94557579b1c3456a0551ebe5/raw/cron-status.json";

interface RawJob {
  id: string;
  name: string;
  enabled?: boolean;
  schedule: { kind: string; expr: string; tz?: string; staggerMs?: number };
  state?: {
    nextRunAtMs?: number;
    lastRunAtMs?: number;
    lastStatus?: string;
    lastDurationMs?: number;
    consecutiveErrors?: number;
    lastError?: string;
  };
}

function formatTime(hour: string, min: string) {
  const h = Number(hour);
  const m = min.padStart(2, "0");
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m} ${suffix}`;
}

function formatHourList(hourExpr: string, min: string) {
  return hourExpr
    .split(",")
    .map((hour) => formatTime(hour, min))
    .join(", ");
}

function cronToHuman(expr: string, tz?: string, staggerMs?: number): string {
  const parts = expr.trim().split(/\s+/);
  if (parts.length < 5) return expr;

  const [min, hour, dom, month, dow] = parts;
  const tzLabel = tz ? ` ${tz.split("/").pop() || tz}` : "";
  const staggerLabel = staggerMs ? ` (+${Math.round(staggerMs / 60000)}m stagger)` : "";

  if (expr === "0 * * * *") return `Hourly${staggerLabel}`;
  if (hour.includes(",") && dom === "*" && month === "*" && dow === "*") {
    return `Daily at ${formatHourList(hour, min)}${tzLabel}`;
  }
  if (dom === "*" && month === "*" && dow === "*") {
    return `Daily at ${formatTime(hour, min)}${tzLabel}`;
  }
  if (dom === "*" && month === "*" && dow === "1-5") {
    return `Weekdays at ${formatTime(hour, min)}${tzLabel}`;
  }
  if (dom === "*" && month === "*" && dow === "1-4") {
    return `Mon-Thu at ${formatTime(hour, min)}${tzLabel}`;
  }
  if (dom === "*" && month === "*" && dow === "6") {
    return `Saturdays at ${formatTime(hour, min)}${tzLabel}`;
  }
  if (dom === "*" && month === "*" && dow === "0") {
    return `Sundays at ${formatTime(hour, min)}${tzLabel}`;
  }
  if (dom !== "*" && month === "*" && dow === "*") {
    return `Monthly on day ${dom} at ${formatTime(hour, min)}${tzLabel}`;
  }

  return `${expr}${tzLabel}`;
}

function formatJob(j: RawJob) {
  const state = j.state || {};
  const errors = state.consecutiveErrors || 0;
  return {
    id: j.id,
    name: j.name || j.id,
    schedule: j.schedule?.expr || "",
    schedule_human: cronToHuman(j.schedule?.expr || "", j.schedule?.tz, j.schedule?.staggerMs),
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
    return jobs.filter((job) => job.enabled !== false).map(formatJob);
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
