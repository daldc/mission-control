import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { resolve } from "path";

export const dynamic = "force-dynamic";

interface SprintEntry {
  id: string;          // e.g. "tasks#49"
  repo: string;        // e.g. "daldc/tasks"
  number: number;      // e.g. 49
  title: string;
  tags: string[];      // e.g. ["HIGH PRIORITY", "SPRINT"]
  tier: "high" | "ready_to_build" | "validation" | "operations" | "backlog" | "paused";
  status: "done" | "failed" | "in_progress" | "ready";
  section: string;     // raw section name from sprint.md
}

function parseSprintFile(content: string): { entries: SprintEntry[]; raw: string; lastUpdated: string } {
  const lines = content.split("\n");
  let lastUpdated = "";
  const entries: SprintEntry[] = [];

  // Extract last updated
  const updatedMatch = content.match(/_Last updated:\s*(.+?)_/);
  if (updatedMatch) lastUpdated = updatedMatch[1].trim();

  let currentSection = "";
  let currentTier: SprintEntry["tier"] = "backlog";

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect section headers
    if (trimmed.startsWith("### ")) {
      currentSection = trimmed.replace(/^###\s*/, "");
      if (/ready to build/i.test(currentSection)) currentTier = "ready_to_build";
      else if (/validation|research/i.test(currentSection)) currentTier = "validation";
      else if (/operations/i.test(currentSection)) currentTier = "operations";
      else if (/backlog/i.test(currentSection)) currentTier = "backlog";
      else if (/paused/i.test(currentSection)) currentTier = "paused";
      else if (/done/i.test(currentSection)) currentTier = "backlog"; // done items handled separately
      continue;
    }

    // Parse numbered items or bullet items with issue refs
    // Patterns: "1. **tasks#49**: Title [TAG]" or "- **crosslist#5**: Title" or "✅ Title" or "❌ Title"
    const numberedMatch = trimmed.match(/^\d+\.\s+\*\*([a-zA-Z0-9_-]+)#(\d+)\*\*:\s*(.+)$/);
    const bulletMatch = trimmed.match(/^-\s+\*\*([a-zA-Z0-9_-]+)#(\d+)\*\*:\s*(.+)$/);
    const doneMatch = trimmed.match(/^[✅❌]\s+(.+?)(?:\s+—\s+(.+))?$/);

    if (numberedMatch || bulletMatch) {
      const m = numberedMatch || bulletMatch;
      if (!m) continue;
      const repoShort = m[1];
      const number = parseInt(m[2], 10);
      const rest = m[3];

      // Extract tags in brackets
      const tagMatches = rest.match(/\[([^\]]+)\]/g) || [];
      const tags = tagMatches.map((t) => t.replace(/[[\]]/g, "").trim());
      const title = rest.replace(/\[([^\]]+)\]/g, "").replace(/\s*—\s*.*$/, "").trim();

      // Determine tier from tags
      let tier: SprintEntry["tier"] = currentTier;
      if (tags.some((t) => /high\s*priority/i.test(t) || /urgent/i.test(t))) tier = "high";

      // Map repo short names
      const repoMap: Record<string, string> = {
        tasks: "daldc/tasks",
        "polymarket-arb": "daldc/polymarket-arb",
        "trading-assistant": "daldc/trading-assistant",
        grocerease: "daldc/grocerease",
        crosslist: "daldc/crosslist",
        ideas: "daldc/ideas",
      };

      entries.push({
        id: `${repoShort}#${number}`,
        repo: repoMap[repoShort] || `daldc/${repoShort}`,
        number,
        title,
        tags,
        tier,
        status: "ready",
        section: currentSection,
      });
    } else if (doneMatch && /done/i.test(currentSection)) {
      const title = doneMatch[1].trim();
      const status = trimmed.startsWith("✅") ? "done" : "failed";
      entries.push({
        id: `done-${entries.length}`,
        repo: "",
        number: 0,
        title,
        tags: [],
        tier: "backlog",
        status,
        section: currentSection,
      });
    }
  }

  return { entries, raw: content, lastUpdated };
}

export async function GET() {
  try {
    const sprintPath = resolve(
      process.env.SPRINT_PATH || `${process.env.HOME}/.openclaw/workspace/memory/sprint.md`
    );
    const content = readFileSync(sprintPath, "utf-8");
    const parsed = parseSprintFile(content);

    return NextResponse.json({
      entries: parsed.entries,
      lastUpdated: parsed.lastUpdated,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Failed to read sprint file:", err);
    return NextResponse.json(
      { entries: [], lastUpdated: "", error: "Sprint file not found" },
      { status: 200 }
    );
  }
}
