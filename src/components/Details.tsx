"use client";

import Image from "next/image";
import { ArrowUpRight, ChevronRight, Download, ExternalLink, Eye, FileText, LayoutGrid, List, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PROFILE, PROJECTS, RESUME, type Project } from "@/data/profile";
import { Chips, Status } from "./ui";
import { CopyButton, CopyField, JsonBlock, Tabs } from "./client";
import { useConsole } from "./Shell";

const hostOf = (url: string) => new URL(url).host;

/* ================= Modal bodies ================= */

function BrowserFrame({ p, sizes, priority }: { p: Project; sizes: string; priority?: boolean }) {
  return (
    <div className="rounded-lg border border-line overflow-hidden bg-subtle">
      <div className="flex items-center gap-1.5 h-7 px-3 border-b border-line">
        <span className="size-2 rounded-full bg-line-strong" />
        <span className="size-2 rounded-full bg-line-strong" />
        <span className="size-2 rounded-full bg-line-strong" />
        <span className="mono text-[10.5px] text-muted ml-2 truncate">{hostOf(p.url)}</span>
      </div>
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={p.image}
          alt={`${p.name} screenshot`}
          fill
          priority={priority}
          sizes={sizes}
          className="object-cover object-top transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
        />
      </div>
    </div>
  );
}

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

/* ================= Projects section ================= */

type View = "cards" | "table";

