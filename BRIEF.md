# Mission Control — Build Brief

## What
A single-page dashboard ("Mission Control") that gives a real-time overview of all projects, sprint status, automations, and agent activity. Next.js 15 + Tailwind + shadcn/ui, deployed on Vercel.

## Design
- Dark mode by default (sleek, war-room aesthetic)
- Responsive but desktop-first
- Clean card-based layout with status indicators
- No trading widget — that lives in a separate app

## Sections (in order of prominence)

### 1. Sprint Board (hero section)
- Current priority queue pulled from GitHub issues across repos: daldc/tasks, daldc/polymarket-arb, daldc/trading-assistant, daldc/grocerease, daldc/crosslist
- Status indicators: Ready → In Progress → Review → Done
- Phase plan for today (Phase 1/2/3 with completion markers)
- Carryover warnings, stale item flags (7+ days, 14+ days)
- Group by priority tier: High Priority, Ready to Build, Validation/Research, Backlog

### 2. Kanban View
- Columns: Backlog | Ready | In Progress | Review | Done
- Cards show: title, repo, labels, age, assignee
- Read-only for MVP (no drag-and-drop yet)
- Filter by repo/project

### 3. Project Cards
- One card per project: GrocerEase, Polymarket Arb, Trading Assistant, Mission Control, CrossList (paused)
- Each shows: open issue count, last commit/activity date, deployment URL (if deployed), health indicator (green/yellow/red based on staleness)
- Links to repo and live app

### 4. Cron & Automation Health
- List all cron jobs with status lights (green = healthy, yellow = 1 error, red = 2+ consecutive errors)
- Show: name, schedule (human readable), last run, next run, last status
- Highlight any currently errored jobs

### 5. Agent Activity Feed
- Recent sub-agent runs (last 24h)
- Status: running, completed, failed, timed out
- What task they were working on
- Duration

### 6. Ideas Pipeline
- Ideas from daldc/ideas repo
- Show validation scores if available
- Status: proposed → validating → validated → building → shipped

## Data Architecture

### API Routes (Next.js /api/)
All data fetched server-side via API routes:

- `GET /api/github/issues` — Fetch open issues across all repos using GitHub API (use GITHUB_TOKEN env var)
- `GET /api/github/prs` — Open PRs with CI status
- `GET /api/github/activity` — Recent commits/activity per repo
- `GET /api/cron/status` — Read cron status (we'll add this endpoint later, mock it for now with sample data)
- `GET /api/agents/activity` — Recent agent runs (mock for now)

### GitHub API
Use the GitHub REST API (via octokit or fetch) with a personal access token.
Repos to query:
- daldc/tasks
- daldc/polymarket-arb  
- daldc/trading-assistant
- daldc/grocerease
- daldc/crosslist
- daldc/ideas

### Environment Variables
- `GITHUB_TOKEN` — GitHub personal access token (for API calls)
- `NEXT_PUBLIC_REFRESH_INTERVAL` — Auto-refresh interval in ms (default 60000)

## Tech Stack
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Vercel for deployment

## MVP Scope
- All 6 sections above, but cron and agent activity use realistic mock data
- GitHub data is live
- Auto-refresh every 60s
- No authentication needed (public dashboard for now)
- No server actions or mutations — read-only

## NOT in scope
- Trading widget (separate app handles this)
- Drag-and-drop kanban
- Action buttons (close issues, retry crons)
- Authentication/authorization
- Mobile-optimized layout (responsive but desktop-first)
