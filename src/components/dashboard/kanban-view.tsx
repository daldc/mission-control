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
import type { SprintEntry, GitHubIssue } from "@/lib/types";

type KanbanColumn = "backlog" | "ready" | "in_progress" | "review" | "done";

const COLUMNS: { key: KanbanColumn; label: string; color: string }[] = [
  { key: "backlog", label: "Backlog", color: "border-t-zinc-500" },
  { key: "ready", label: "Ready", color: "border-t-blue-500" },
  { key: "in_progress", label: "In Progress", color: "border-t-amber-500" },
  { key: "review", label: "Review", color: "border-t-purple-500" },
  { key: "done", label: "Done", color: "border-t-emerald-500" },
];

function sprintEntryToColumn(entry: SprintEntry, ghIssue?: GitHubIssue): KanbanColumn {
  // First check sprint entry status
  if (entry.status === "done") return "done";
  if (entry.status === "failed") return "done";
  if (entry.status === "in_progress") return "in_progress";

  // Check GitHub issue labels for more granularity
  if (ghIssue) {
    const labels = ghIssue.labels.map((l) => l.name.toLowerCase());
    if (labels.some((l) => l.includes("review") || l.includes("pr"))) return "review";
    if (labels.some((l) => l.includes("progress") || l.includes("wip"))) return "in_progress";
  }

  // Map sprint tier to column
  if (entry.tier === "backlog" || entry.tier === "paused") return "backlog";
  if (entry.tier === "high" || entry.tier === "ready_to_build") return "ready";
  if (entry.tier === "validation" || entry.tier === "operations") return "ready";

  return "backlog";
}

function repoShort(repo: string) {
  return repo.replace("daldc/", "");
}

function issueUrl(entry: SprintEntry) {
  if (!entry.repo || !entry.number) return null;
  return `https://github.com/${entry.repo}/issues/${entry.number}`;
}

export function KanbanView({ sprintEntries, issues }: { sprintEntries: SprintEntry[]; issues: GitHubIssue[] }) {
  const [repoFilter, setRepoFilter] = useState<string>("all");

  // Build a lookup of GitHub issues for enrichment
  const issueMap = new Map<string, GitHubIssue>();
  for (const issue of issues) {
    issueMap.set(`${issue.repo}#${issue.number}`, issue);
  }

  // Only show entries that have real issue refs (skip done summary items without repos)
  const kanbanEntries = sprintEntries
    .filter((e) => e.repo && e.number > 0)
    .filter((e) => repoFilter === "all" || e.repo === repoFilter);

  const repos = Array.from(new Set(sprintEntries.filter((e) => e.repo).map((e) => e.repo)));

  const grouped = COLUMNS.map((col) => ({
    ...col,
    items: kanbanEntries.filter((e) => {
      const ghIssue = issueMap.get(`${e.repo}#${e.number}`);
      return sprintEntryToColumn(e, ghIssue) === col.key;
    }),
  }));

  return (
    <Card className="border-zinc-800 bg-zinc-950">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-zinc-100">
            Kanban
          </CardTitle>
          <Select value={repoFilter} onValueChange={setRepoFilter}>
            <SelectTrigger className="h-8 w-[180px] border-zinc-700 bg-zinc-900 text-xs text-zinc-300">
              <SelectValue placeholder="Filter by repo" />
            </SelectTrigger>
            <SelectContent className="border-zinc-700 bg-zinc-900">
              <SelectItem value="all" className="text-xs text-zinc-300">All repos</SelectItem>
              {repos.map((repo) => (
                <SelectItem key={repo} value={repo} className="text-xs text-zinc-300">
                  {repoShort(repo)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 md:grid md:grid-cols-5 md:overflow-x-visible md:snap-none md:pb-0">
          {grouped.map((col) => (
            <div key={col.key} className={`min-w-[75vw] snap-center rounded-lg border border-zinc-800/50 bg-zinc-900/30 border-t-2 ${col.color} md:min-w-0`}>
              <div className="flex items-center justify-between px-3 py-2.5">
                <h3 className="text-xs font-medium text-zinc-400">{col.label}</h3>
                <span className="font-mono text-[10px] text-zinc-600">{col.items.length}</span>
              </div>
              <div className="space-y-2 px-2 pb-2 max-h-[400px] overflow-y-auto">
                {col.items.map((entry) => {
                  const url = issueUrl(entry);
                  const Wrapper = url ? "a" : "div";
                  const linkProps = url ? { href: url, target: "_blank" as const, rel: "noopener noreferrer" } : {};
                  return (
                    <Wrapper
                      key={entry.id}
                      {...linkProps}
                      className="group block rounded-md border border-zinc-800/50 bg-zinc-950/80 p-2.5 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
                    >
                      <p className="text-xs text-zinc-300 leading-relaxed group-hover:text-zinc-100 line-clamp-2">
                        {entry.title}
                      </p>
                      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-[10px] text-zinc-500">
                          {repoShort(entry.repo)}
                        </span>
                        {entry.tags.slice(0, 2).map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="border-zinc-700/50 px-1 py-0 text-[9px] text-zinc-500"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </Wrapper>
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
