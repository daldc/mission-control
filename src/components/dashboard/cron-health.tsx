"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CronJob } from "@/lib/types";
import { healthColor, formatDate } from "@/lib/utils-dashboard";
import { Timer } from "lucide-react";

export function CronHealth({ jobs }: { jobs: CronJob[] }) {
  const sorted = [...jobs].sort((a, b) => {
    const order = { red: 0, yellow: 1, green: 2 };
    return order[a.health] - order[b.health];
  });

  return (
    <Card className="border-zinc-800 bg-zinc-950">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-zinc-100">
            <Timer className="h-4 w-4 text-zinc-400" />
            Cron & Automation Health
          </CardTitle>
          <div className="flex items-center gap-3">
            {(["green", "yellow", "red"] as const).map((h) => {
              const count = jobs.filter((j) => j.health === h).length;
              return (
                <div key={h} className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${healthColor(h)}`} />
                  <span className="font-mono text-xs text-zinc-500">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800/50 text-left">
                <th className="pb-2 text-xs font-medium text-zinc-500">Status</th>
                <th className="pb-2 text-xs font-medium text-zinc-500">Name</th>
                <th className="pb-2 text-xs font-medium text-zinc-500">Schedule</th>
                <th className="pb-2 text-xs font-medium text-zinc-500">Last Run</th>
                <th className="pb-2 text-xs font-medium text-zinc-500">Next Run</th>
                <th className="pb-2 text-xs font-medium text-zinc-500 text-right">Errors</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((job) => (
                <tr
                  key={job.id}
                  className={`border-b border-zinc-800/30 ${
                    job.health === "red" ? "bg-red-950/20" : ""
                  }`}
                >
                  <td className="py-2.5 pr-3">
                    <span className={`inline-block h-2.5 w-2.5 rounded-full ${healthColor(job.health)}`} />
                  </td>
                  <td className="py-2.5 pr-3">
                    <span className="text-zinc-200">{job.name}</span>
                  </td>
                  <td className="py-2.5 pr-3">
                    <span className="font-mono text-xs text-zinc-400">{job.schedule_human}</span>
                  </td>
                  <td className="py-2.5 pr-3">
                    <span className="font-mono text-xs text-zinc-500">{formatDate(job.last_run)}</span>
                  </td>
                  <td className="py-2.5 pr-3">
                    <span className="font-mono text-xs text-zinc-500">{formatDate(job.next_run)}</span>
                  </td>
                  <td className="py-2.5 text-right">
                    <span
                      className={`font-mono text-xs ${
                        job.consecutive_errors >= 2
                          ? "text-red-400"
                          : job.consecutive_errors === 1
                          ? "text-amber-400"
                          : "text-zinc-600"
                      }`}
                    >
                      {job.consecutive_errors}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
