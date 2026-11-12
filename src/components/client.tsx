"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { Check, Copy, X } from "lucide-react";
import { audit } from "./audit";

/* ---------------- Toasts ---------------- */

type Toast = { id: number; text: string };
const ToastCtx = createContext<(text: string) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const push = useCallback((text: string) => {
    const id = ++nextId.current;
    setToasts((t) => [...t.slice(-2), { id, text }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[70] flex flex-col items-center gap-2" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="anim-in flex items-center gap-2.5 min-w-60 rounded-md border border-line bg-panel shadow-lg shadow-black/5 pl-3 pr-1.5 py-2"
          >
            <span className="flex items-center justify-center size-4 rounded-full bg-ok text-white">
              <Check className="size-3" strokeWidth={3} />
            </span>
            <span className="flex-1 text-fg">{t.text}</span>
            <button
              className="btn-icon size-6"
              aria-label="Dismiss"
              onClick={() => setToasts((all) => all.filter((x) => x.id !== t.id))}
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);

/* ---------------- Copy ---------------- */

export function CopyButton({ value, label = "Copied to clipboard" }: { value: string; label?: string }) {
  const toast = useToast();
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn-icon size-6 shrink-0 relative after:absolute after:-inset-2 after:content-['']"
      aria-label={`Copy ${value}`}
      onClick={async (e) => {
        e.stopPropagation();
        e.preventDefault();
        try {
          await navigator.clipboard.writeText(value);
          toast(label);
          audit("CopyToClipboard", value.length > 16 ? value.slice(0, 15) + "…" : value);
          setDone(true);
          window.setTimeout(() => setDone(false), 1400);
        } catch {
          toast("Clipboard unavailable");
        }
      }}
    >
      {done ? <Check className="size-3.5 text-ok" /> : <Copy className="size-3.5" />}
    </button>
  );
}

export function CopyField({ value, mono = true }: { value: string; mono?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 min-w-0 max-w-full">
      <span className={`truncate ${mono ? "mono" : ""}`}>{value}</span>
      <CopyButton value={value} />
    </span>
  );
}

/* ---------------- JSON viewer ---------------- */

function highlight(json: string) {
  // Tiny tokenizer: keys, strings, numbers/booleans. Enough for read-only config views.
  const out: ReactNode[] = [];
  const re = /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(json))) {
    if (m.index > last) out.push(json.slice(last, m.index));
    if (m[1] && m[2]) {
      out.push(<span key={i++} className="text-accent">{m[1]}</span>, m[2]);
    } else if (m[1]) {
      out.push(<span key={i++} className="text-ok">{m[1]}</span>);
    } else {
      out.push(<span key={i++} className="text-warn">{m[0]}</span>);
    }
    last = re.lastIndex;
  }
  out.push(json.slice(last));
  return out;
}

export function JsonBlock({ data, filename }: { data: unknown; filename: string }) {
  const text = JSON.stringify(data, null, 2);
  return (
    <div className="rounded-md border border-line overflow-hidden">
      <div className="flex items-center justify-between h-9 pl-3 pr-1.5 bg-subtle border-b border-line">
        <span className="mono text-muted">{filename}</span>
        <CopyButton value={text} label="JSON copied" />
      </div>
      <pre className="mono leading-relaxed bg-code text-fg-2 p-4 overflow-x-auto">
        <code>{highlight(text)}</code>
      </pre>
    </div>
  );
}

/* ---------------- Tabs ---------------- */

export function Tabs({ tabs }: { tabs: { id: string; label: string; content: ReactNode }[] }) {
  const [active, setActive] = useState(tabs[0].id);
  const current = tabs.find((t) => t.id === active) ?? tabs[0];
  return (
    <div>
      <div role="tablist" className="flex items-center gap-1 border-b border-line mb-4 overflow-x-auto">
        {tabs.map((t) => {
          const on = t.id === active;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={on}
              onClick={() => setActive(t.id)}
              className={`relative h-9 px-3 text-[13px] font-medium whitespace-nowrap cursor-pointer transition-colors ${
                on ? "text-fg" : "text-muted hover:text-fg"
              }`}
            >
              {t.label}
              <span
                className={`absolute left-2 right-2 -bottom-px h-0.5 rounded-full transition-colors ${
                  on ? "bg-accent" : "bg-transparent"
                }`}
              />
            </button>
          );
        })}
      </div>
      <div role="tabpanel" key={current.id} className="anim-in">
        {current.content}
      </div>
    </div>
  );
}
