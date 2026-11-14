"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { EXPERIENCE, PROFILE, PROJECTS, SECTIONS, SKILLS } from "@/data/profile";
import { evaluate } from "@/data/policy";
import { BUILDING_SINCE } from "@/data/profile";
import { LIVE_PROJECTS, MILESTONES, fmtYm, monthsBetween, workShare } from "@/data/career";
import { audit, getSession, onAudit, type AuditEvent } from "./audit";
import { useConsole } from "./Shell";

type Line = { id: number; kind: "in" | "out" | "err" | "log"; body: ReactNode };

const QUICK = ["help", "traceroute", "top", "git log", "ssh strux", "can docker"];

const COMMANDS = ["help", "tldr", "ask", "git", "traceroute", "top", "ssh", "whoami", "ls", "open", "can", "cd", "theme", "contact", "logs", "uptime", "date", "history", "clear", "sudo"];

const fmtTime = (t: number) => new Date(t).toTimeString().slice(0, 8);

function LogLine({ e }: { e: AuditEvent }) {
  // One line, columns on wide screens, truncated (never wrapped) on narrow ones.
  return (
    <span className="flex gap-2 whitespace-nowrap overflow-hidden text-[#7c8491]">
      <span className="shrink-0">{fmtTime(e.t)}</span>
      <span className="text-[#8fa6c9] shrink-0 sm:w-[20ch]">{e.action}</span>
      <span className="truncate min-w-0 sm:w-[16ch] sm:flex-none">{e.target}</span>
      <span className={`shrink-0 ${e.status < 400 ? "text-[#5fd68a]" : "text-[#f2777a]"}`}>{e.status}</span>
      <span className="hidden sm:inline shrink-0">{e.ms}ms</span>
    </span>
  );
}

function WhoAmI() {
  return (
    <div>
      <div>
        <span className="text-[#f3f5f7] font-semibold">{PROFILE.name}</span>{" "}
        <span className="text-[#7c8491]">({PROFILE.accountId})</span>
      </div>
      <div className="text-[#9aa3af]">{PROFILE.role}</div>
      <div className="text-[#9aa3af]">
        region <span className="text-[#d5d9e0]">{PROFILE.location.toLowerCase()}</span> · status{" "}
        <span className="text-[#5fd68a]">active</span> · roles <span className="text-[#d5d9e0]">{EXPERIENCE.length}</span>
      </div>
    </div>
  );
}

// Rendered on the server, so the hero is complete before any JS runs.
const BOOT: Line[] = [
  { id: -2, kind: "in", body: "whoami" },
  { id: -1, kind: "out", body: <WhoAmI /> },
];

