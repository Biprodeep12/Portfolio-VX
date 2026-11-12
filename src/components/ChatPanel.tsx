"use client";

import { Fragment, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowUp, Copy, ExternalLink, FileText, Hash, Boxes, RotateCcw, Square, X } from "lucide-react";
import { SUGGESTIONS, actionsFor, localAnswer, topicsFor, type ChatAction } from "@/data/knowledge";
import { PROFILE } from "@/data/profile";
import { Logo } from "./Shell";
import { useConsole } from "./Shell";
import { useToast } from "./client";
import { audit } from "./audit";

type Trace = { steps: string[]; startedAt: number; ms?: number; mode?: "ai" | "offline" };
type Msg = {
  id: number;
  role: "user" | "assistant";
  text: string;
  actions?: ChatAction[];
  source?: "ai" | "offline";
  pending?: boolean;
  trace?: Trace;
};

const STEP_MS = 380;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Live "thinking" lines while pending; a one-line summary once answered. */
function TraceView({ trace, pending }: { trace: Trace; pending: boolean }) {
  const [shown, setShown] = useState(1);
  useEffect(() => {
    if (!pending) return;
    const t = window.setInterval(() => setShown((n) => Math.min(n + 1, trace.steps.length)), STEP_MS);
    return () => window.clearInterval(t);
  }, [pending, trace.steps.length]);

  if (!pending) {
    const topics = trace.steps.filter((s) => s.startsWith("checking ")).map((s) => s.slice(9));
    return (
      <div className="mb-1 mono text-[11px] text-faint flex items-center gap-1.5">
        <span aria-hidden>↳</span>
        <span>
          read {topics.join(" · ") || "profile"}
          {trace.ms !== undefined && ` · ${(trace.ms / 1000).toFixed(1)}s`}
          {trace.mode === "offline" && " · offline"}
        </span>
      </div>
    );
  }
  return (
    <ol className="mono text-[11.5px] leading-6" aria-label="Assistant is working">
      {trace.steps.slice(0, shown).map((step, i) => {
        const current = i === shown - 1;
        return (
          <li key={step} className={`flex items-center gap-2 trace-in ${current ? "text-fg-2" : "text-faint"}`}>
            <span className="w-3 text-center" aria-hidden>
              {current ? <span className="inline-block size-1.5 rounded-full bg-accent caret-blink" /> : "✓"}
            </span>
            {step}
            {current && "…"}
          </li>
        );
      })}
    </ol>
  );
}

const STORE = "assistant-thread";
const GREETING: Msg = {
  id: 0,
  role: "assistant",
  text: `Hi! I'm the console assistant. Ask me anything about ${PROFILE.name.split(" ")[0]}'s work, projects, stack, or how to reach him.`,
};

/* ---------------- Tiny, safe markdown: **bold**, `code`, links, bullets ---------------- */

