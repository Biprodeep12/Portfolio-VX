import { SERVICES, SKILLS } from "./profile";

export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const ALIASES: Record<string, string> = {
  ts: "TypeScript",
  js: "JavaScript",
  py: "Python",
  golang: "Go",
  postgres: "PostgreSQL",
  pg: "PostgreSQL",
  mongo: "MongoDB",
  node: "Node.js",
  nodejs: "Node.js",
  next: "Next.js",
  nextjs: "Next.js",
  express: "Express.js",
  rn: "React Native",
  gh: "Github",
  github: "Github",
  "ci-cd": "CI/CD Pipelines",
  cicd: "CI/CD Pipelines",
  gcp: "AWS/GCP",
};

export type Decision =
  | { effect: "Allow"; skill: string; action: string; sid: string }
  | { effect: "ImplicitDeny"; query: string };

/** Evaluate "can this account do X?" against the stack. */
export function evaluate(raw: string): Decision {
  const q = raw.trim();
  const key = slug(q).replace(/-/g, "");
  const target = ALIASES[slug(q)] ?? ALIASES[key];
  for (const g of SKILLS) {
    for (const s of g.items) {
      if ((target && s === target) || slug(s).replace(/-/g, "") === key) {
        return { effect: "Allow", skill: s, action: `${g.prefix}:${slug(s)}`, sid: g.group.replace(/[^A-Za-z]/g, "") };
      }
    }
  }
  for (const svc of SERVICES) {
    for (const t of svc.tags) {
      if ((target && t === target) || slug(t).replace(/-/g, "") === key) {
        return { effect: "Allow", skill: t, action: `svc:${slug(t)}`, sid: svc.name.replace(/[^A-Za-z]/g, "") };
      }
    }
  }
  return { effect: "ImplicitDeny", query: q };
}
