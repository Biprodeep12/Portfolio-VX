"use client";

// Loaded on demand: none of this is needed until a modal opens.
import { ArrowUpRight, Download, ExternalLink } from "lucide-react";
import { PROFILE, RESUME, type Project } from "@/data/profile";
import { BrowserFrame, Chips, hostOf } from "./ui";
import { CopyField, JsonBlock, Tabs } from "./client";

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

function Topology({ p }: { p: Project }) {
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

