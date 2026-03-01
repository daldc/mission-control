import { NextResponse } from "next/server";
import { getOctokit, REPOS, splitRepo } from "@/lib/github";
import type { GitHubActivity } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const octokit = getOctokit();

    const allActivity: GitHubActivity[] = [];

    const results = await Promise.allSettled(
      REPOS.map(async (fullRepo) => {
        const { owner, repo } = splitRepo(fullRepo);
        const { data } = await octokit.repos.listCommits({
          owner,
          repo,
          per_page: 10,
        });
        return data.map(
          (commit): GitHubActivity => ({
            id: commit.sha,
            repo: fullRepo,
            type: "commit",
            message: commit.commit.message.split("\n")[0],
            author: commit.commit.author?.name || commit.author?.login || "unknown",
            date: commit.commit.author?.date || "",
            url: commit.html_url,
          })
        );
      })
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        allActivity.push(...result.value);
      }
    }

    allActivity.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return NextResponse.json({
      activity: allActivity.slice(0, 30),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("GitHub activity fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity", activity: [], timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
