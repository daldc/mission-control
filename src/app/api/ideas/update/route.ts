import { NextResponse } from "next/server";
import { getOctokit, splitRepo } from "@/lib/github";

export const dynamic = "force-dynamic";

const IDEA_LABELS = [
  "idea:proposed",
  "idea:validating",
  "idea:validated",
  "idea:building",
  "idea:shipped",
  "idea:parked",
  "idea:rejected",
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { repo, issueNumber, newStatus, reason } = body as {
      repo: string;
      issueNumber: number;
      newStatus: string;
      reason?: string;
    };

    if (!repo || !issueNumber || !newStatus) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const targetLabel = `idea:${newStatus}`;
    if (!IDEA_LABELS.includes(targetLabel)) {
      return NextResponse.json({ error: `Invalid status: ${newStatus}` }, { status: 400 });
    }

    const octokit = getOctokit();
    const { owner, repo: repoName } = splitRepo(repo);

    // Get current labels
    const { data: issue } = await octokit.issues.get({
      owner,
      repo: repoName,
      issue_number: issueNumber,
    });

    const currentLabels = (issue.labels || [])
      .map((l) => (typeof l === "string" ? l : l.name || ""))
      .filter(Boolean);

    // Remove all existing idea:* labels, keep everything else
    const nonIdeaLabels = currentLabels.filter((l) => !l.startsWith("idea:"));
    const newLabels = [...nonIdeaLabels, targetLabel];

    // Update labels
    await octokit.issues.setLabels({
      owner,
      repo: repoName,
      issue_number: issueNumber,
      labels: newLabels,
    });

    // If rejected, close the issue with a comment
    if (newStatus === "rejected") {
      if (reason) {
        await octokit.issues.createComment({
          owner,
          repo: repoName,
          issue_number: issueNumber,
          body: `**Rejected:** ${reason}`,
        });
      }
      await octokit.issues.update({
        owner,
        repo: repoName,
        issue_number: issueNumber,
        state: "closed",
        state_reason: "not_planned",
      });
    }

    // If shipped, close the issue (completed)
    if (newStatus === "shipped") {
      await octokit.issues.update({
        owner,
        repo: repoName,
        issue_number: issueNumber,
        state: "closed",
        state_reason: "completed",
      });
    }

    return NextResponse.json({
      success: true,
      issueNumber,
      newStatus,
      labels: newLabels,
    });
  } catch (error) {
    console.error("Ideas update error:", error);
    return NextResponse.json(
      { error: "Failed to update idea" },
      { status: 500 }
    );
  }
}
