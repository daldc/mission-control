// ── GitHub Issue ──
export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  state: string;
  repo: string;
  labels: GitHubLabel[];
  assignee: string | null;
  created_at: string;
  updated_at: string;
  html_url: string;
  pull_request?: { url: string };
}

export interface GitHubLabel {
  name: string;
  color: string;
}

// ── Pull Request ──
export interface GitHubPR {
  id: number;
  number: number;
  title: string;
  repo: string;
  state: string;
  draft: boolean;
  user: string;
  created_at: string;
  updated_at: string;
  html_url: string;
  head: { ref: string };
  base: { ref: string };
  labels: GitHubLabel[];
}

// ── Activity / Commit ──
export interface GitHubActivity {
  id: string;
  repo: string;
  type: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

// ── Sprint Board ──
export type SprintStatus = "ready" | "in_progress" | "review" | "done";
export type PriorityTier = "high" | "ready_to_build" | "validation" | "backlog";

export interface SprintItem {
  id: number;
  number: number;
  title: string;
  repo: string;
  status: SprintStatus;
  priority: PriorityTier;
  labels: GitHubLabel[];
  assignee: string | null;
  created_at: string;
  updated_at: string;
  html_url: string;
  age_days: number;
}

// ── Project Card ──
export interface ProjectCard {
  name: string;
  repo: string;
  description: string;
  open_issues: number;
  open_prs: number;
  last_activity: string;
  deploy_url: string | null;
  health: "green" | "yellow" | "red";
  paused: boolean;
}

// ── Cron Job ──
export interface CronJob {
  id: string;
  name: string;
  schedule: string;
  schedule_human: string;
  last_run: string;
  next_run: string;
  last_status: "success" | "error" | "warning";
  consecutive_errors: number;
  health: "green" | "yellow" | "red";
}

// ── Agent Activity ──
export interface AgentRun {
  id: string;
  agent_name: string;
  task: string;
  status: "running" | "completed" | "failed" | "timed_out";
  started_at: string;
  finished_at: string | null;
  duration_seconds: number | null;
  repo: string;
}

// ── Ideas Pipeline ──
export type IdeaStatus = "proposed" | "validating" | "validated" | "building" | "shipped";

export interface Idea {
  id: number;
  title: string;
  status: IdeaStatus;
  validation_score: number | null;
  labels: GitHubLabel[];
  created_at: string;
  html_url: string;
  body_preview: string;
}

// ── Dashboard Data ──
export interface DashboardData {
  issues: GitHubIssue[];
  prs: GitHubPR[];
  activity: GitHubActivity[];
  timestamp: string;
}
