import { NextResponse } from "next/server";
import { getOctokit, REPOS, splitRepo } from "@/lib/github";
import type { GitHubIssue } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const octokit = getOctokit();

    const allIssues: GitHubIssue[] = [];

    const results = await Promise.allSettled(
      REPOS.map(async (fullRepo) => {
        const { owner, repo } = splitRepo(fullRepo);
        const { data } = await octokit.issues.listForRepo({
          owner,
          repo,
          state: "open",
          per_page: 50,
          sort: "updated",
          direction: "desc",
        });
        return data
          .filter((issue) => !issue.pull_request)
          .map(
            (issue): GitHubIssue => ({
              id: issue.id,
              number: issue.number,
              title: issue.title,
              state: issue.state,
              repo: fullRepo,
              labels: (issue.labels || [])
                .filter(
                  (l): l is { name: string; color: string } =>
                    typeof l === "object" && l !== null && "name" in l
                )
                .map((l) => ({ name: l.name || "", color: l.color || "" })),
              assignee: issue.assignee?.login || null,
              created_at: issue.created_at,
              updated_at: issue.updated_at,
              html_url: issue.html_url,
            })
          );
      })
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        allIssues.push(...result.value);
      }
    }

    allIssues.sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );

    return NextResponse.json({
      issues: allIssues,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("GitHub issues fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch issues", issues: [], timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