export function Terminal() {
  const { openProject, openResume, toggleTheme, theme, openChat, openTldr } = useConsole();
  const [lines, setLines] = useState<Line[]>(BOOT);
  const [input, setInput] = useState("");
  const [session, setSession] = useState<{ id: string; zone: string } | null>(null);
  const histRef = useRef<string[]>([]);
  const histIdx = useRef(-1);
  const nextId = useRef(0);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const themeRef = useRef(theme);
  themeRef.current = theme;

  const push = useCallback((kind: Line["kind"], body: ReactNode) => {
    setLines((l) => [...l.slice(-160), { id: nextId.current++, kind, body }]);
  }, []);

  // Stream the audit trail into the shell.
  useEffect(() => onAudit((e) => push("log", <LogLine e={e} />)), [push]);

  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight; // scroll the shell, never the page
  }, [lines, input]);

  const run = useCallback(
    (raw: string) => {
      const cmd = raw.trim();
      push("in", cmd);
      if (!cmd) return;
      histRef.current.push(cmd);
      histIdx.current = -1;
      const [name, ...rest] = cmd.split(/\s+/);
      const arg = rest.join(" ");
      const s = getSession();

      switch (name.toLowerCase()) {
        case "help":
          push(
            "out",
            <div className="grid grid-cols-[110px_1fr] gap-x-3">
              {[
                ["whoami", "who owns this account"],
                ["ls <what>", "projects · deployments · stack"],
                ["open <id>", "open a project panel, `open resume` or `open blueprint`"],
                ["can <skill>", "check a technology against the stack"],
                ["ask <question>", "ask the AI assistant"],
                ["tldr", "the whole portfolio on one screen"],
                ["git log", "career history, oldest last"],
                ["traceroute", "the route from first repo to now"],
                ["top", "where the work is going right now"],
                ["ssh <project>", "connect to a live project"],
                ["cd <section>", "jump to a section of the page"],
                ["contact", "how to reach me"],
                ["logs", "your session's audit trail"],
                ["theme", "switch light / dark"],
                ["clear", "clear the screen"],
              ].map(([c, d]) => (
                <div key={c} className="contents">
                  <span className="text-[#79a8ff]">{c}</span>
                  <span className="text-[#9aa3af]">{d}</span>
                </div>
              ))}
            </div>,
          );
          break;
        case "whoami":
          push(
            "out",
            <div>
              <WhoAmI />
              <div className="text-[#7c8491] mt-1">
                you are {s.id} from {s.zone}.
              </div>
            </div>,
          );
          audit("GetCallerIdentity", s.id);
          break;
        case "ls": {
          const what = (arg || "").toLowerCase();
          if (what.startsWith("proj") || what === "") {
            push(
              "out",
              <div>
                {PROJECTS.map((p) => (
                  <div key={p.id}>
                    <span className="text-[#79a8ff]">{p.id.padEnd(10, " ")}</span>
                    <span className="text-[#5fd68a]">{p.status.toLowerCase().padEnd(9, " ")}</span>
                    <span className="text-[#9aa3af]">{p.stack.join(", ")}</span>
                  </div>
                ))}
                {what === "" && <div className="text-[#7c8491]">also: ls deployments · ls stack</div>}
              </div>,
            );
          } else if (what.startsWith("dep")) {
            push(
              "out",
              <div>
                {EXPERIENCE.map((r) => (
                  <div key={r.id}>
                    <span className="text-[#79a8ff]">{r.company.padEnd(22, " ")}</span>
                    <span className="text-[#9aa3af]">{r.title}</span> <span className="text-[#7c8491]">since {r.period.split(" – ")[0]}</span>
                  </div>
                ))}
              </div>,
            );
          } else if (what.startsWith("stack") || what.startsWith("cap") || what.startsWith("skill")) {
            push(
              "out",
              <div>
                {SKILLS.map((g) => (
                  <div key={g.group}>
                    <span className="text-[#79a8ff]">{(g.prefix + ":*").padEnd(8, " ")}</span>
                    <span className="text-[#9aa3af]">{g.items.join(", ")}</span>
                  </div>
                ))}
              </div>,
            );
          } else push("err", `ls: cannot access '${arg}': no such resource type`);
          break;
        }
        case "open":
        case "describe": {
          const id = arg.toLowerCase();
          if (id === "resume" || id === "resume.pdf") {
            push("out", <span className="text-[#9aa3af]">opening Resume.pdf…</span>);
            openResume();
          } else if (PROJECTS.some((p) => p.id === id)) {
            push("out", <span className="text-[#9aa3af]">opening prj-{id}…</span>);
            openProject(id);
          } else if (id === "blueprint") {
            push("out", <span className="text-[#9aa3af]">opening /blueprint…</span>);
            window.location.assign("/blueprint/");
          } else push("err", `open: '${arg || "?"}' not found. try: ${PROJECTS.map((p) => p.id).join(", ")}, resume, blueprint`);
          break;
        }
        case "can": {
          if (!arg) {
            push("err", "usage: can <skill>   e.g. can docker");
            break;
          }
          const d = evaluate(arg);
          if (d.effect === "Allow") {
            push(
              "out",
              <span>
                <span className="text-[#5fd68a] font-semibold">allowed</span>{" "}
                <span className="text-[#9aa3af]">
                  {d.action} via statement {d.sid}
                </span>
              </span>,
            );
          } else {
            push(
              "out",
              <span>
                <span className="text-[#f0b45a] font-semibold">not listed</span>{" "}
                <span className="text-[#9aa3af]">&quot;{arg}&quot; isn&apos;t on the stack page yet. ask him; it may well be in his toolbox.</span>
              </span>,
            );
          }
          audit("SimulatePolicy", arg.slice(0, 16), d.effect === "Allow" ? 200 : 403);
          break;
        }
        case "cd": {
          const target = arg.replace(/^[~/.]+/, "").toLowerCase();
          const sec = SECTIONS.find((x) => x.id === target || x.label.toLowerCase() === target);
          if (sec) {
            document.getElementById(sec.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
            push("out", <span className="text-[#7c8491]">→ /{sec.id}</span>);
          } else if (!target) window.scrollTo({ top: 0, behavior: "smooth" });
          else push("err", `cd: ${arg}: no such section. try: ${SECTIONS.map((x) => x.id).join(" ")}`);
          break;
        }
        case "theme": {
          const want = arg.toLowerCase();
          if (!want || (want !== themeRef.current && (want === "light" || want === "dark"))) toggleTheme();
          push("out", <span className="text-[#7c8491]">theme updated</span>);
          break;
        }
        case "contact":
        case "mail":
          push(
            "out",
            <div className="text-[#9aa3af]">
              <div>
                email{"    "}
                <a className="text-[#79a8ff] underline underline-offset-2" href={`mailto:${PROFILE.email}`}>
                  {PROFILE.email}
                </a>
              </div>
              <div>
                github{"   "}
                <a className="text-[#79a8ff] underline underline-offset-2" href={PROFILE.github} target="_blank" rel="noopener noreferrer">
                  Biprodeep12
                </a>
              </div>
              <div>
                linkedin{" "}
                <a className="text-[#79a8ff] underline underline-offset-2" href={PROFILE.linkedin} target="_blank" rel="noopener noreferrer">
                  biprodeep-bose
                </a>
              </div>
            </div>,
          );
          break;
        case "logs":
          push("out", <span className="text-[#7c8491]">streaming audit events for {s.id}. they appear inline as you use the page.</span>);
          break;
        case "uptime": {
          const sec = Math.round((Date.now() - s.started) / 1000);
          push("out", <span className="text-[#9aa3af]">session up {Math.floor(sec / 60)}m {sec % 60}s, 1 user, load average: low</span>);
          break;
        }
        case "date":
          push("out", <span className="text-[#9aa3af]">{new Date().toString()}</span>);
          break;
        case "history":
          push(
            "out",
            <div className="text-[#9aa3af]">
              {histRef.current.map((h, i) => (
                <div key={i}>
                  {String(i + 1).padStart(4, " ")}  {h}
                </div>
              ))}
            </div>,
          );
          break;
        case "clear":
          setLines([]);
          break;
        case "tldr":
          push("out", <span className="text-[#9aa3af]">opening the one-screen summary…</span>);
          openTldr();
          break;
        case "ask":
          if (!arg) {
            push("err", "usage: ask <question>   e.g. ask what is strux?");
            break;
          }
          push("out", <span className="text-[#9aa3af]">handing your question to the assistant…</span>);
          openChat(arg);
          break;
        case "git": {
          if (arg.split(" ")[0] !== "log") {
            push("err", `git: '${arg || ""}' is not supported here. try: git log`);
            break;
          }
          push(
            "out",
            <div>
              {[...MILESTONES].reverse().map((m) => (
                <div key={m.ym + m.host} className="flex gap-3 whitespace-nowrap overflow-hidden">
                  <span className="text-[#f0b45a] shrink-0">{m.ym}</span>
                  <span className="text-[#79a8ff] shrink-0 hidden sm:inline">{m.type}:</span>
                  <span className="text-[#c9cfd8] truncate">{m.msg}</span>
                </div>
              ))}
            </div>,
          );
          audit("GitLog", "career");
          break;
        }
        case "traceroute": {
          const now = new Date();
          push(
            "out",
            <div>
              <div className="text-[#7c8491]">traceroute to {new URL(PROFILE.site).host}, {MILESTONES.length} hops max</div>
              {MILESTONES.map((m, i) => {
                const last = i === MILESTONES.length - 1;
                return (
                  <div key={m.ym + m.host} className="flex gap-2 whitespace-nowrap overflow-hidden">
                    <span className="text-[#7c8491] w-5 text-right shrink-0">{i + 1}</span>
                    <span className={`shrink-0 ${last ? "text-[#5fd68a]" : "text-[#79a8ff]"}`}>{m.host}</span>
                    <span className="text-[#7c8491] shrink-0">({fmtYm(m.ym)})</span>
                    <span className="text-[#f0b45a] shrink-0">{monthsBetween(BUILDING_SINCE.start, new Date(`${m.ym}-15`))} mo</span>
                    {last && <span className="text-[#5fd68a]">✓ reached</span>}
                  </div>
                );
              })}
              <div className="text-[#7c8491]">{monthsBetween(BUILDING_SINCE.start, now)} months from first commit to here.</div>
            </div>,
          );
          audit("Traceroute", "biprodeep");
          break;
        }
        case "top": {
          const up = monthsBetween(BUILDING_SINCE.start, new Date());
          push(
            "out",
            <div>
              <div className="text-[#7c8491]">
                top - up {Math.floor(up / 12)}y {up % 12}m, {EXPERIENCE.length} roles, load: steady
              </div>
              <div className="text-[#d5d9e0] font-semibold whitespace-pre">
                {"PROCESS".padEnd(22, " ")}
                {"SHARE".padEnd(7, " ")}STATUS
              </div>
              {workShare().map((w) => (
                <div key={w.name} className="whitespace-pre overflow-hidden">
                  <span className="text-[#79a8ff]">{w.name.padEnd(22, " ")}</span>
                  <span className="text-[#f0b45a]">{`${w.share}%`.padEnd(7, " ")}</span>
                  <span className="text-[#5fd68a]">running</span>
                  <span className="text-[#7c8491]"> · {w.prs} merged PRs</span>
                </div>
              ))}
              {LIVE_PROJECTS.map((p) => (
                <div key={p.id} className="whitespace-pre overflow-hidden">
                  <span className="text-[#79a8ff]">{p.id.padEnd(22, " ")}</span>
                  <span className="text-[#7c8491]">{"-".padEnd(7, " ")}</span>
                  <span className="text-[#5fd68a]">live</span>
                  <span className="text-[#7c8491]"> · {new URL(p.url).host}</span>
                </div>
              ))}
              <div className="text-[#7c8491] mt-1">SHARE = share of merged PRs across current roles.</div>
            </div>,
          );
          audit("DescribeProcesses", "top");
          break;
        }
        case "ssh": {
          const id = arg.replace(/^.*@/, "").toLowerCase();
          const p = PROJECTS.find((x) => x.id === id || new URL(x.url).host === id);
          if (!p) {
            push("err", `ssh: Could not resolve hostname ${arg || "?"}. try: ${PROJECTS.map((x) => x.id).join(", ")}`);
            break;
          }
          const host = new URL(p.url).host;
          push(
            "out",
            <div>
              <div className="text-[#7c8491]">Connecting to {host}:443 ...</div>
              <div className="text-[#5fd68a]">Connection established.</div>
              <div className="text-[#c9cfd8]">
                Welcome to {p.name}: {p.title}. Opening it in a new tab.
              </div>
            </div>,
          );
          window.open(p.url, "_blank", "noopener,noreferrer");
          audit("StartSession", p.id);
          break;
        }
        case "sudo":
          push("err", `${s.id} is not in the sudoers file. This incident will be reported.`);
          audit("AssumeRole", "root", 403);
          break;
        case "exit":
          push("out", <span className="text-[#7c8491]">there is no exit. only deploys.</span>);
          break;
        default:
          push("err", `${name}: command not found. try 'help'`);
      }
    },
    [push, openProject, openResume, toggleTheme, openChat, openTldr],
  );

  // After hydration: attach this visitor's session to the pre-rendered whoami.
  useEffect(() => {
    const s = getSession();
    setSession({ id: s.id, zone: s.zone });
    push(
      "out",
      <div className="text-[#7c8491]">
        you are {s.id} from {s.zone}. type <span className="text-[#79a8ff]">help</span> to look around.
      </div>,
    );
    audit("GetCallerIdentity", s.id);
  }, [push]);

  const complete = () => {
    const parts = input.split(" ");
    if (parts.length === 1) {
      const m = COMMANDS.filter((c) => c.startsWith(parts[0]));
      if (m.length === 1) setInput(m[0] + " ");
      else if (m.length > 1) push("out", <span className="text-[#7c8491]">{m.join("  ")}</span>);
      return;
    }
    const pool =
      parts[0] === "ssh"
        ? PROJECTS.map((p) => p.id)
        : parts[0] === "git"
          ? ["log"]
          : parts[0] === "open"
        ? [...PROJECTS.map((p) => p.id), "resume"]
        : parts[0] === "cd"
          ? SECTIONS.map((x) => x.id)
          : parts[0] === "ls"
            ? ["projects", "deployments", "stack"]
            : [];
    const m = pool.filter((c) => c.startsWith(parts[1] ?? ""));
    if (m.length === 1) setInput(`${parts[0]} ${m[0]}`);
    else if (m.length > 1) push("out", <span className="text-[#7c8491]">{m.join("  ")}</span>);
  };

  const prompt = (
    <span className="shrink-0">
      <span className="text-[#5fd68a]">{session?.id ?? "guest"}</span>
      <span className="text-[#7c8491]">@bb</span>
      <span className="text-[#79a8ff]">:~$</span>
    </span>
  );

  return (
    <div
      className="term rounded-lg overflow-hidden border border-black/10 dark:border-white/10 bg-[#0f1114] text-[#d5d9e0] shadow-[0_24px_48px_-24px_rgb(0_0_0/0.45)]"
      onClick={() => inputRef.current?.focus({ preventScroll: true })}
    >
      <div className="flex items-center h-9 px-3 border-b border-white/[0.07] text-[11.5px] font-mono">
        <span className="text-[#d5d9e0]">cloudshell</span>
        <span className="mx-2 text-[#3a404a]">|</span>
        <span className="text-[#7c8491] truncate">{session ? `${session.id} · ${session.zone}` : "connecting…"}</span>
        <span className="ml-auto flex items-center gap-1.5 text-[#7c8491]">
          <span className="size-1.5 rounded-full bg-[#5fd68a]" /> connected
        </span>
      </div>
      <div ref={bodyRef} className="h-[240px] sm:h-[300px] overflow-y-auto px-3.5 py-3 font-mono text-[12px] sm:text-[12.5px] leading-[1.6]">
        <div className="text-[#7c8491] mb-2">
          Biprodeep Console shell. Session is local to your browser; nothing is sent anywhere.
        </div>
        {lines.map((l) => (
          <div key={l.id} className={`whitespace-pre-wrap break-words ${l.kind === "err" ? "text-[#f2777a]" : ""}`}>
            {l.kind === "in" ? (
              <span className="flex gap-2">
                {prompt}
                <span>{l.body}</span>
              </span>
            ) : (
              l.body
            )}
          </div>
        ))}
        <label className="flex gap-2 items-center">
          {prompt}
          <span className="relative flex-1 min-w-0">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  run(input);
                  setInput("");
                } else if (e.key === "Tab") {
                  e.preventDefault();
                  complete();
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  const h = histRef.current;
                  if (!h.length) return;
                  histIdx.current = histIdx.current < 0 ? h.length - 1 : Math.max(0, histIdx.current - 1);
                  setInput(h[histIdx.current]);
                } else if (e.key === "ArrowDown") {
                  e.preventDefault();
                  const h = histRef.current;
                  if (histIdx.current < 0) return;
                  histIdx.current = histIdx.current + 1;
                  if (histIdx.current >= h.length) {
                    histIdx.current = -1;
                    setInput("");
                  } else setInput(h[histIdx.current]);
                } else if (e.key === "l" && e.ctrlKey) {
                  e.preventDefault();
                  setLines([]);
                }
              }}
              aria-label="Shell input"
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
              className="w-full bg-transparent outline-none caret-[#5fd68a] text-[#f3f5f7] text-[16px] sm:text-[12.5px]"
            />
          </span>
        </label>
      </div>
      <div className="flex items-center gap-1.5 px-3.5 py-2 border-t border-white/[0.07] overflow-x-auto">
        <span className="mono text-[11px] text-[#7c8491] shrink-0 mr-1">try</span>
        {QUICK.map((c) => (
          <button
            key={c}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              run(c);
              inputRef.current?.focus({ preventScroll: true });
            }}
            className="mono text-[11.5px] h-6 px-2 shrink-0 rounded-md border border-white/10 text-[#c9cfd8] hover:bg-white/[0.06] hover:border-white/20 transition-colors cursor-pointer"
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
