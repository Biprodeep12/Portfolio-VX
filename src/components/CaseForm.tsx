"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, Copy, Mail, RotateCcw, Send } from "lucide-react";
import { PROFILE } from "@/data/profile";
import { audit } from "./audit";
import { useToast } from "./client";

const TYPES = [
  { id: "job", label: "Job opportunity", hint: "Roles, interviews, referrals" },
  { id: "freelance", label: "Freelance", hint: "A project with a scope" },
  { id: "collab", label: "Collaboration", hint: "Build something together" },
  { id: "hello", label: "Just saying hi", hint: "No agenda needed" },
];

const MAX = 1000;
const MIN = 20;
const DRAFT_KEY = "support-draft";

type Field = "type" | "name" | "subject" | "message";
type Draft = { type: string; name: string; subject: string; message: string };

const EMPTY: Draft = { type: "job", name: "", subject: "", message: "" };

function validate(d: Draft) {
  const e: Partial<Record<Field, string>> = {};
  if (!d.subject.trim()) e.subject = "Add a subject so it doesn't get lost in my inbox.";
  else if (d.subject.trim().length < 3) e.subject = "A little longer, please.";
  if (!d.message.trim()) e.message = "Write a few lines.";
  else if (d.message.trim().length < MIN) e.message = `At least ${MIN} characters (${d.message.trim().length} so far).`;
  return e;
}

function compose(d: Draft) {
  const type = TYPES.find((t) => t.id === d.type) ?? TYPES[0];
  const subject = `[${type.label}] ${d.subject.trim()}`;
  const body = `${d.message.trim()}\n\n— ${d.name.trim() || "Sent from biprodeep.me"}`;
  return { subject, body };
}