function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|`([^`]+)`|(https?:\/\/[^\s)]+)|([\w.+-]+@[\w-]+\.[\w.]+)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const k = `${key}-${i++}`;
    if (m[1]) out.push(<strong key={k} className="font-semibold text-fg">{m[1]}</strong>);
    else if (m[2]) out.push(<code key={k} className="mono text-[11.5px] px-1 rounded bg-hover">{m[2]}</code>);
    else if (m[3]) {
      const url = m[3].replace(/[.,]$/, "");
      out.push(
        <a key={k} href={url} target="_blank" rel="noopener noreferrer" className="link break-all">
          {url.replace(/^https?:\/\/(www\.)?/, "")}
        </a>,
      );
      if (url.length < m[3].length) out.push(m[3].slice(url.length));
    } else if (m[4]) out.push(<a key={k} href={`mailto:${m[4]}`} className="link">{m[4]}</a>);
    last = re.lastIndex;
  }
  out.push(text.slice(last));
  return out;
}

function Markdown({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  const flush = (k: number) => {
    if (!list.length) return;
    blocks.push(
      <ul key={`ul${k}`} className="my-1 flex flex-col gap-0.5 pl-4 list-disc marker:text-faint">
        {list.map((l, i) => (
          <li key={i}>{inline(l, `li${k}-${i}`)}</li>
        ))}
      </ul>,
    );
    list = [];
  };
  text.split("\n").forEach((line, i) => {
    const b = line.match(/^\s*[-*•]\s+(.*)/);
    if (b) return void list.push(b[1]);
    flush(i);
    if (line.trim()) blocks.push(<p key={i}>{inline(line, `p${i}`)}</p>);
  });
  flush(-1);
  return <div className="flex flex-col gap-1.5">{blocks}</div>;
}

/* ---------------- Panel ---------------- */

const ACTION_ICON = { project: Boxes, resume: FileText, section: Hash, copy: Copy, link: ExternalLink } as const;

export default function ChatPanel({ onClose, ask: askProp }: { onClose: () => void; ask?: { q: string; n: number } }) {
  const { openProject, openResume } = useConsole();
  const toast = useToast();
  const [msgs, setMsgs] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const nextId = useRef(1);
  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const msgsRef = useRef(msgs);
  msgsRef.current = msgs;

  // Restore this tab's conversation.
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORE) ?? "null") as Msg[] | null;
      if (saved?.length) {
        setMsgs(saved.map((m) => ({ ...m, pending: false })));
        nextId.current = Math.max(...saved.map((m) => m.id)) + 1;
      }
    } catch {}
    inputRef.current?.focus({ preventScroll: true });
  }, []);
  useEffect(() => {
    if (busy) return;
    try {
      sessionStorage.setItem(STORE, JSON.stringify(msgs.slice(-30)));
    } catch {}
  }, [msgs, busy]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !document.querySelector('[aria-modal="true"]') && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const patch = (id: number, fn: (m: Msg) => Msg) => setMsgs((all) => all.map((m) => (m.id === id ? fn(m) : m)));

  // Type out an offline answer so both paths feel the same.
  const typeOut = (id: number, full: string, signal: AbortSignal) =>
    new Promise<void>((resolve) => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        patch(id, (m) => ({ ...m, text: full }));
        return resolve();
      }
      let i = 0;
      const step = () => {
        if (signal.aborted) return resolve();
        i = Math.min(full.length, i + 3 + Math.floor(Math.random() * 4));
        patch(id, (m) => ({ ...m, text: full.slice(0, i) }));
        if (i < full.length) requestAnimationFrame(step);
        else resolve();
      };
      requestAnimationFrame(step);
    });

  const send = useCallback(
    async (raw: string) => {
      const q = raw.trim().slice(0, 600);
      if (!q || busy) return;
      setInput("");
      setBusy(true);
      const userMsg: Msg = { id: nextId.current++, role: "user", text: q };
      const steps = ["reading portfolio facts", ...topicsFor(q).map((t) => `checking ${t}`), "asking the model"];
      const reply: Msg = { id: nextId.current++, role: "assistant", text: "", pending: true, trace: { steps, startedAt: Date.now() } };
      const elapsed = () => Date.now() - reply.trace!.startedAt;
      const history = [...msgsRef.current.filter((m) => m.id !== 0 && m.text), userMsg]
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.text }));
      setMsgs((all) => [...all, userMsg, reply]);
      audit("InvokeAssistant", q.slice(0, 16));

      const ctrl = new AbortController();
      abortRef.current = ctrl;
      let got = "";
      try {
        const res = await fetch("/api/chat/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history }),
          signal: ctrl.signal,
        });
        if (!res.ok || !res.body) throw new Error(`status ${res.status}`);
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let frame = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          got += dec.decode(value, { stream: true });
          // Batch DOM updates to one per frame while tokens pour in.
          if (!frame) {
            frame = requestAnimationFrame(() => {
              frame = 0;
              patch(reply.id, (m) => ({ ...m, text: got, pending: false, trace: m.trace && { ...m.trace, ms: m.trace.ms ?? elapsed(), mode: "ai" } }));
            });
          }
        }
        cancelAnimationFrame(frame);
        if (!got.trim()) throw new Error("empty");
        patch(reply.id, (m) => ({ ...m, text: got.trim(), pending: false, source: "ai", actions: actionsFor(q) }));
      } catch {
        if (ctrl.signal.aborted && got) {
          patch(reply.id, (m) => ({ ...m, text: got.trim() + " …", pending: false, source: "ai" }));
        } else if (!ctrl.signal.aborted) {
          const a = localAnswer(q);
          // Model unavailable: say so in the trace, let it finish playing, then answer.
          patch(reply.id, (m) => ({
            ...m,
            trace: m.trace && { ...m.trace, steps: [...m.trace.steps.slice(0, -1), "answering offline from portfolio data"] },
          }));
          const minVisible = steps.length * STEP_MS + 150;
          if (elapsed() < minVisible) await sleep(minVisible - elapsed());
          patch(reply.id, (m) => ({ ...m, pending: false, source: "offline", trace: m.trace && { ...m.trace, ms: elapsed(), mode: "offline" } }));
          await typeOut(reply.id, a.text, ctrl.signal);
          patch(reply.id, (m) => ({ ...m, actions: a.actions }));
        } else {
          patch(reply.id, (m) => ({ ...m, text: "Stopped.", pending: false }));
        }
      } finally {
        abortRef.current = null;
        setBusy(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [busy],
  );

  // Questions handed over from the terminal (`ask ...`) or elsewhere.
  useEffect(() => {
    if (askProp?.q) send(askProp.q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [askProp?.n]);

  const runAction = (a: ChatAction) => {
    if (a.kind === "project") openProject(a.id);
    else if (a.kind === "resume") openResume();
    else if (a.kind === "copy") navigator.clipboard?.writeText(a.value).then(() => toast(`${a.label.replace("Copy ", "")} copied`));
    else if (a.kind === "link") window.open(a.href, "_blank", "noopener,noreferrer");
    else if (a.kind === "section") {
      if (window.innerWidth < 640) onClose();
      document.getElementById(a.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const reset = () => {
    abortRef.current?.abort();
    setMsgs([GREETING]);
    try {
      sessionStorage.removeItem(STORE);
    } catch {}
    inputRef.current?.focus();
  };

  const onlyGreeting = msgs.length === 1;
  const lastSource = [...msgs].reverse().find((m) => m.source)?.source;

  return (
    <section
      role="dialog"
      aria-label="Portfolio assistant"
      className="chat-in fixed z-[45] inset-0 sm:inset-auto sm:bottom-[5.25rem] sm:right-5 sm:w-[384px] sm:h-[min(600px,calc(100dvh-7.5rem))] flex flex-col bg-panel sm:border border-line sm:rounded-xl shadow-2xl shadow-black/20 overflow-hidden"
    >
      <header className="flex items-center gap-3 px-4 h-14 border-b border-line shrink-0">
        <Logo size={26} />
        <div className="min-w-0 flex-1 leading-tight">
          <div className="font-semibold text-fg">Ask the console</div>
          <div className="flex items-center gap-1.5 text-[11.5px] text-muted">
            <span className={`size-1.5 rounded-full ${lastSource === "offline" ? "bg-warn" : "bg-ok"}`} aria-hidden />
            {lastSource === "offline" ? "Offline answers from this portfolio" : "AI assistant · knows this portfolio"}
          </div>
        </div>
        <button className="btn-icon" onClick={reset} aria-label="New conversation" title="New conversation">
          <RotateCcw className="size-4" />
        </button>
        <button className="btn-icon" onClick={onClose} aria-label="Close assistant">
          <X className="size-4" />
        </button>
      </header>

      <div ref={listRef} className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 flex flex-col gap-3" aria-live="polite">
        {msgs.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="self-end max-w-[85%] rounded-2xl rounded-br-md bg-fg text-panel px-3.5 py-2 leading-relaxed whitespace-pre-wrap break-words msg-in">
              {m.text}
            </div>
          ) : (
            <div key={m.id} className="self-start max-w-[92%] msg-in">
              {m.trace && <TraceView trace={m.trace} pending={!!m.pending && !m.text} />}
              {!(m.pending && !m.text) && (
                <div className="rounded-2xl rounded-bl-md border border-line bg-subtle px-3.5 py-2.5 leading-relaxed text-fg-2 break-words">
                  {m.trace || m.text ? (
                    <Markdown text={m.text} />
                  ) : (
                    <span className="flex gap-1 py-1.5" aria-label="Thinking">
                      <span className="dot" />
                      <span className="dot [animation-delay:150ms]" />
                      <span className="dot [animation-delay:300ms]" />
                    </span>
                  )}
                </div>
              )}
              {!!m.actions?.length && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {m.actions.map((a) => {
                    const Icon = ACTION_ICON[a.kind];
                    return (
                      <button
                        key={a.label}
                        onClick={() => runAction(a)}
                        className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full border border-line bg-panel text-[12px] text-fg-2 hover:border-line-strong hover:text-fg cursor-pointer transition-colors"
                      >
                        <Icon className="size-3.5 text-muted" /> {a.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ),
        )}

        {onlyGreeting && (
          <div className="flex flex-col gap-1.5 mt-1">
            {SUGGESTIONS.map((s, i) => (
              <Fragment key={s}>
                <button
                  onClick={() => send(s)}
                  style={{ animationDelay: `${120 + i * 60}ms` }}
                  className="msg-in self-start text-left h-8 px-3 rounded-full border border-line text-fg-2 hover:bg-hover hover:border-line-strong cursor-pointer transition-colors"
                >
                  {s}
                </button>
              </Fragment>
            ))}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="border-t border-line p-3 shrink-0"
      >
        <div className="flex items-end gap-2 rounded-xl border border-line-strong bg-panel px-3 py-2 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 transition-shadow">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            maxLength={600}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="Ask about projects, stack, experience…"
            aria-label="Message"
            className="flex-1 resize-none bg-transparent outline-none text-[16px] sm:text-[13.5px] leading-6 text-fg placeholder:text-faint max-h-[120px]"
          />
          {busy ? (
            <button type="button" onClick={() => abortRef.current?.abort()} className="grid place-items-center size-8 shrink-0 rounded-lg bg-fg text-panel cursor-pointer" aria-label="Stop">
              <Square className="size-3 fill-current" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="grid place-items-center size-8 shrink-0 rounded-lg bg-accent text-accent-fg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              aria-label="Send"
            >
              <ArrowUp className="size-4" />
            </button>
          )}
        </div>
        <p className="mt-2 text-[11px] text-muted text-center">AI can get things wrong. For anything important, email {PROFILE.email}.</p>
      </form>
    </section>
  );
}