export function ProjectsView() {
  const { openProject } = useConsole();
  const [q, setQ] = useState("");
  const [stack, setStack] = useState<string | null>(null);
  const [view, setView] = useState<View>("cards");

  useEffect(() => {
    const saved = localStorage.getItem("projects-view");
    if (saved === "table" || saved === "cards") setView(saved);
  }, []);
  const changeView = (v: View) => {
    setView(v);
    try {
      localStorage.setItem("projects-view", v);
    } catch {}
  };

  const stacks = useMemo(() => {
    const counts = new Map<string, number>();
    PROJECTS.forEach((p) => p.stack.forEach((s) => counts.set(s, (counts.get(s) ?? 0) + 1)));
    return [...counts.entries()];
  }, []);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return PROJECTS.filter(
      (p) =>
        (!stack || p.stack.includes(stack)) &&
        (!s || `${p.name} ${p.title} ${p.id} ${p.description} ${p.stack.join(" ")}`.toLowerCase().includes(s)),
    );
  }, [q, stack]);

  const filtered = !!q || !!stack;
  const reset = () => {
    setQ("");
    setStack(null);
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-4">
        <div className="relative lg:w-72">
          <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
          <input
            className="input pl-8 pr-8"
            placeholder="Filter by name, stack, anything"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setQ("")}
            aria-label="Filter projects"
          />
          {q && (
            <button className="btn-icon size-6 absolute right-1 top-1/2 -translate-y-1/2" onClick={() => setQ("")} aria-label="Clear filter">
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 flex-wrap" role="group" aria-label="Filter by stack">
          {stacks.map(([s, n]) => {
            const on = stack === s;
            return (
              <button
                key={s}
                onClick={() => setStack(on ? null : s)}
                aria-pressed={on}
                className={`inline-flex items-center gap-1.5 h-7 pl-2.5 pr-2 rounded-md border text-[12px] cursor-pointer transition-all duration-200 ${
                  on ? "border-fg bg-fg text-panel" : "border-line text-fg-2 hover:bg-hover hover:border-line-strong"
                }`}
              >
                {s}
                <span className={`mono text-[10.5px] ${on ? "opacity-70" : "text-faint"}`}>{n}</span>
              </button>
            );
          })}
        </div>

        <div className="lg:ml-auto flex items-center gap-3">
          <span className="text-[12px] text-muted tabular-nums" aria-live="polite">
            {rows.length} of {PROJECTS.length}
          </span>
          <div className="relative flex h-8 p-[3px] rounded-lg border border-line bg-subtle" role="radiogroup" aria-label="View">
            <span
              className={`absolute top-[3px] bottom-[3px] w-[30px] rounded-md bg-panel border border-line shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                view === "table" ? "translate-x-[30px]" : ""
              }`}
            />
            {(
              [
                ["cards", LayoutGrid],
                ["table", List],
              ] as const
            ).map(([v, Icon]) => (
              <button
                key={v}
                role="radio"
                aria-checked={view === v}
                aria-label={`${v} view`}
                onClick={() => changeView(v)}
                className={`relative z-10 grid place-items-center w-[30px] cursor-pointer transition-colors ${view === v ? "text-fg" : "text-faint hover:text-fg-2"}`}
              >
                <Icon className="size-3.5" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      {rows.length === 0 ? (
        <div className="panel anim-in flex flex-col items-center text-center py-14 px-6">
          <span className="mono text-[11px] text-faint mb-2">0 resources</span>
          <p className="text-fg font-medium">Nothing matches {q ? <span className="mono">“{q}”</span> : "that filter"}.</p>
          <p className="text-muted mt-1">The archive on GitHub has more experiments.</p>
          <div className="mt-4 flex gap-2">
            <button className="btn" onClick={reset}>
              Clear filters
            </button>
            <a href={PROFILE.github} target="_blank" rel="noopener noreferrer" className="btn">
              Open GitHub <ArrowUpRight className="size-3.5" />
            </a>
          </div>
        </div>
      ) : view === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rows.map((p, i) => (
            <article
              key={p.id}
              className="rise lift group relative panel overflow-hidden flex flex-col hover:border-line-strong hover:shadow-[0_14px_36px_-18px_rgb(16_24_40/0.3)]"
              style={{ ["--d" as string]: `${i * 90}ms` }}
            >
              <div className="p-3 pb-0">
                <BrowserFrame p={p} sizes="(max-width: 768px) 100vw, 540px" />
              </div>
              <div className="p-4 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-[15px] tracking-tight text-fg">
                      {/* Stretched button: the whole card opens the modal */}
                      <button onClick={() => openProject(p.id)} className="cursor-pointer text-left after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
                        {p.name}
                      </button>
                    </h3>
                    <p className="text-muted">{p.title}</p>
                  </div>
                  <Status>{p.status}</Status>
                </div>
                <p className="mt-2.5 text-fg-2 leading-relaxed line-clamp-2">{p.description}</p>
                <div className="mt-3">
                  <Chips items={p.stack} />
                </div>
              </div>
              <div className="mt-auto flex items-center justify-between gap-3 border-t border-line px-4 h-11 bg-subtle/50">
                  <span className="relative z-10 inline-flex items-center gap-1 min-w-0">
                    <span className="mono text-[11.5px] text-muted truncate">prj-{p.id}</span>
                    <CopyButton value={`prj-${p.id}`} label="Resource ID copied" />
                  </span>
                  <span className="flex items-center gap-3">
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative z-10 link text-[12px] inline-flex items-center gap-1"
                    >
                      {hostOf(p.url)} <ExternalLink className="size-3" />
                    </a>
                    <span className="text-[12px] font-medium text-fg-2 inline-flex items-center gap-0.5 transition-transform duration-300 group-hover:translate-x-0.5">
                      Inspect <ChevronRight className="size-3.5" />
                    </span>
                  </span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="panel overflow-x-auto anim-in">
          <table className="tbl min-w-[680px] [&_td]:whitespace-nowrap">
            <thead>
              <tr>
                <th>Name</th>
                <th>Resource ID</th>
                <th>Status</th>
                <th>Stack</th>
                <th>Endpoint</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="cursor-pointer group" onClick={() => openProject(p.id)}>
                  <td>
                    <button className="text-left cursor-pointer" onClick={() => openProject(p.id)}>
                      <span className="block font-medium text-fg group-hover:text-accent transition-colors">{p.name}</span>
                      <span className="block text-[12px] text-muted">{p.title}</span>
                    </button>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <span className="inline-flex items-center gap-1">
                      <span className="mono text-fg-2">prj-{p.id}</span>
                      <CopyButton value={`prj-${p.id}`} label="Resource ID copied" />
                    </span>
                  </td>
                  <td>
                    <Status>{p.status}</Status>
                  </td>
                  <td>
                    <Chips items={p.stack} />
                  </td>
                  <td>
                    <a href={p.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="link inline-flex items-center gap-1">
                      {hostOf(p.url)} <ExternalLink className="size-3" />
                    </a>
                  </td>
                  <td className="text-right">
                    <ChevronRight className="size-4 text-faint group-hover:text-fg group-hover:translate-x-0.5 transition-all inline" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filtered && rows.length > 0 && (
        <button onClick={reset} className="mt-3 text-[12px] link cursor-pointer">
          Clear filters
        </button>
      )}
    </div>
  );
}

/* ================= Documents ================= */

export function DocumentsTable() {
  const { openResume } = useConsole();
  const uri = `docs://${PROFILE.handle}/${RESUME.name}`;
  return (
    <div className="panel overflow-x-auto">
      <table className="tbl min-w-[600px] [&_td]:whitespace-nowrap">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Size</th>
            <th>Object URI</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <button onClick={openResume} className="inline-flex items-center gap-2 font-medium text-fg hover:text-accent cursor-pointer transition-colors">
                <FileText className="size-4 text-muted" /> {RESUME.name}
              </button>
            </td>
            <td className="text-fg-2">PDF</td>
            <td className="text-fg-2 tabular-nums">{RESUME.sizeKb} KB</td>
            <td>
              <span className="inline-flex items-center gap-1">
                <span className="mono text-muted">{uri}</span>
                <CopyButton value={uri} label="URI copied" />
              </span>
            </td>
            <td className="text-right">
              <span className="inline-flex gap-1">
                <button onClick={openResume} className="btn h-7 px-2">
                  <Eye className="size-3.5" /> Preview
                </button>
                <a href={RESUME.file} download className="btn h-7 px-2">
                  <Download className="size-3.5" /> Download
                </a>
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function ResumeButton({ className = "btn" }: { className?: string }) {
  const { openResume } = useConsole();
  return (
    <button onClick={openResume} className={className}>
      <FileText className="size-3.5" /> Resume
    </button>
  );
}