export function CaseForm() {
  const toast = useToast();
  const [d, setD] = useState<Draft>(EMPTY);
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [focus, setFocus] = useState<Field | null>(null);
  const [status, setStatus] = useState<"idle" | "sent">("idle");
  const [saved, setSaved] = useState(false);
  const loaded = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Restore / autosave the draft locally.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) setD({ ...EMPTY, ...JSON.parse(raw) });
    } catch {}
    loaded.current = true;
  }, []);
  useEffect(() => {
    if (!loaded.current) return;
    const empty = !d.name && !d.subject && !d.message;
    const t = window.setTimeout(() => {
      try {
        if (empty) localStorage.removeItem(DRAFT_KEY);
        else localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
        setSaved(!empty);
      } catch {}
    }, 400);
    return () => window.clearTimeout(t);
  }, [d]);

  const errors = validate(d);
  const showErr = (f: Field) => (touched[f] ? errors[f] : undefined);
  const set = (f: keyof Draft) => (v: string) => setD((x) => ({ ...x, [f]: v }));

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    setTouched({ subject: true, message: true });
    if (Object.keys(errors).length) {
      const first = errors.subject ? "subject" : "message";
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      audit("CreateCase", d.type, 400);
      return;
    }
    const { subject, body } = compose(d);
    audit("CreateCase", d.type, 201);
    setStatus("sent");
    window.location.href = `mailto:${PROFILE.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const copyMessage = async () => {
    const { subject, body } = compose(d);
    try {
      await navigator.clipboard.writeText(`To: ${PROFILE.email}\nSubject: ${subject}\n\n${body}`);
      toast("Message copied, paste it anywhere");
    } catch {
      toast("Clipboard unavailable");
    }
  };

  const reset = () => {
    setD(EMPTY);
    setTouched({});
    setStatus("idle");
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {}
  };

  const preview = d.message.length > 90 ? d.message.slice(0, 90) + "…" : d.message;
  const remaining = MAX - d.message.length;

  return (
    <div className="panel grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] overflow-hidden">
      {status === "sent" ? (
        <div className="p-6 sm:p-8 flex flex-col justify-center anim-in" role="status">
          <span className="grid place-items-center size-10 rounded-full bg-ok-soft text-ok mb-4 pop">
            <Check className="size-5" strokeWidth={2.5} />
          </span>
          <h3 className="text-[17px] font-semibold tracking-tight">Case drafted. Your mail app should be open.</h3>
          <p className="text-muted mt-1.5 max-w-md leading-relaxed">
            Hit send there and it lands straight in my inbox. If nothing opened, copy the message and send it from wherever you like.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button className="btn" onClick={copyMessage}>
              <Copy className="size-3.5" /> Copy message
            </button>
            <a className="btn" href={`mailto:${PROFILE.email}`}>
              <Mail className="size-3.5" /> {PROFILE.email}
            </a>
            <button className="btn" onClick={reset}>
              <RotateCcw className="size-3.5" /> Start over
            </button>
          </div>
        </div>
      ) : (
        <form
          ref={formRef}
          onSubmit={submit}
          noValidate
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) submit();
          }}
          className="p-6 sm:p-8 flex flex-col gap-6"
        >
          <fieldset onFocus={() => setFocus("type")} onBlur={() => setFocus(null)}>
            <legend className="label mb-2">What&apos;s it about</legend>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5" role="radiogroup">
              {TYPES.map((t) => {
                const on = d.type === t.id;
                return (
                  <button
                    type="button"
                    role="radio"
                    aria-checked={on}
                    key={t.id}
                    onClick={() => set("type")(t.id)}
                    className={`text-left rounded-md border px-2.5 py-2 cursor-pointer transition-all duration-200 ${
                      on ? "border-fg bg-fg text-panel shadow-sm" : "border-line text-fg-2 hover:bg-hover hover:border-line-strong"
                    }`}
                  >
                    <span className="block text-[12.5px] font-medium leading-4">{t.label}</span>
                    <span className={`block text-[11px] leading-4 mt-0.5 ${on ? "opacity-70" : "text-muted"}`}>{t.hint}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FieldWrap label="Your name" optional>
              <input
                name="name"
                className="input"
                value={d.name}
                onChange={(e) => set("name")(e.target.value)}
                onFocus={() => setFocus("name")}
                onBlur={() => setFocus(null)}
                placeholder="Jane Doe"
                autoComplete="name"
              />
            </FieldWrap>
            <FieldWrap label="Subject" error={showErr("subject")} id="subject">
              <input
                name="subject"
                className="input"
                value={d.subject}
                onChange={(e) => set("subject")(e.target.value)}
                onFocus={() => setFocus("subject")}
                onBlur={() => {
                  setFocus(null);
                  setTouched((t) => ({ ...t, subject: true }));
                }}
                placeholder="Short and specific"
                aria-invalid={!!showErr("subject")}
                aria-describedby={showErr("subject") ? "subject-err" : undefined}
                maxLength={120}
              />
            </FieldWrap>
          </div>

          <FieldWrap
            label="Message"
            error={showErr("message")}
            id="message"
            aside={
              <span className={`mono text-[11px] tabular-nums ${remaining < 100 ? "text-warn" : "text-faint"}`}>
                {d.message.length}/{MAX}
              </span>
            }
          >
            <textarea
              name="message"
              className="input h-auto min-h-32 py-2 resize-y leading-relaxed"
              value={d.message}
              onChange={(e) => set("message")(e.target.value.slice(0, MAX))}
              onFocus={() => setFocus("message")}
              onBlur={() => {
                setFocus(null);
                setTouched((t) => ({ ...t, message: true }));
              }}
              placeholder="What are you working on, and where do I fit in?"
              aria-invalid={!!showErr("message")}
              aria-describedby={showErr("message") ? "message-err" : undefined}
            />
          </FieldWrap>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="text-[12px] text-muted flex items-center gap-2">
              {saved ? (
                <span className="inline-flex items-center gap-1 text-ok anim-in">
                  <Check className="size-3" /> Draft saved locally
                </span>
              ) : (
                "Opens your mail app. No backend, no tracking."
              )}
            </span>
            <div className="flex items-center gap-2">
              <button type="button" className="btn" onClick={copyMessage} title="Copy instead of opening mail">
                <Copy className="size-3.5" />
                <span className="hidden sm:inline">Copy</span>
              </button>
              <button type="submit" className="btn-primary group">
                <Send className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                Send request
                <kbd className="hidden sm:inline mono text-[10px] opacity-70 ml-1">Ctrl ↵</kbd>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Live request preview */}
      <div className="border-t lg:border-t-0 lg:border-l border-line bg-code flex flex-col">
        <div className="flex items-center justify-between h-12 px-6 border-b border-line">
          <span className="mono text-muted text-[11.5px]">request preview</span>
          <span className="flex items-center gap-1.5 mono text-[11px] text-faint">
            <span className={`size-1.5 rounded-full ${status === "sent" ? "bg-ok" : "bg-accent caret-blink"}`} />
            {status === "sent" ? "201 created" : "live"}
          </span>
        </div>
        <pre className="mono text-[12px] leading-[1.8] p-6 text-fg-2 whitespace-pre-wrap break-words flex-1">
          <span className="text-accent font-semibold">POST</span> /v1/support/cases{"\n"}
          <span className="text-muted">Host:</span> biprodeep.me{"\n"}
          <span className="text-muted">Content-Type:</span> application/json{"\n\n"}
          {"{\n"}
          <PLine active={focus === "type"} k="type">
            <span className="text-ok">&quot;{d.type}&quot;</span>
          </PLine>
          <PLine active={focus === "name"} k="from">
            {d.name ? <span className="text-ok">&quot;{d.name}&quot;</span> : <span className="text-faint">null</span>}
          </PLine>
          <PLine active={focus === "subject"} k="subject" bad={!!showErr("subject")}>
            <span className="text-ok">&quot;{d.subject}&quot;</span>
          </PLine>
          <PLine active={focus === "message"} k="body" bad={!!showErr("message")}>
            <span className="text-ok">&quot;{preview}&quot;</span>
          </PLine>
          <PLine k="priority" last>
            <span className="text-warn">{d.type === "job" ? '"high"' : '"normal"'}</span>
          </PLine>
          {"}"}
          {status === "sent" && (
            <span className="block mt-4 anim-in">
              <span className="text-ok font-semibold">HTTP/1.1 201 Created</span>
              {"\n"}
              <span className="text-muted">X-Handled-By:</span> your-mail-app{"\n"}
              <span className="text-muted">X-Response-Time:</span> whenever I read it (fast)
            </span>
          )}
        </pre>
      </div>
    </div>
  );
}

function PLine({ k, active, bad, last, children }: { k: string; active?: boolean; bad?: boolean; last?: boolean; children: ReactNode }) {
  return (
    <span
      className={`block -mx-2 px-2 rounded transition-colors duration-200 ${
        bad ? "bg-warn-soft" : active ? "bg-accent-soft" : ""
      }`}
    >
      {"  "}
      <span className="text-accent">&quot;{k}&quot;</span>: {children}
      {last ? "" : ","}
    </span>
  );
}

function FieldWrap({
  label,
  optional,
  error,
  id,
  aside,
  children,
}: {
  label: string;
  optional?: boolean;
  error?: string;
  id?: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${error ? "[&_.input]:border-warn [&_.input]:focus:ring-warn/20" : ""}`}>
      <span className="flex items-center justify-between">
        <span className="label">
          {label} {optional && <span className="normal-case tracking-normal text-faint font-normal">· optional</span>}
        </span>
        {aside}
      </span>
      {children}
      {error && (
        <span id={`${id}-err`} className="text-[12px] text-warn anim-in">
          {error}
        </span>
      )}
    </label>
  );
}
