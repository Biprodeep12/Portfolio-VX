// Career milestones, all dated from real sources: GitHub repo creation dates,
// first commits, and role start dates. Used by the shell's `git log`,
// `traceroute` and `top` commands.

import { EXPERIENCE, PROJECTS } from "./profile";

export type Milestone = { ym: string; host: string; msg: string; type: "feat" | "deploy" | "role" | "ship" };

export const MILESTONES: Milestone[] = [
  { ym: "2024-08", host: "first-repo", msg: "first public project: Very-Simple-Calculator (first JavaScript project)", type: "feat" },
  { ym: "2024-10", host: "vercel", msg: "first apps deployed to Vercel: Pokedex, Voice-Controlled-App", type: "deploy" },
  { ym: "2024-12", host: "typescript", msg: "first TypeScript project", type: "feat" },
  { ym: "2025-04", host: "saffronstays", msg: "join SaffronStays as Software Development Engineer Intern", type: "role" },
  { ym: "2025-09", host: "mapgeox", msg: "launch MapGeox: live bus tracking, routing and QR tickets", type: "ship" },
  { ym: "2025-12", host: "coding-on-the-rocks", msg: "join Coding On The Rocks as Full-Stack Developer", type: "role" },
  { ym: "2026-01", host: "strux", msg: "start STRUX: AWS control plane (102 commits by Apr 2026)", type: "ship" },
  { ym: "2026-11", host: "biprodeep.me", msg: "ship Portfolio VX: this console", type: "ship" },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const fmtYm = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
};
export const monthsBetween = (fromYm: string, to: Date) => {
  const [y, m] = fromYm.split("-").map(Number);
  return (to.getFullYear() - y) * 12 + (to.getMonth() + 1 - m);
};

/** Share of merged PRs per current role: a real proxy for where time goes. */
export function workShare() {
  const total = EXPERIENCE.reduce((n, r) => n + (r.mergedPRs ?? 0), 0) || 1;
  return EXPERIENCE.map((r) => ({
    name: r.company.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    title: r.title,
    prs: r.mergedPRs ?? 0,
    share: Math.round(((r.mergedPRs ?? 0) / total) * 100),
  })).sort((a, b) => b.prs - a.prs);
}

export const LIVE_PROJECTS = PROJECTS.filter((p) => p.status === "Running");
