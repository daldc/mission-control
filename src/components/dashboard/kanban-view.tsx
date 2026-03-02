"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { GitHubIssue } from "@/lib/types";
import { daysAgo, repoShortName, timeAgo } from "@/lib/utils-dashboard";

type KanbanColumn = "backlog" | "ready" | "in_progress" | "review" | "done";

const COLUMNS: { key: KanbanColumn; label: string; color: string }[] = [
  { key: "backlog", label: "Backlog", color: "border-t-zinc-500" },
  { key: "ready", label: "Ready", color: "border-t-blue-500" },
  { key: "in_progress", label: "In Progress", color: "border-t-amber-500" },
  { key: "review", label: "Review", color: "border-t-purple-500" },
  { key: "done", label: "Done", color: "border-t-emerald-500" },
];

function classifyColumn(issue: GitHubIssue): KanbanColumn {
  const labels = issue.labels.map((l) => l.name.toLowerCase());
  if (labels.some((l) => l.includes("done") || l.includes("closed"))) return "done";
  if (labels.some((l) => l.includes("review") || l.includes("pr"))) return "review";
  if (labels.some((l) => l.includes("progress") || l.includes("wip"))) return "in_progress";
  if (labels.some((l) => l.includes("ready") || l.includes("next") || l.includes("sprint"))) return "ready";
  return "backlog";
}

export function KanbanView({ issues }: { issues: GitHubIssue[] }) {
  const [repoFilter, setRepoFilter] = useState<string>("all");

  const filteredIssues = issues
    .filter((i) => i.repo !== "daldc/ideas")
    .filter((i) => repoFilter === "all" || i.repo === repoFilter);

  const repos = Array.from(new Set(issues.filter((i) => i.repo !== "daldc/ideas").map((i) => i.repo)));

  const grouped = COLUMNS.map((col) => ({
    ...col,
    items: filteredIssues.filter((i) => classifyColumn(i) === col.key),
  }));

  return (
    <Card className="border-zinc-800 bg-zinc-950">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-zinc-100">
            Kanban View
          </CardTitle>
          <Select value={repoFilter} onValueChange={setRepoFilter}>
            <SelectTrigger className="h-8 w-[180px] border-zinc-700 bg-zinc-900 text-xs text-zinc-300">
              <SelectValue placeholder="Filter by repo" />
            </SelectTrigger>
            <SelectContent className="border-zinc-700 bg-zinc-900">
              <SelectItem value="all" className="text-xs text-zinc-300">All repos</SelectItem>
              {repos.map((repo) => (
                <SelectItem key={repo} value={repo} className="text-xs text-zinc-300">
                  {repoShortName(repo)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {/* Mobile: horizontal scroll with snap */}
        <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 md:grid md:grid-cols-5 md:overflow-x-visible md:snap-none md:pb-0">
          {grouped.map((col) => (
            <div key={col.key} className={`min-w-[75vw] snap-center rounded-lg border border-zinc-800/50 bg-zinc-900/30 border-t-2 ${col.color} md:min-w-0`}>
              <div className="flex items-center justify-between px-3 py-2.5">
                <h3 className="text-xs font-medium text-zinc-400">{col.label}</h3>
                <span className="font-mono text-[10px] text-zinc-600">{col.items.length}</span>
              </div>
              <div className="space-y-2 px-2 pb-2 max-h-[400px] overflow-y-auto">
                {col.items.map((issue) => {
                  const age = daysAgo(issue.created_at);
                  return (
                    <a
                      key={issue.id}
                      href={issue.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block rounded-md border border-zinc-800/50 bg-zinc-950/80 p-2.5 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
                    >
                      <p className="text-xs text-zinc-300 leading-relaxed group-hover:text-zinc-100 line-clamp-2">
                        {issue.title}
                      </p>
                      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-[10px] text-zinc-500">
                          {repoShortName(issue.repo)}
                        </span>
                        {issue.labels.slice(0, 2).map((label) => (
                          <Badge
                            key={label.name}
                            variant="outline"
                            className="border-zinc-700/50 px-1 py-0 text-[9px] text-zinc-500"
                          >
                            {label.name}
                          </Badge>
                        ))}
                      </div>
                      <div className="mt-1.5 flex items-center justify-between">
                        <span className="text-[10px] text-zinc-600">
                          {age > 0 ? `${age}d old` : "today"}
                        </span>
                        {issue.assignee && (
                          <span className="text-[10px] text-zinc-500">
                            @{issue.assignee}
                          </span>
                        )}
                      </div>
                    </a>
                  );
                })}
                {col.items.length === 0 && (
                  <p className="py-4 text-center text-[10px] text-zinc-600">Empty</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
