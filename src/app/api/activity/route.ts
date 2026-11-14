import { PROFILE } from "@/data/profile";

// Feed for the header's notifications bell: real events only (notes
// published, this deploy, recent GitHub pushes). Cached for an hour so
// visitors never trigger GitHub calls themselves.

export const revalidate = 3600;

export type ActivityEvent = { id: string; kind: "note" | "push" | "deploy"; title: string; detail?: string; href: string; at: string };

const BUILT_AT = process.env.BUILD_TIME || new Date().toISOString();
const SHA = process.env.BUILD_SHA || "";
const USER = new URL(PROFILE.github).pathname.replace(/\//g, "");

type Repo = { name: string; description: string | null; html_url: string; pushed_at: string; fork: boolean; archived: boolean };

async function recentPushes(): Promise<ActivityEvent[]> {
  try {
    const res = await fetch(`https://api.github.com/users/${USER}/repos?sort=pushed&per_page=10`, {
      headers: {
        Accept: "application/vnd.github+json",
        ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
      },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const repos = (await res.json()) as Repo[];
    return repos
      .filter((r) => !r.fork && !r.archived && r.description?.trim())
      .slice(0, 3)
      .map((r) => ({
        id: `push-${r.name}-${r.pushed_at}`,
        kind: "push" as const,
        title: `Pushed to ${r.name}`,
        detail: r.description ?? undefined,
        href: r.html_url,
        at: r.pushed_at,
      }));
  } catch {
    return [];
  }
}

export async function GET() {
  const deploy: ActivityEvent = {
    id: `deploy-${BUILT_AT.slice(0, 10)}`,
    kind: "deploy",
    title: "This console was redeployed",
    detail: SHA ? `Commit ${SHA} is live` : "Latest version is live",
    href: SHA ? `https://github.com/${USER}/Portfolio-VX/commit/${SHA}` : "/",
    at: BUILT_AT,
  };
  const events = [deploy, ...(await recentPushes())].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8);
  return Response.json({ events });
}
