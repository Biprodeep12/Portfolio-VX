"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Boxes, CornerDownLeft, ExternalLink, FileText, Github, Hash, Mail, Moon, Search, type LucideIcon } from "lucide-react";
import { PROFILE, PROJECTS, SECTIONS } from "@/data/profile";
import { useToast } from "./client";
import { useConsole } from "./Shell";

/* ---------------- Command palette ---------------- */

type Cmd = { id: string; label: string; hint: string; icon: LucideIcon; run: () => void };

export default function CommandPalette({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const { openProject, openResume, toggleTheme, openChat, openTldr } = useConsole();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const commands = useMemo<Cmd[]>(() => {
    const jump = (id: string) => () => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      else window.location.assign(`/#${id}`);
    };
    const open = (href: string) => () => window.open(href, "_blank", "noopener,noreferrer");
    return [
      { id: "top", label: "Overview", hint: "Section", icon: Hash, run: () => window.scrollTo({ top: 0, behavior: "smooth" }) },
      ...SECTIONS.map((s) => ({ id: s.id, label: s.label, hint: "Section", icon: Hash, run: jump(s.id) })),
      ...PROJECTS.map((p) => ({
        id: p.id,
        label: `${p.name} — ${p.title}`,
        hint: "Project",
        icon: Boxes,
        run: () => openProject(p.id),
      })),
      { id: "tldr", label: "TL;DR: one-screen summary", hint: "Action", icon: FileText, run: openTldr },
      { id: "blueprint", label: "Blueprint: learn system design", hint: "Page", icon: Boxes, run: () => window.location.assign("/blueprint/") },
      { id: "assistant", label: "Ask the AI assistant", hint: "Action", icon: Hash, run: () => openChat() },
      { id: "resume", label: "Preview resume", hint: "Document", icon: FileText, run: openResume },
      { id: "theme", label: "Toggle light / dark theme", hint: "Action", icon: Moon, run: toggleTheme },
      {
        id: "copy-email",
        label: "Copy email address",
        hint: "Action",
        icon: Mail,
        run: () => {
          navigator.clipboard?.writeText(PROFILE.email).then(() => toast("Email copied"));
        },
      },
      { id: "gh", label: "Open GitHub", hint: "External", icon: Github, run: open(PROFILE.github) },
      { id: "li", label: "Open LinkedIn", hint: "External", icon: ExternalLink, run: open(PROFILE.linkedin) },
    ];
  }, [openProject, openResume, toggleTheme, openChat, openTldr, toast]);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? commands.filter((c) => `${c.label} ${c.hint}`.toLowerCase().includes(s)) : commands;
  }, [q, commands]);

  useEffect(() => setSel(0), [q]);
  useEffect(() => {
    listRef.current?.querySelector(`[data-i="${sel}"]`)?.scrollIntoView({ block: "nearest" });
  }, [sel]);

  const exec = (c?: Cmd) => {
    if (!c) return;
    onClose();
    c.run();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[14vh] px-4" role="dialog" aria-modal="true" aria-label="Command palette">
      <div className="absolute inset-0 bg-black/40 fade" onClick={onClose} />
      <div className="anim-in relative w-full max-w-xl panel shadow-2xl shadow-black/20 overflow-hidden">
        <div className="flex items-center gap-2 px-3.5 h-12 border-b border-line">
          <Search className="size-4 text-muted" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setSel((s) => Math.min(s + 1, results.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSel((s) => Math.max(s - 1, 0));
              } else if (e.key === "Enter") {
                exec(results[sel]);
              } else if (e.key === "Escape") {
                onClose();
              }
            }}
            placeholder="Jump to a section, project or action…"
            className="flex-1 bg-transparent outline-none text-[14px] text-fg placeholder:text-faint"
          />
          <kbd className="kbd">esc</kbd>
        </div>
        <ul ref={listRef} className="max-h-80 overflow-y-auto p-1.5">
          {results.length === 0 && <li className="px-3 py-6 text-center text-muted">No results for “{q}”</li>}
          {results.map((c, i) => {
            const Icon = c.icon;
            return (
              <li key={c.id}>
                <button
                  data-i={i}
                  onMouseMove={() => setSel(i)}
                  onClick={() => exec(c)}
                  className={`w-full flex items-center gap-2.5 h-9 px-2.5 rounded-md text-left cursor-pointer ${
                    i === sel ? "bg-hover text-fg" : "text-fg-2"
                  }`}
                >
                  <Icon className="size-4 text-muted shrink-0" />
                  <span className="flex-1 truncate">{c.label}</span>
                  <span className="text-[11px] text-faint">{c.hint}</span>
                  {i === sel && <CornerDownLeft className="size-3.5 text-muted" />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

