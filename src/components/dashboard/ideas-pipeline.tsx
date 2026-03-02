"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { GitHubIssue } from "@/lib/types";
import { timeAgo } from "@/lib/utils-dashboard";
import { Lightbulb } from "lucide-react";

type IdeaStatus = "building" | "validated" | "validating" | "proposed" | "parked";

const STATUS_ORDER: IdeaStatus[] = ["building", "validated", "validating", "proposed", "parked"];

const STATUS_LABEL: Record<IdeaStatus, string> = {
  proposed: "Proposed",
  validating: "Validating",
  validated: "Validated",
  building: "Building",
  parked: "Parked",
};

const STATUS_BADGE_STYLE: Record<IdeaStatus, string> = {
  proposed: "border-zinc-700 text-zinc-400",
  validating: "border-amber-800 text-amber-400",
  validated: "border-emerald-800 text-emerald-400",
  building: "border-blue-800 text-blue-400",
  parked: "border-zinc-600 text-zinc-500",
};

const STATUS_DOT: Record<IdeaStatus, string> = {
  proposed: "bg-zinc-500",
  validating: "bg-amber-500",
  validated: "bg-emerald-500",
  building: "bg-blue-500",
  parked: "bg-zinc-600",
};

function getIdeaStatus(issue: GitHubIssue): IdeaStatus {
  const labels = issue.labels.map((l) => l.name);
  if (labels.includes("idea:building")) return "building";
  if (labels.includes("idea:validated")) return "validated";
  if (labels.includes("idea:validating")) return "validating";
  if (labels.includes("idea:parked")) return "parked";
  return "proposed";
}

function getScore(issue: GitHubIssue): number | null {
  const scoreLabel = issue.labels.find((l) => l.name.startsWith("score:"));
  if (scoreLabel) {
    const num = parseInt(scoreLabel.name.replace("score:", ""), 10);
    return isNaN(num) ? null : num;
  }
  return null;
}

export function IdeasPipeline({ issues }: { issues: GitHubIssue[] }) {
  // Only show open ideas from daldc/ideas (rejected = closed, won't appear)
  const ideas = issues
    .filter((i) => i.repo === "daldc/ideas")
    .map((issue) => ({
      ...issue,
      ideaStatus: getIdeaStatus(issue),
      score: getScore(issue),
    }))
    .sort((a, b) => {
      const orderDiff = STATUS_ORDER.indexOf(a.ideaStatus) - STATUS_ORDER.indexOf(b.ideaStatus);
      if (orderDiff !== 0) return orderDiff;
      // Within same status, higher scores first
      if (a.score !== null && b.score !== null) return b.score - a.score;
      if (a.score !== null) return -1;
      if (b.score !== null) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const activeIdeas = ideas.filter((i) => i.ideaStatus !== "parked");
  const parkedIdeas = ideas.filter((i) => i.ideaStatus === "parked");

  return (
    <Card className="border-zinc-800 bg-zinc-950">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-zinc-100">
            <Lightbulb className="h-4 w-4 text-amber-400" />
            Ideas Pipeline
          </CardTitle>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-zinc-500">
              {activeIdeas.length} active
            </span>
            {parkedIdeas.length > 0 && (
              <span className="font-mono text-xs text-zinc-600">
                {parkedIdeas.length} parked
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {activeIdeas.length > 0 ? (
          <div className="space-y-2">
            {activeIdeas.map((idea) => (
              <a
                key={idea.id}
                href={idea.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-md border border-zinc-800/50 bg-zinc-900/50 px-3 py-2.5 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
              >
                <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[idea.ideaStatus]}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-zinc-200 group-hover:text-zinc-50">
                    {idea.title}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`px-1.5 py-0 text-[10px] ${STATUS_BADGE_STYLE[idea.ideaStatus]}`}
                    >
                      {STATUS_LABEL[idea.ideaStatus]}
                    </Badge>
                    {idea.score !== null && (
                      <span className={`font-mono text-[10px] ${
                        idea.score >= 8 ? "text-emerald-400" :
                        idea.score >= 6 ? "text-amber-400" :
                        "text-zinc-500"
                      }`}>
                        {idea.score}/10
                      </span>
                    )}
                  </div>
                </div>
                <span className="shrink-0 text-[10px] text-zinc-600">
                  {timeAgo(idea.created_at)}
                </span>
              </a>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-zinc-500">
            No ideas in pipeline
          </p>
        )}
      </CardContent>
    </Card>
  );
}
