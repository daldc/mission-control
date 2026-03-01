import { Octokit } from "@octokit/rest";

export const REPOS = [
  "daldc/tasks",
  "daldc/polymarket-arb",
  "daldc/trading-assistant",
  "daldc/grocerease",
  "daldc/crosslist",
  "daldc/ideas",
] as const;

export const TASK_REPOS = REPOS.filter((r) => r !== "daldc/ideas");

export function getOctokit() {
  return new Octokit({
    auth: process.env.GITHUB_TOKEN,
  });
}

export function splitRepo(full: string): { owner: string; repo: string } {
  const [owner, repo] = full.split("/");
  return { owner, repo };
}
