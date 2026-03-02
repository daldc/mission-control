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
import { timeAgo } from "@/lib/utils-dashboard";
import { Lightbulb, Loader2, X } from "lucide-react";

type IdeaStatus = "building" | "validated" | "validating" | "proposed" | "parked";

const STATUS_ORDER: IdeaStatus[] = ["building", "validated", "validating", "proposed", "parked"];

const STATUS_OPTIONS: { value: string; label: string; color: string }[] = [
  { value: "proposed", label: "Proposed", color: "text-zinc-400" },
  { value: "validating", label: "Validating", color: "text-amber-400" },
  { value: "validated", label: "Validated", color: "text-emerald-400" },
  { value: "building", label: "Building", color: "text-blue-400" },
  { value: "shipped", label: "Shipped", color: "text-purple-400" },
  { value: "parked", label: "Parked", color: "text-zinc-500" },
  { value: "rejected", label: "Reject", color: "text-red-400" },
];

const STATUS_BADGE_STYLE: Record<string, string> = {
  proposed: "border-zinc-700 text-zinc-400",
  validating: "border-amber-800 text-amber-400",
  validated: "border-emerald-800 text-emerald-400",
  building: "border-blue-800 text-blue-400",
  parked: "border-zinc-600 text-zinc-500",
};

const STATUS_DOT: Record<string, string> = {
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

export function IdeasPipeline({ issues, onRefresh }: { issues: GitHubIssue[]; onRefresh?: () => void }) {
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
        {ideas.length > 0 ? (
          <div className="space-y-2">
            {/* Active ideas */}
            {activeIdeas.map((idea) => (
              <IdeaRow
                key={idea.id}
                issue={idea}
                status={idea.ideaStatus}
                score={idea.score}
                onRefresh={onRefresh}
              />
            ))}
            {/* Parked section */}
            {parkedIdeas.length > 0 && (
              <>
                <div className="pt-2 pb-1">
                  <span className="text-xs font-medium text-zinc-500">Parked</span>
                </div>
                {parkedIdeas.map((idea) => (
                  <IdeaRow
                    key={idea.id}
                    issue={idea}
                    status={idea.ideaStatus}
                    score={idea.score}
                    onRefresh={onRefresh}
                  />
                ))}
              </>
            )}
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

function IdeaRow({
  issue,
  status,
  score,
  onRefresh,
}: {
  issue: GitHubIssue;
  status: IdeaStatus;
  score: number | null;
  onRefresh?: () => void;
}) {
  const [updating, setUpdating] = useState(false);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  async function updateStatus(newStatus: string) {
    if (newStatus === "rejected") {
      setShowRejectInput(true);
      return;
    }
    setUpdating(true);
    try {
      await fetch("/api/ideas/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repo: issue.repo,
          issueNumber: issue.number,
          newStatus,
        }),
      });
      onRefresh?.();
    } catch (err) {
      console.error("Failed to update idea:", err);
    } finally {
      setUpdating(false);
    }
  }

  async function confirmReject() {
    setUpdating(true);
    try {
      await fetch("/api/ideas/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repo: issue.repo,
          issueNumber: issue.number,
          newStatus: "rejected",
          reason: rejectReason || "Decided not to pursue",
        }),
      });
      setShowRejectInput(false);
      setRejectReason("");
      onRefresh?.();
    } catch (err) {
      console.error("Failed to reject idea:", err);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="group rounded-md border border-zinc-800/50 bg-zinc-900/50 px-3 py-2.5 transition-colors hover:border-zinc-700 hover:bg-zinc-900">
      <div className="flex items-center gap-3">
        <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[status] || "bg-zinc-500"}`} />
        <div className="min-w-0 flex-1">
          <a
            href={issue.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-sm text-zinc-200 hover:text-zinc-50"
          >
            {issue.title}
          </a>
          <div className="mt-1 flex items-center gap-2">
            {score !== null && (
              <span className={`font-mono text-[10px] ${
                score >= 8 ? "text-emerald-400" :
                score >= 6 ? "text-amber-400" :
                "text-zinc-500"
              }`}>
                {score}/10
              </span>
            )}
            <span className="text-[10px] text-zinc-600">
              #{issue.number} · {timeAgo(issue.created_at)}
            </span>
          </div>
        </div>

        {/* Status selector */}
        <div className="shrink-0">
          {updating ? (
            <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
          ) : (
            <Select value={status} onValueChange={updateStatus}>
              <SelectTrigger className="h-7 w-[120px] border-zinc-700/50 bg-zinc-900/80 text-[11px] text-zinc-400 hover:border-zinc-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-zinc-700 bg-zinc-900">
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className={`text-xs ${opt.color}`}
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Reject reason input */}
      {showRejectInput && (
        <div className="mt-2 flex items-center gap-2">
          <input
            type="text"
            placeholder="Why are we passing? (optional)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && confirmReject()}
            className="flex-1 rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-200 placeholder-zinc-500 outline-none focus:border-zinc-600"
            autoFocus
          />
          <button
            onClick={confirmReject}
            disabled={updating}
            className="rounded bg-red-900/50 px-2 py-1 text-xs text-red-400 hover:bg-red-900/70"
          >
            {updating ? "..." : "Reject"}
          </button>
          <button
            onClick={() => { setShowRejectInput(false); setRejectReason(""); }}
            className="text-zinc-500 hover:text-zinc-300"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
