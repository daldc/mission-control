"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SprintEntry, SprintTier } from "@/lib/types";
import { Zap, Clock, FlaskConical, Settings, Archive, Pause, ChevronDown, ChevronRight, CheckCircle2, XCircle } from "lucide-react";

const TIER_CONFIG: Record<SprintTier, { label: string; icon: React.ReactNode; color: string }> = {
  high: { label: "High Priority", icon: <Zap className="h-4 w-4" />, color: "text-red-400" },
  ready_to_build: { label: "Ready to Build", icon: <Clock className="h-4 w-4" />, color: "text-blue-400" },
  validation: { label: "Validation / Research", icon: <FlaskConical className="h-4 w-4" />, color: "text-amber-400" },
  operations: { label: "Operations", icon: <Settings className="h-4 w-4" />, color: "text-purple-400" },
  backlog: { label: "Backlog", icon: <Archive className="h-4 w-4" />, color: "text-zinc-400" },
  paused: { label: "Paused", icon: <Pause className="h-4 w-4" />, color: "text-zinc-500" },
};

const ACTIVE_TIERS: SprintTier[] = ["high", "ready_to_build", "validation", "operations"];
const COLLAPSED_TIERS: SprintTier[] = ["backlog", "paused"];

function repoShort(repo: string) {
  return repo.replace("daldc/", "");
}

function issueUrl(entry: SprintEntry) {
  if (!entry.repo || !entry.number) return null;
  return `https://github.com/${entry.repo}/issues/${entry.number}`;
}

export function SprintBoard({ entries, lastUpdated }: { entries: SprintEntry[]; lastUpdated: string }) {
  const [expandedCollapsed, setExpandedCollapsed] = useState<Record<string, boolean>>({});

  const activeEntries = entries.filter((e) => ACTIVE_TIERS.includes(e.tier) && e.status !== "done" && e.status !== "failed");
  const doneEntries = entries.filter((e) => e.status === "done" || e.status === "failed");
  const collapsedEntries = entries.filter((e) => COLLAPSED_TIERS.includes(e.tier) && e.status !== "done" && e.status !== "failed");

  return (
    <Card className="border-zinc-800 bg-zinc-950">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-zinc-100">
              Sprint Board
            </CardTitle>
            {lastUpdated && (
              <p className="mt-1 text-xs text-zinc-500">Sprint updated {lastUpdated}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-zinc-500">
              {activeEntries.length} active
            </span>
            {doneEntries.length > 0 && (
              <span className="font-mono text-xs text-emerald-500/70">
                {doneEntries.filter(e => e.status === "done").length} done
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Active tiers */}
        {ACTIVE_TIERS.map((tier) => {
          const items = activeEntries.filter((e) => e.tier === tier);
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
                {items.map((item) => (
                  <SprintItemRow key={item.id} item={item} />
                ))}
              </div>
            </div>
          );
        })}

        {/* Done today/yesterday */}
        {doneEntries.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3 text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <h3 className="text-sm font-medium">Recently Completed</h3>
              <span className="font-mono text-xs text-zinc-500">({doneEntries.length})</span>
            </div>
            <div className="space-y-2">
              {doneEntries.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-md border border-zinc-800/30 bg-zinc-900/30 px-3 py-2.5 opacity-70"
                >
                  {item.status === "done" ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  ) : (
                    <XCircle className="h-4 w-4 shrink-0 text-red-400" />
                  )}
                  <p className="text-sm text-zinc-400 line-through truncate">{item.title}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Collapsed tiers (backlog, paused) */}
        {COLLAPSED_TIERS.map((tier) => {
          const items = collapsedEntries.filter((e) => e.tier === tier);
          if (items.length === 0) return null;
          const config = TIER_CONFIG[tier];
          const isOpen = expandedCollapsed[tier] || false;
          return (
            <div key={tier}>
              <button
                onClick={() => setExpandedCollapsed((prev) => ({ ...prev, [tier]: !isOpen }))}
                className={`flex items-center gap-2 mb-3 ${config.color} hover:brightness-125 transition-all`}
              >
                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                {config.icon}
                <h3 className="text-sm font-medium">{config.label}</h3>
                <span className="font-mono text-xs text-zinc-500">({items.length})</span>
              </button>
              {isOpen && (
                <div className="space-y-2">
                  {items.map((item) => (
                    <SprintItemRow key={item.id} item={item} />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {entries.length === 0 && (
          <p className="text-center text-sm text-zinc-500 py-8">No sprint data found</p>
        )}
      </CardContent>
    </Card>
  );
}

function SprintItemRow({ item }: { item: SprintEntry }) {
  const url = issueUrl(item);
  const Wrapper = url ? "a" : "div";
  const linkProps = url ? { href: url, target: "_blank", rel: "noopener noreferrer" } : {};

  return (
    <Wrapper
      {...linkProps}
      className="group flex items-center gap-3 rounded-md border border-zinc-800/50 bg-zinc-900/50 px-3 py-2.5 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-zinc-200 group-hover:text-zinc-50">
          {item.title}
        </p>
        <div className="mt-1 flex items-center gap-2 flex-wrap">
          {item.repo && (
            <span className="font-mono text-xs text-zinc-500">
              {repoShort(item.repo)}#{item.number}
            </span>
          )}
          {item.tags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className={`px-1.5 py-0 text-[10px] ${
                /high\s*priority/i.test(tag) || /urgent/i.test(tag)
                  ? "border-red-800 text-red-400"
                  : /sprint/i.test(tag)
                  ? "border-blue-800 text-blue-400"
                  : /research/i.test(tag)
                  ? "border-amber-800 text-amber-400"
                  : "border-zinc-700 text-zinc-400"
              }`}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </Wrapper>
  );
}
