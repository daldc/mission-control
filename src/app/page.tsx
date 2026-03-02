"use client";

import { useEffect, useState, useCallback } from "react";
import { SprintBoard } from "@/components/dashboard/sprint-board";
import { KanbanView } from "@/components/dashboard/kanban-view";
import { ProjectCards } from "@/components/dashboard/project-cards";
import { CronHealth } from "@/components/dashboard/cron-health";
import { AgentActivity } from "@/components/dashboard/agent-activity";
import { IdeasPipeline } from "@/components/dashboard/ideas-pipeline";
import { mockCronJobs, mockAgentRuns } from "@/lib/mock-data";
import type { GitHubIssue, GitHubPR, GitHubActivity, SprintEntry } from "@/lib/types";
import { RefreshCw, Radio } from "lucide-react";

const REFRESH_INTERVAL = parseInt(
  process.env.NEXT_PUBLIC_REFRESH_INTERVAL || "60000",
  10
);

export default function Dashboard() {
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [prs, setPRs] = useState<GitHubPR[]>([]);
  const [activity, setActivity] = useState<GitHubActivity[]>([]);
  const [sprintEntries, setSprintEntries] = useState<SprintEntry[]>([]);
  const [sprintUpdated, setSprintUpdated] = useState<string>("");
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [issuesRes, prsRes, activityRes, sprintRes] = await Promise.allSettled([
        fetch("/api/github/issues"),
        fetch("/api/github/prs"),
        fetch("/api/github/activity"),
        fetch("/api/sprint"),
      ]);

      if (issuesRes.status === "fulfilled" && issuesRes.value.ok) {
        const data = await issuesRes.value.json();
        setIssues(data.issues || []);
      }
      if (prsRes.status === "fulfilled" && prsRes.value.ok) {
        const data = await prsRes.value.json();
        setPRs(data.prs || []);
      }
      if (activityRes.status === "fulfilled" && activityRes.value.ok) {
        const data = await activityRes.value.json();
        setActivity(data.activity || []);
      }
      if (sprintRes.status === "fulfilled" && sprintRes.value.ok) {
        const data = await sprintRes.value.json();
        setSprintEntries(data.entries || []);
        setSprintUpdated(data.lastUpdated || "");
      }

      setLastUpdate(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Radio className="h-5 w-5 text-emerald-500" />
            <h1 className="text-xl font-bold tracking-tight text-zinc-50">
              Mission Control
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {lastUpdate && (
              <span className="font-mono text-xs text-zinc-500">
                Updated {lastUpdate}
              </span>
            )}
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-300 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>
      </header>

      {/* Loading State */}
      {loading ? (
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="h-6 w-6 animate-spin text-zinc-500" />
            <p className="text-sm text-zinc-500">Loading dashboard...</p>
          </div>
        </div>
      ) : (
        <main className="mx-auto max-w-[1600px] space-y-6 px-6 py-6">
          {/* Section 1: Sprint Board (hero) */}
          <SprintBoard entries={sprintEntries} lastUpdated={sprintUpdated} />

          {/* Section 2: Kanban View */}
          <KanbanView sprintEntries={sprintEntries} issues={issues} />

          {/* Section 3: Project Cards */}
          <ProjectCards issues={issues} prs={prs} activity={activity} />

          {/* Section 4 & 5: Cron Health + Agent Activity (side by side) */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <CronHealth jobs={mockCronJobs} />
            <AgentActivity runs={mockAgentRuns} />
          </div>

          {/* Section 6: Ideas Pipeline */}
          <IdeasPipeline issues={issues} />

          {/* Footer */}
          <footer className="border-t border-zinc-800/30 py-4">
            <p className="text-center font-mono text-xs text-zinc-600">
              Mission Control v0.1.0 &middot; Auto-refresh{" "}
              {REFRESH_INTERVAL / 1000}s
            </p>
          </footer>
        </main>
      )}
    </div>
  );
}
