"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { GitHubIssue, GitHubPR, GitHubActivity, ProjectCard } from "@/lib/types";
import { repoShortName, timeAgo, healthColor } from "@/lib/utils-dashboard";
import { ExternalLink, GitPullRequest, CircleDot, Pause } from "lucide-react";

const PROJECT_META: Record<string, { name: string; description: string; deploy_url: string | null; paused: boolean }> = {
  "daldc/grocerease": {
    name: "GrocerEase",
    description: "Smart grocery comparison & meal planning",
    deploy_url: null,
    paused: false,
  },
  "daldc/polymarket-arb": {
    name: "Polymarket Arb",
    description: "Prediction market arbitrage detection",
    deploy_url: null,
    paused: false,
  },
  "daldc/trading-assistant": {
    name: "Trading Assistant",
    description: "AI-powered trading signals & analysis",
    deploy_url: null,
    paused: false,
  },
  "daldc/crosslist": {
    name: "CrossList",
    description: "Multi-platform listing & inventory sync",
    deploy_url: null,
    paused: true,
  },
  "daldc/tasks": {
    name: "Tasks",
    description: "Sprint tracking & task management",
    deploy_url: null,
    paused: false,
  },
};

function getHealth(lastActivity: string, paused: boolean): "green" | "yellow" | "red" {
  if (paused) return "yellow";
  const days = Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 3) return "green";
  if (days <= 7) return "yellow";
  return "red";
}

export function ProjectCards({
  issues,
  prs,
  activity,
}: {
  issues: GitHubIssue[];
  prs: GitHubPR[];
  activity: GitHubActivity[];
}) {
  const projects: ProjectCard[] = Object.entries(PROJECT_META).map(([repo, meta]) => {
    const repoIssues = issues.filter((i) => i.repo === repo);
    const repoPRs = prs.filter((p) => p.repo === repo);
    const repoActivity = activity.filter((a) => a.repo === repo);
    const lastAct = repoActivity[0]?.date || new Date().toISOString();

    return {
      ...meta,
      repo,
      open_issues: repoIssues.length,
      open_prs: repoPRs.length,
      last_activity: lastAct,
      health: getHealth(lastAct, meta.paused),
    };
  });

  return (
    <Card className="border-zinc-800 bg-zinc-950">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-zinc-100">Projects</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <a
              key={project.repo}
              href={`https://github.com/${project.repo}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative rounded-lg border border-zinc-800/50 bg-zinc-900/50 p-4 transition-all hover:border-zinc-700 hover:bg-zinc-900"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${healthColor(project.health)}`} />
                  <h3 className="text-sm font-medium text-zinc-200 group-hover:text-zinc-50">
                    {project.name}
                  </h3>
                </div>
                <div className="flex items-center gap-1.5">
                  {project.paused && (
                    <Badge variant="outline" className="border-amber-800 text-[10px] text-amber-400 gap-1 px-1.5 py-0">
                      <Pause className="h-2.5 w-2.5" />
                      paused
                    </Badge>
                  )}
                  <ExternalLink className="h-3.5 w-3.5 text-zinc-600 opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              </div>
              <p className="mt-1.5 text-xs text-zinc-500 leading-relaxed">
                {project.description}
              </p>
              <div className="mt-3 flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1 text-zinc-400">
                  <CircleDot className="h-3 w-3" />
                  <span className="font-mono">{project.open_issues}</span> issues
                </span>
                <span className="flex items-center gap-1 text-zinc-400">
                  <GitPullRequest className="h-3 w-3" />
                  <span className="font-mono">{project.open_prs}</span> PRs
                </span>
                <span className="ml-auto text-zinc-500">
                  {timeAgo(project.last_activity)}
                </span>
              </div>
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
