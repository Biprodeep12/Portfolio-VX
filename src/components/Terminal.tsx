"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { EXPERIENCE, PROFILE, PROJECTS, SECTIONS, SKILLS } from "@/data/profile";
import { evaluate } from "@/data/policy";
import { audit, getSession, onAudit, type AuditEvent } from "./audit";
import { useConsole } from "./Shell";

type Line = { id: number; kind: "in" | "out" | "err" | "log"; body: ReactNode };

const COMMANDS = ["help", "whoami", "ls", "open", "can", "cd", "theme", "contact", "logs", "uptime", "date", "history", "clear", "sudo"];

const fmtTime = (t: number) => new Date(t).toTimeString().slice(0, 8);

function LogLine({ e }: { e: AuditEvent }) {
  return (
    <span className="text-[#6b7380]">
      {fmtTime(e.t)} <span className="text-[#8fa6c9]">{e.action.padEnd(20, " ")}</span> {e.target.padEnd(16, " ")}{" "}
      <span className={e.status < 400 ? "text-[#5fd68a]" : "text-[#f2777a]"}>{e.status}</span> {e.ms}ms
    </span>
  );
}

export function Terminal() {
  const { openProject, openResume, toggleTheme, theme } = useConsole();
  const [lines, setLines] = useState<Line[]>([]);
  const [input, setInput] = useState("");
  const [session, setSession] = useState<{ id: string; zone: string } | null>(null);
  const [typing, setTyping] = useState(true);
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
                ["ls <what>", "projects · deployments · capabilities"],
                ["open <id>", "open a project panel, or `open resume`"],
                ["can <skill>", "simulate the capabilities policy"],
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
              <div>
                <span className="text-[#f3f5f7] font-semibold">{PROFILE.name}</span>{" "}
                <span className="text-[#6b7380]">({PROFILE.accountId})</span>
              </div>
              <div className="text-[#9aa3af]">{PROFILE.role}</div>
              <div className="text-[#9aa3af]">
                region <span className="text-[#d5d9e0]">{PROFILE.location.toLowerCase()}</span> · status{" "}
                <span className="text-[#5fd68a]">active</span> · roles{" "}
                <span className="text-[#d5d9e0]">{EXPERIENCE.length}</span>
              </div>
              <div className="text-[#6b7380] mt-1">
                you are {s.id} from {s.zone}. type <span className="text-[#79a8ff]">help</span> to look around.
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
                {what === "" && <div className="text-[#6b7380]">also: ls deployments · ls capabilities</div>}
              </div>,
            );
          } else if (what.startsWith("dep")) {
            push(
              "out",
              <div>
                {EXPERIENCE.map((r) => (
                  <div key={r.id}>
                    <span className="text-[#79a8ff]">{r.company.padEnd(22, " ")}</span>
                    <span className="text-[#9aa3af]">{r.title}</span> <span className="text-[#6b7380]">since {r.period.split(" – ")[0]}</span>
                  </div>
                ))}
              </div>,
            );
          } else if (what.startsWith("cap") || what.startsWith("skill")) {
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
          } else push("err", `open: '${arg || "?"}' not found. try: ${PROJECTS.map((p) => p.id).join(", ")}, resume`);
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
                <span className="text-[#f0b45a] font-semibold">implicit deny</span>{" "}
                <span className="text-[#9aa3af]">&quot;{arg}&quot; isn&apos;t in the policy yet. it might be by next quarter.</span>
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
            push("out", <span className="text-[#6b7380]">→ /{sec.id}</span>);
          } else if (!target) window.scrollTo({ top: 0, behavior: "smooth" });
          else push("err", `cd: ${arg}: no such section. try: ${SECTIONS.map((x) => x.id).join(" ")}`);
          break;
        }
        case "theme": {
          const want = arg.toLowerCase();
          if (!want || (want !== themeRef.current && (want === "light" || want === "dark"))) toggleTheme();
          push("out", <span className="text-[#6b7380]">theme updated</span>);
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
          push("out", <span className="text-[#6b7380]">streaming audit events for {s.id}. they appear inline as you use the page.</span>);
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
        case "sudo":
          push("err", `${s.id} is not in the sudoers file. This incident will be reported.`);
          audit("AssumeRole", "root", 403);
          break;
        case "exit":
          push("out", <span className="text-[#6b7380]">there is no exit. only deploys.</span>);
          break;
        default:
          push("err", `${name}: command not found. try 'help'`);
      }
    },
    [push, openProject, openResume, toggleTheme],
  );

  // Boot: type `whoami` once so the shell explains itself.
  useEffect(() => {
    const s = getSession();
    setSession({ id: s.id, zone: s.zone });
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      run("whoami");
      setTyping(false);
      return;
    }
    const word = "whoami";
    let i = 0;
    let timer = window.setTimeout(function tick() {
      i++;
      setInput(word.slice(0, i));
      if (i < word.length) timer = window.setTimeout(tick, 70 + Math.random() * 60);
      else
        timer = window.setTimeout(() => {
          setInput("");
          run(word);
          setTyping(false);
        }, 260);
    }, 700);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const complete = () => {
    const parts = input.split(" ");
    if (parts.length === 1) {
      const m = COMMANDS.filter((c) => c.startsWith(parts[0]));
      if (m.length === 1) setInput(m[0] + " ");
      else if (m.length > 1) push("out", <span className="text-[#6b7380]">{m.join("  ")}</span>);
      return;
    }
    const pool =
      parts[0] === "open"
        ? [...PROJECTS.map((p) => p.id), "resume"]
        : parts[0] === "cd"
          ? SECTIONS.map((x) => x.id)
          : parts[0] === "ls"
            ? ["projects", "deployments", "capabilities"]
            : [];
    const m = pool.filter((c) => c.startsWith(parts[1] ?? ""));
    if (m.length === 1) setInput(`${parts[0]} ${m[0]}`);
    else if (m.length > 1) push("out", <span className="text-[#6b7380]">{m.join("  ")}</span>);
  };

  const prompt = (
    <span className="shrink-0">
      <span className="text-[#5fd68a]">{session?.id ?? "guest"}</span>
      <span className="text-[#6b7380]">@bb</span>
      <span className="text-[#79a8ff]">:~$</span>
    </span>
  );

  return (
    <div
      className="term rounded-lg overflow-hidden border border-black/10 dark:border-white/10 bg-[#0f1114] text-[#d5d9e0] shadow-[0_24px_48px_-24px_rgb(0_0_0/0.45)]"
      onClick={() => !typing && inputRef.current?.focus({ preventScroll: true })}
    >
      <div className="flex items-center h-9 px-3 border-b border-white/[0.07] text-[11.5px] font-mono">
        <span className="text-[#d5d9e0]">cloudshell</span>
        <span className="mx-2 text-[#3a404a]">|</span>
        <span className="text-[#6b7380] truncate">{session ? `${session.id} · ${session.zone}` : "connecting…"}</span>
        <span className="ml-auto flex items-center gap-1.5 text-[#6b7380]">
          <span className="size-1.5 rounded-full bg-[#5fd68a]" /> connected
        </span>
      </div>
      <div ref={bodyRef} className="h-[300px] overflow-y-auto px-3.5 py-3 font-mono text-[12.5px] leading-[1.6]">
        <div className="text-[#6b7380] mb-2">
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
              readOnly={typing}
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
              className="w-full bg-transparent outline-none caret-[#5fd68a] text-[#f3f5f7]"
            />
          </span>
        </label>
      </div>
    </div>
  );
}
