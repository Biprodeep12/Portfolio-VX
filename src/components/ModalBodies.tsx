"use client";

// Loaded on demand: none of this is needed until a modal opens.
import Link from "next/link";
import { ArrowUpRight, Copy, Download, ExternalLink, Linkedin, MessageSquareText } from "lucide-react";
import { BUILDING_SINCE, EXPERIENCE, FIRST_ROLE, PROFILE, PROJECTS, RESUME, SERVICES, SKILLS, type Project } from "@/data/profile";
import { BrowserFrame, Chips, hostOf } from "./ui";
import { CopyField, JsonBlock, Tabs, useToast } from "./client";
import { useConsole } from "./Shell";

export function ProjectDetail({ p }: { p: Project }) {
  const config = {
    resourceId: `prj-${p.id}`,
    name: p.name,
    type: p.type,
    status: p.status.toLowerCase(),
    owner: PROFILE.accountId,
    endpoint: p.url,
    runtime: { stack: p.stack },
    tags: { portfolio: "featured" },
  };

  return (
    <div className="p-5 sm:p-6 flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] gap-6">
        <a href={p.url} target="_blank" rel="noopener noreferrer" className="group block" aria-label={`Open ${p.name}`}>
          <BrowserFrame p={p} sizes="(max-width: 1024px) 100vw, 540px" priority />
        </a>

        <div className="flex flex-col min-w-0">
          <h2 className="text-[20px] leading-7 font-semibold tracking-tight text-fg">{p.title}</h2>
          <p className="mt-2 text-fg-2 leading-relaxed">{p.description}</p>

          <div className="mt-5 rounded-lg border border-line divide-y divide-line">
            {[
              { k: "Resource ID", v: <CopyField value={`prj-${p.id}`} /> },
              {
                k: "Endpoint",
                v: (
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="link inline-flex items-center gap-1">
                    {hostOf(p.url)} <ExternalLink className="size-3" />
                  </a>
                ),
              },
              { k: "Owner", v: <span className="mono">{PROFILE.accountId}</span> },
              { k: "Stack", v: <Chips items={p.stack} /> },
            ].map((r) => (
              <div key={r.k} className="flex items-center justify-between gap-4 px-3.5 min-h-10 py-2">
                <span className="text-muted shrink-0">{r.k}</span>
                <span className="min-w-0 flex justify-end">{r.v}</span>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-5 flex items-center gap-2 flex-wrap">
            <a href={p.url} target="_blank" rel="noopener noreferrer" className="btn-primary">
              Open live site <ArrowUpRight className="size-3.5" />
            </a>
            <Link prefetch={false} href={`/projects/${p.id}/`} className="btn">
              Full write-up
            </Link>
            <span className="text-[11.5px] text-faint hidden sm:inline">
              <kbd className="kbd">←</kbd> <kbd className="kbd">→</kbd> switch · <kbd className="kbd">esc</kbd> close
            </span>
          </div>
        </div>
      </div>

      <Tabs
        tabs={[
          { id: "topology", label: "Topology", content: <Topology p={p} /> },
          { id: "config", label: "Configuration", content: <JsonBlock data={config} filename={`${p.id}.resource.json`} /> },
        ]}
      />
    </div>
  );
}

const ROLE: Record<string, string> = {
  "Next.js": "app server",
  React: "ui",
  WebSockets: "realtime",
  AWS: "cloud",
  MongoDB: "database",
  PostgreSQL: "database",
  Redis: "cache",
};

export function Topology({ p }: { p: Project }) {
  const nodes = [{ name: "Visitor", role: "client" }, ...p.stack.map((s) => ({ name: s, role: ROLE[s] ?? "service" }))];
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-lg border border-line bg-subtle p-5 overflow-x-auto">
        <div className="flex items-center min-w-[480px]">
          {nodes.map((n, i) => (
            <div key={n.name} className="contents">
              {i > 0 && (
                <div className="relative flex-1 h-px edge min-w-6">
                  <span className="packet absolute -top-[2.5px] size-1.5 rounded-full bg-accent" style={{ animationDelay: `${i * 0.35}s` }} />
                </div>
              )}
              <div
                className={`shrink-0 rounded-md border px-3 py-2 text-center ${
                  i === 0 ? "border-dashed border-line-strong bg-transparent" : "border-line bg-panel"
                }`}
              >
                <div className="font-medium text-fg text-[12.5px] whitespace-nowrap">{n.name}</div>
                <div className="mono text-[10.5px] text-muted whitespace-nowrap">{n.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="text-[12px] text-muted">
        Request path for <span className="mono">prj-{p.id}</span>, drawn from its stack. Simplified; the real thing has more boxes.
      </p>
    </div>
  );
}

export function ResumePreview() {
  return (
    <div className="flex flex-col h-[78dvh]">
      <iframe src={`${RESUME.file}#view=FitH`} title="Resume preview" className="w-full flex-1 bg-subtle" />
      <div className="flex items-center gap-2 px-5 py-3 border-t border-line">
        <span className="text-[12px] text-muted hidden sm:inline">Preview not loading? Open it directly.</span>
        <a href={RESUME.file} target="_blank" rel="noopener noreferrer" className="btn ml-auto">
          <ExternalLink className="size-3.5" /> New tab
        </a>
        <a href={RESUME.file} download className="btn-primary">
          <Download className="size-3.5" /> Download
        </a>
      </div>
    </div>
  );
}


/* ---------------- TL;DR: the portfolio on one screen ---------------- */

const KEY_STACK = ["TypeScript", "React", "Next.js", "Node.js", "Python", "Go", "AWS", "Docker", "Linux", "PostgreSQL", "MongoDB", "Redis"];

export function Tldr() {
  const { openResume, openChat } = useConsole();
  const toast = useToast();
  const all = new Set(SKILLS.flatMap((g) => g.items));
  const stack = KEY_STACK.filter((s) => all.has(s));

  return (
    <div className="p-5 sm:p-6 flex flex-col gap-6">
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/pfp-320.webp" alt="" width={56} height={56} className="size-14 rounded-lg object-cover grayscale border border-line" />
        <div className="min-w-0">
          <div className="text-[18px] font-semibold tracking-tight text-fg">{PROFILE.name}</div>
          <div className="text-fg-2">{PROFILE.role}</div>
          <div className="text-[12px] text-muted mt-0.5">{PROFILE.location} · building since {BUILDING_SINCE.label}, professionally since {FIRST_ROLE}</div>
        </div>
      </div>

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
        <div>
          <dt className="label mb-1.5">Now</dt>
          <dd className="flex flex-col gap-1.5">
            {EXPERIENCE.map((r) => (
              <div key={r.id}>
                <span className="font-medium text-fg">{r.title}</span>
                <span className="text-muted"> · {r.company}</span>
                <div className="text-[12px] text-muted">
                  {r.period}
                  {r.metrics?.length ? ` · ${r.metrics.slice(0, 2).join(" · ")}` : ""}
                </div>
              </div>
            ))}
          </dd>
        </div>
        <div>
          <dt className="label mb-1.5">Built</dt>
          <dd className="flex flex-col gap-1.5">
            {PROJECTS.map((p) => (
              <Link prefetch={false} key={p.id} href={`/projects/${p.id}/`} className="group">
                <span className="font-medium text-fg group-hover:text-accent transition-colors">{p.name}</span>
                <span className="text-muted"> · {p.title}</span>
                <div className="text-[12px] text-muted">{p.stack.join(", ")}</div>
              </Link>
            ))}
          </dd>
        </div>
        <div>
          <dt className="label mb-1.5">Focus</dt>
          <dd className="text-fg-2">{SERVICES.map((s) => s.name).join(" · ")}</dd>
        </div>
        <div>
          <dt className="label mb-1.5">Key stack</dt>
          <dd>
            <Chips items={stack} />
          </dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-2 pt-1 border-t border-line -mx-5 sm:-mx-6 px-5 sm:px-6 pt-5">
        <button onClick={openResume} className="btn-primary">
          <Download className="size-3.5" /> Resume
        </button>
        <button
          className="btn"
          onClick={() => navigator.clipboard?.writeText(PROFILE.email).then(() => toast("Email copied"))}
        >
          <Copy className="size-3.5" /> {PROFILE.email}
        </button>
        <a href={PROFILE.linkedin} target="_blank" rel="noopener noreferrer" className="btn">
          <Linkedin className="size-3.5" /> LinkedIn
        </a>
        <button onClick={() => openChat()} className="btn">
          <MessageSquareText className="size-3.5" /> Ask the assistant
        </button>
      </div>
    </div>
  );
}
