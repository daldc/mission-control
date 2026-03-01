export function repoShortName(repo: string): string {
  return repo.split("/")[1] || repo;
}

export function daysAgo(dateString: string): number {
  const diff = Date.now() - new Date(dateString).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function timeAgo(dateString: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function healthColor(health: "green" | "yellow" | "red"): string {
  switch (health) {
    case "green":  return "bg-emerald-500";
    case "yellow": return "bg-amber-500";
    case "red":    return "bg-red-500";
  }
}

export function statusColor(status: string): string {
  switch (status) {
    case "success":
    case "completed":
    case "shipped":
    case "done":
      return "bg-emerald-500";
    case "running":
    case "in_progress":
    case "building":
    case "validating":
      return "bg-blue-500";
    case "warning":
    case "timed_out":
    case "review":
    case "validated":
      return "bg-amber-500";
    case "error":
    case "failed":
      return "bg-red-500";
    case "proposed":
    case "ready":
      return "bg-zinc-500";
    default:
      return "bg-zinc-500";
  }
}
