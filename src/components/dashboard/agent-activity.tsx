"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AgentRun } from "@/lib/types";
import { repoShortName, timeAgo, formatDuration, statusColor } from "@/lib/utils-dashboard";
import { Bot } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  running: "Running",
  completed: "Completed",
  failed: "Failed",
  timed_out: "Timed Out",
};

const STATUS_BADGE_STYLE: Record<string, string> = {
  running: "border-blue-800 text-blue-400 bg-blue-950/30",
  completed: "border-emerald-800 text-emerald-400 bg-emerald-950/30",
  failed: "border-red-800 text-red-400 bg-red-950/30",
  timed_out: "border-amber-800 text-amber-400 bg-amber-950/30",
};

export function AgentActivity({ runs }: { runs: AgentRun[] }) {
  const sorted = [...runs].sort(
    (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
  );

  return (
    <Card className="border-zinc-800 bg-zinc-950">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-zinc-100">
            <Bot className="h-4 w-4 text-zinc-400" />
            Agent Activity
          </CardTitle>
          <span className="font-mono text-xs text-zinc-500">
            Last 24h
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {sorted.map((run) => (
            <div
              key={run.id}
              className={`flex items-center gap-3 rounded-md border border-zinc-800/50 bg-zinc-900/50 px-3 py-2.5 ${
                run.status === "running" ? "border-blue-900/50" : ""
              }`}
            >
              <span className={`h-2 w-2 shrink-0 rounded-full ${statusColor(run.status)} ${
                run.status === "running" ? "animate-pulse" : ""
              }`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-200">
                    {run.agent_name}
                  </span>
                  <Badge
                    variant="outline"
                    className={`px-1.5 py-0 text-[10px] ${STATUS_BADGE_STYLE[run.status] || ""}`}
                  >
                    {STATUS_LABEL[run.status] || run.status}
                  </Badge>
                </div>
                <p className="mt-0.5 truncate text-xs text-zinc-400">
                  {run.task}
                </p>
              </div>
              <div className="flex flex-col items-end shrink-0 gap-0.5">
                <span className="font-mono text-xs text-zinc-500">
                  {run.duration_seconds !== null
                    ? formatDuration(run.duration_seconds)
                    : "..."}
                </span>
                <span className="text-[10px] text-zinc-600">
                  {repoShortName(run.repo)} &middot; {timeAgo(run.started_at)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
