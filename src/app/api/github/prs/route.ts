import { NextResponse } from "next/server";
import { getOctokit, REPOS, splitRepo } from "@/lib/github";
import type { GitHubPR } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const octokit = getOctokit();

    const allPRs: GitHubPR[] = [];

    const results = await Promise.allSettled(
      REPOS.map(async (fullRepo) => {
        const { owner, repo } = splitRepo(fullRepo);
        const { data } = await octokit.pulls.list({
          owner,
          repo,
          state: "open",
          per_page: 30,
          sort: "updated",
          direction: "desc",
        });
        return data.map(
          (pr): GitHubPR => ({
            id: pr.id,
            number: pr.number,
            title: pr.title,
            repo: fullRepo,
            state: pr.state,
            draft: pr.draft || false,
            user: pr.user?.login || "unknown",
            created_at: pr.created_at,
            updated_at: pr.updated_at,
            html_url: pr.html_url,
            head: { ref: pr.head.ref },
            base: { ref: pr.base.ref },
            labels: (pr.labels || []).map((l) => ({
              name: l.name || "",
              color: l.color || "",
            })),
          })
        );
      })
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        allPRs.push(...result.value);
      }
    }

    allPRs.sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );

    return NextResponse.json({
      prs: allPRs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("GitHub PRs fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch PRs", prs: [], timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
