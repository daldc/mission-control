"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { GitHubIssue, Idea, IdeaStatus } from "@/lib/types";
import { statusColor, timeAgo } from "@/lib/utils-dashboard";
import { Lightbulb } from "lucide-react";

const STATUS_ORDER: IdeaStatus[] = ["building", "validated", "validating", "proposed", "shipped"];

const STATUS_LABEL: Record<IdeaStatus, string> = {
  proposed: "Proposed",
  validating: "Validating",
  validated: "Validated",
  building: "Building",
  shipped: "Shipped",
};

const STATUS_BADGE_STYLE: Record<IdeaStatus, string> = {
  proposed: "border-zinc-700 text-zinc-400",
  validating: "border-amber-800 text-amber-400",
  validated: "border-emerald-800 text-emerald-400",
  building: "border-blue-800 text-blue-400",
  shipped: "border-purple-800 text-purple-400",
};

function classifyIdeaStatus(issue: GitHubIssue): IdeaStatus {
  const labels = issue.labels.map((l) => l.name.toLowerCase());
  if (labels.some((l) => l.includes("shipped") || l.includes("launched"))) return "shipped";
  if (labels.some((l) => l.includes("building") || l.includes("build"))) return "building";
  if (labels.some((l) => l.includes("validated"))) return "validated";
  if (labels.some((l) => l.includes("validating") || l.includes("validation"))) return "validating";
  return "proposed";
}

function getValidationScore(issue: GitHubIssue): number | null {
  const label = issue.labels.find((l) => /score[:\-_]?\d+/i.test(l.name));
  if (label) {
    const match = label.name.match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
  }
  return null;
}

export function IdeasPipeline({ issues }: { issues: GitHubIssue[] }) {
  const ideas: Idea[] = issues
    .filter((i) => i.repo === "daldc/ideas")
    .map((issue) => ({
      id: issue.id,
      title: issue.title,
      status: classifyIdeaStatus(issue),
      validation_score: getValidationScore(issue),
      labels: issue.labels,
      created_at: issue.created_at,
      html_url: issue.html_url,
      body_preview: "",
    }));

  ideas.sort((a, b) => {
    const orderDiff = STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
    if (orderDiff !== 0) return orderDiff;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <Card className="border-zinc-800 bg-zinc-950">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-zinc-100">
            <Lightbulb className="h-4 w-4 text-zinc-400" />
            Ideas Pipeline
          </CardTitle>
          <span className="font-mono text-xs text-zinc-500">
            {ideas.length} ideas
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {ideas.length > 0 ? (
          <div className="space-y-2">
            {ideas.map((idea) => (
              <a
                key={idea.id}
                href={idea.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-md border border-zinc-800/50 bg-zinc-900/50 px-3 py-2.5 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
              >
                <span className={`h-2 w-2 shrink-0 rounded-full ${statusColor(idea.status)}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-zinc-200 group-hover:text-zinc-50">
                    {idea.title}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`px-1.5 py-0 text-[10px] ${STATUS_BADGE_STYLE[idea.status]}`}
                    >
                      {STATUS_LABEL[idea.status]}
                    </Badge>
                    {idea.validation_score !== null && (
                      <span className="font-mono text-[10px] text-zinc-500">
                        score: {idea.validation_score}
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
            No ideas found in daldc/ideas
          </p>
        )}
      </CardContent>
    </Card>
  );
}
