"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { GitHubIssue } from "@/lib/types";
import { timeAgo, repoShortName } from "@/lib/utils-dashboard";
import { Zap, Clock, FlaskConical, Settings, Archive, Pause, ChevronDown, ChevronRight, AlertTriangle, ShieldAlert } from "lucide-react";

type SprintTier = "high" | "sprint" | "backlog";

const TIER_CONFIG: Record<SprintTier, { label: string; icon: React.ReactNode; color: string }> = {
  high: { label: "High Priority", icon: <Zap className="h-4 w-4" />, color: "text-red-400" },
  sprint: { label: "Sprint", icon: <Clock className="h-4 w-4" />, color: "text-blue-400" },
  backlog: { label: "Backlog", icon: <Archive className="h-4 w-4" />, color: "text-zinc-400" },
};

function getStatusLabel(issue: GitHubIssue): string | null {
  const statusLabel = issue.labels.find((l) => l.name.startsWith("status:"));
  return statusLabel ? statusLabel.name.replace("status:", "") : null;
}

function getTier(issue: GitHubIssue): SprintTier {
  const labels = issue.labels.map((l) => l.name);
  if (labels.includes("priority:high")) return "high";
  if (labels.includes("priority:sprint")) return "sprint";
  return "backlog";
}

function getStatusColor(status: string | null): string {
  switch (status) {
    case "ready": return "bg-blue-500";
    case "in-progress": return "bg-amber-500";
    case "review": return "bg-purple-500";
    case "done": return "bg-emerald-500";
    case "blocked": return "bg-red-500";
    default: return "bg-zinc-500";
  }
}

function getStatusText(status: string | null): string {
  switch (status) {
    case "ready": return "Ready";
    case "in-progress": return "In Progress";
    case "review": return "Review";
    case "done": return "Done";
    case "blocked": return "Blocked";
    case "backlog": return "Backlog";
    default: return "—";
  }
}

function daysAgo(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

export function SprintBoard({ issues }: { issues: GitHubIssue[] }) {
  const [showBacklog, setShowBacklog] = useState(false);

  // Filter out ideas repo and done items
  const allItems = issues.filter((i) => i.repo !== "daldc/ideas" && getStatusLabel(i) !== "done");

  const highItems = allItems.filter((i) => getTier(i) === "high");
  const sprintItems = allItems.filter((i) => getTier(i) === "sprint" && getTier(i) !== "high");
  const backlogItems = allItems.filter((i) => getTier(i) === "backlog");

  const activeTiers = ([
    { key: "high" as SprintTier, items: highItems },
    { key: "sprint" as SprintTier, items: sprintItems },
  ]).filter((t) => t.items.length > 0);

  return (
    <Card className="border-zinc-800 bg-zinc-950">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-zinc-100">
            Sprint Board
          </CardTitle>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-zinc-500">
              {highItems.length + sprintItems.length} active
            </span>
            <span className="font-mono text-xs text-zinc-600">
              {backlogItems.length} backlog
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Active tiers */}
        {activeTiers.map(({ key, items }) => {
          const config = TIER_CONFIG[key];
          return (
            <div key={key}>
              <div className={`flex items-center gap-2 mb-3 ${config.color}`}>
                {config.icon}
                <h3 className="text-sm font-medium">{config.label}</h3>
                <span className="font-mono text-xs text-zinc-500">({items.length})</span>
              </div>
              <div className="space-y-2">
                {items.map((item) => (
                  <IssueRow key={item.id} issue={item} />
                ))}
              </div>
            </div>
          );
        })}

        {/* Blocked items (if any) */}
        {allItems.filter((i) => getStatusLabel(i) === "blocked").length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3 text-red-400">
              <ShieldAlert className="h-4 w-4" />
              <h3 className="text-sm font-medium">Blocked</h3>
            </div>
            <div className="space-y-2">
              {allItems.filter((i) => getStatusLabel(i) === "blocked").map((item) => (
                <IssueRow key={item.id} issue={item} />
              ))}
            </div>
          </div>
        )}

        {/* Collapsible Backlog */}
        {backlogItems.length > 0 && (
          <div>
            <button
              onClick={() => setShowBacklog(!showBacklog)}
              className="flex items-center gap-2 mb-3 text-zinc-400 hover:text-zinc-300 transition-colors"
            >
              {showBacklog ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <Archive className="h-4 w-4" />
              <h3 className="text-sm font-medium">Backlog</h3>
              <span className="font-mono text-xs text-zinc-500">({backlogItems.length})</span>
            </button>
            {showBacklog && (
              <div className="space-y-2">
                {backlogItems.map((item) => (
                  <IssueRow key={item.id} issue={item} />
                ))}
              </div>
            )}
          </div>
        )}

        {allItems.length === 0 && (
          <p className="text-center text-sm text-zinc-500 py-8">No issues found</p>
        )}
      </CardContent>
    </Card>
  );
}

function IssueRow({ issue }: { issue: GitHubIssue }) {
  const status = getStatusLabel(issue);
  const age = daysAgo(issue.created_at);
  const nonStatusLabels = issue.labels.filter(
    (l) => !l.name.startsWith("status:") && !l.name.startsWith("priority:")
  );

  return (
    <a
      href={issue.html_url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 rounded-md border border-zinc-800/50 bg-zinc-900/50 px-3 py-2.5 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
    >
      <span className={`h-2 w-2 shrink-0 rounded-full ${getStatusColor(status)}`} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-zinc-200 group-hover:text-zinc-50">
          {issue.title}
        </p>
        <div className="mt-1 flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs text-zinc-500">
            {repoShortName(issue.repo)}#{issue.number}
          </span>
          <Badge
            variant="outline"
            className={`px-1.5 py-0 text-[10px] ${
              status === "in-progress" ? "border-amber-800 text-amber-400" :
              status === "review" ? "border-purple-800 text-purple-400" :
              status === "blocked" ? "border-red-800 text-red-400" :
              "border-zinc-700 text-zinc-400"
            }`}
          >
            {getStatusText(status)}
          </Badge>
          {nonStatusLabels.slice(0, 2).map((label) => (
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
        {age >= 14 && <AlertTriangle className="h-3.5 w-3.5 text-red-400" />}
        {age >= 7 && age < 14 && <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />}
        <span className="font-mono text-xs text-zinc-500">
          {timeAgo(issue.updated_at)}
        </span>
      </div>
    </a>
  );
}
