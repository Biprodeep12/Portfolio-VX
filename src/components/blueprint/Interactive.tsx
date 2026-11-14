"use client";

import { useState } from "react";
import { TABLES } from "@/data/blueprint";

/* ---------------- ERD ---------------- */

export function Erd() {
  const [hot, setHot] = useState<string | null>(null);
  const related = (name: string) => {
    const set = new Set([name]);
    const t = TABLES.find((x) => x.name === name)!;
    t.cols.forEach((c) => c.ref && set.add(c.ref));
    TABLES.forEach((x) => x.cols.some((c) => c.ref === name) && set.add(x.name));
    return set;
  };
  const rel = hot ? related(hot) : null;
  return (
    <div className="panel p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3 mb-4">
        <div className="label">Core schema</div>
        <span className="mono text-[11px] text-faint">
          <span className="only-hover">hover</span>
          <span className="only-touch">tap</span> a table for its relations
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {TABLES.map((t) => {
          const on = rel?.has(t.name);
          return (
            <button
              type="button"
              key={t.name}
              onMouseEnter={() => setHot(t.name)}
              onMouseLeave={() => setHot(null)}
              onFocus={() => setHot(t.name)}
              onBlur={() => setHot(null)}
              onClick={() => setHot((h) => (h === t.name ? null : t.name))}
              className={`text-left rounded-md border bg-panel overflow-hidden cursor-default transition-[opacity,border-color] duration-200 ${
                rel ? (on ? (t.name === hot ? "border-accent" : "border-accent/50") : "opacity-40 border-line") : "border-line"
              }`}
            >
              <div className={`px-3 h-8 flex items-center justify-between border-b border-line ${t.name === hot ? "bg-accent-soft" : "bg-subtle"}`}>
                <span className="mono text-[12px] font-semibold text-fg">{t.name}</span>
                <span className="mono text-[10.5px] text-faint">table</span>
              </div>
              <ul className="px-3 py-2 flex flex-col gap-0.5">
                {t.cols.map((c) => (
                  <li key={c.n} className="mono text-[11.5px] flex items-center gap-2 min-w-0">
                    <span className={`w-6 shrink-0 text-[9.5px] font-semibold ${c.k === "pk" ? "text-warn" : c.k === "fk" ? "text-accent" : "text-ok"}`}>
                      {c.k?.toUpperCase()}
                    </span>
                    <span className="text-fg-2 truncate">{c.n}</span>
                    <span className="text-faint ml-auto shrink-0">{c.ref ? `→ ${c.ref}` : c.t}</span>
                  </li>
                ))}
              </ul>
              {t.idx && <div className="px-3 pb-2 mono text-[10.5px] text-faint truncate">idx {t.idx}</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
