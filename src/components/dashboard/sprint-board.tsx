"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { GitHubIssue, PriorityTier, SprintItem } from "@/lib/types";
import { daysAgo, repoShortName, timeAgo } from "@/lib/utils-dashboard";
import { AlertTriangle, Clock, Zap, FlaskConical, Archive } from "lucide-react";

function classifyPriority(issue: GitHubIssue): PriorityTier {
  const labels = issue.labels.map((l) => l.name.toLowerCase());
  if (labels.some((l) => l.includes("urgent") || l.includes("high") || l.includes("priority") || l.includes("p0") || l.includes("p1")))
    return "high";
  if (labels.some((l) => l.includes("ready") || l.includes("next") || l.includes("sprint")))
    return "ready_to_build";
  if (labels.some((l) => l.includes("research") || l.includes("validation") || l.includes("explore")))
    return "validation";
  return "backlog";
}

function classifyStatus(issue: GitHubIssue): SprintItem["status"] {
  const labels = issue.labels.map((l) => l.name.toLowerCase());
  if (labels.some((l) => l.includes("done") || l.includes("closed"))) return "done";
  if (labels.some((l) => l.includes("review") || l.includes("pr"))) return "review";
  if (labels.some((l) => l.includes("progress") || l.includes("wip"))) return "in_progress";
  return "ready";
}

const TIER_CONFIG: Record<PriorityTier, { label: string; icon: React.ReactNode; color: string }> = {
  high: { label: "High Priority", icon: <Zap className="h-4 w-4" />, color: "text-red-400" },
  ready_to_build: { label: "Ready to Build", icon: <Clock className="h-4 w-4" />, color: "text-blue-400" },
  validation: { label: "Validation / Research", icon: <FlaskConical className="h-4 w-4" />, color: "text-amber-400" },
  backlog: { label: "Backlog", icon: <Archive className="h-4 w-4" />, color: "text-zinc-400" },
};

export function SprintBoard({ issues }: { issues: GitHubIssue[] }) {
  const filteredIssues = issues.filter((i) => i.repo !== "daldc/ideas");

  const sprintItems: SprintItem[] = filteredIssues.map((issue) => ({
    ...issue,
    priority: classifyPriority(issue),
    status: classifyStatus(issue),
    age_days: daysAgo(issue.created_at),
  }));

  const tiers: PriorityTier[] = ["high", "ready_to_build", "validation", "backlog"];

  return (
    <Card className="border-zinc-800 bg-zinc-950">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-zinc-100">
            Sprint Board
          </CardTitle>
          <span className="font-mono text-xs text-zinc-500">
            {sprintItems.length} items
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {tiers.map((tier) => {
          const items = sprintItems.filter((i) => i.priority === tier);
          if (items.length === 0) return null;
          const config = TIER_CONFIG[tier];
          return (
            <div key={tier}>
              <div className={`flex items-center gap-2 mb-3 ${config.color}`}>
                {config.icon}
                <h3 className="text-sm font-medium">{config.label}</h3>
                <span className="font-mono text-xs text-zinc-500">({items.length})</span>
              </div>
              <div className="space-y-2">
                {items.slice(0, 8).map((item) => (
                  <a
                    key={item.id}
                    href={item.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 rounded-md border border-zinc-800/50 bg-zinc-900/50 px-3 py-2.5 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
                  >
                    <StatusDot status={item.status} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-zinc-200 group-hover:text-zinc-50">
                        {item.title}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="font-mono text-xs text-zinc-500">
                          {repoShortName(item.repo)}#{item.number}
                        </span>
                        {item.labels.slice(0, 3).map((label) => (
                          <Badge
                            key={label.name}
                            variant="outline"
                            className="border-zinc-700 px-1.5 py-0 text-[10px] text-zinc-400"
                          >
                            {label.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {item.age_days >= 14 && (
                        <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                      )}
                      {item.age_days >= 7 && item.age_days < 14 && (
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                      )}
                      <span className="font-mono text-xs text-zinc-500">
                        {timeAgo(item.updated_at)}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          );
        })}
        {sprintItems.length === 0 && (
          <p className="text-center text-sm text-zinc-500 py-8">No issues found</p>
        )}
      </CardContent>
    </Card>
  );
}

function StatusDot({ status }: { status: SprintItem["status"] }) {
  const colors: Record<string, string> = {
    ready: "bg-zinc-500",
    in_progress: "bg-blue-500",
    review: "bg-amber-500",
    done: "bg-emerald-500",
  };
  return (
    <span
      className={`h-2 w-2 shrink-0 rounded-full ${colors[status] || "bg-zinc-500"}`}
    />
  );
}
