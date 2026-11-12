import { ArrowUpRight, Star } from "lucide-react";
import { PROFILE } from "@/data/profile";

// Server component: fetched at build time and refreshed daily (ISR), so it
// costs visitors nothing. Renders nothing if GitHub is unreachable.

type Repo = {
  name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  pushed_at: string;
  fork: boolean;
  archived: boolean;
};

const USER = new URL(PROFILE.github).pathname.replace(/\//g, "");

async function gh<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`https://api.github.com${path}`, {
      headers: {
        Accept: "application/vnd.github+json",
        ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
      },
      next: { revalidate: 86400 },
    });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

function ago(iso: string, now: number) {
  const days = Math.max(0, Math.round((now - new Date(iso).getTime()) / 86_400_000));
  if (days < 1) return "today";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.round(days / 30)}mo ago`;
  return `${Math.round(days / 365)}y ago`;
}

export async function GitHubActivity() {
  const [user, repos] = await Promise.all([
    gh<{ public_repos: number; followers: number }>(`/users/${USER}`),
    gh<Repo[]>(`/users/${USER}/repos?sort=pushed&per_page=30`),
  ]);
  if (!user || !repos) return null;

  // Most recently pushed first, but skip undescribed repos: they read as noise.
  const recent = repos.filter((r) => !r.fork && !r.archived && r.description?.trim()).slice(0, 6);
  if (!recent.length) return null;
  const now = Date.now();

  return (
    <div className="mt-8 panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 px-5 py-3 min-h-12 border-b border-line">
        <span className="font-semibold text-fg">Recently pushed on GitHub</span>
        <span className="mono text-[11.5px] text-muted">
          {user.public_repos} public repos · {user.followers} followers
        </span>
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-line">
        {recent.map((r) => (
          <li key={r.name} className={`bg-panel ${recent.indexOf(r) >= 3 ? "max-sm:hidden" : ""}`}>
            <a href={r.html_url} target="_blank" rel="noopener noreferrer" className="group flex flex-col gap-1.5 p-5 h-full hover:bg-hover transition-colors">
              <span className="flex items-center gap-1.5 font-medium text-fg min-w-0">
                <span className="truncate group-hover:text-accent transition-colors">{r.name}</span>
                <ArrowUpRight className="size-3.5 text-faint shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </span>
              <span className="text-[12.5px] text-muted line-clamp-2 min-h-[2.5em]">{r.description}</span>
              <span className="mt-1 flex items-center gap-3 mono text-[11px] text-muted">
                {r.language && <span>{r.language}</span>}
                {r.stargazers_count > 0 && (
                  <span className="inline-flex items-center gap-0.5">
                    <Star className="size-3" /> {r.stargazers_count}
                  </span>
                )}
                <span className="ml-auto">{ago(r.pushed_at, now)}</span>
              </span>
            </a>
          </li>
        ))}
        {/* Keep the divider grid whole when there are fewer than 6 repos. */}
        {Array.from({ length: 6 - recent.length }, (_, i) => (
          <li key={`pad${i}`} className="bg-panel max-sm:hidden" aria-hidden />
        ))}
      </ul>
    </div>
  );
}
