"use client";

import Link from "next/link";
import { Fragment, useState } from "react";
import { LAYERS, placeById, type StackSkill } from "@/data/stack";
import { audit } from "./audit";

// Display names for the groups; the data layer ids stay the same.
const ROW_NAMES: Record<string, string> = {
  client: "Frontend",
  api: "APIs & real-time",
  services: "Backend",
  data: "Data",
  infra: "Cloud & DevOps",
  quality: "Quality & tooling",
};

function summary(skills: StackSkill[]) {
  const places = new Set(skills.flatMap((s) => s.used)).size;
  return `${skills.length} tools${places ? ` · ${places} codebase${places === 1 ? "" : "s"}` : ""}`;
}

/** The stack as compact labelled groups of chips, with one shared "shipped in" line. */
export function StackEditorial() {
  const [active, setActive] = useState<{ row: string; skill: StackSkill } | null>(null);

  return (
    <div onMouseLeave={() => setActive(null)}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 border-b border-line">
        {LAYERS.map((layer, i) => (
          <div key={layer.id} style={{ ["--d" as string]: `${i * 60}ms` }} className="rise border-t border-line py-5">
            <div className="flex items-baseline justify-between gap-3 mb-3">
              <span className="flex items-baseline gap-2.5">
                <span className="mono text-[11.5px] text-faint">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-[12px] font-medium text-muted uppercase tracking-[0.12em]">{ROW_NAMES[layer.id] ?? layer.name}</span>
              </span>
              <span className="mono text-[11px] text-faint whitespace-nowrap">{summary(layer.skills)}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {layer.skills.map((s) => {
                const on = active?.skill.name === s.name;
                const dim = active?.row === layer.id && !on;
                return (
                  <button
                    key={s.name}
                    type="button"
                    onMouseEnter={() => setActive({ row: layer.id, skill: s })}
                    onFocus={() => setActive({ row: layer.id, skill: s })}
                    onClick={() => {
                      setActive({ row: layer.id, skill: s });
                      audit("TraceStack", s.name.slice(0, 16));
                    }}
                    className={`h-8 px-3 rounded-[5px] border text-[13.5px] font-medium cursor-pointer transition-all duration-200 ${
                      on ? "border-accent bg-accent-soft text-fg" : "border-line bg-panel text-fg-2 hover:border-line-strong hover:text-fg"
                    } ${dim ? "opacity-45" : ""}`}
                  >
                    {s.name}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* One shared line of evidence for whatever chip is active */}
      <div className="mt-4 min-h-6 text-[13px] text-muted" aria-live="polite">
        {active ? (
          <span key={active.skill.name} className="anim-in inline-flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-medium text-fg">{active.skill.name}</span>
            <span className="text-faint">→</span>
            {active.skill.used.length ? (
              <>
                <span className="mono text-[11.5px] text-faint">shipped in</span>
                {active.skill.used.map((u, k) => {
                  const p = placeById(u);
                  return (
                    <Fragment key={u}>
                      {k > 0 && <span className="text-faint">·</span>}
                      <Link
                        prefetch={false}
                        href={p.href}
                        className="text-fg-2 hover:text-accent underline decoration-line-strong underline-offset-4 hover:decoration-accent"
                      >
                        {p.name}
                      </Link>
                    </Fragment>
                  );
                })}
                {active.skill.note && <span className="text-faint">· {active.skill.note}</span>}
              </>
            ) : (
              <span>part of the toolbox; not in the shipped work shown here yet</span>
            )}
          </span>
        ) : (
          <span className="text-faint">Hover or tap any tool to see where it has shipped.</span>
        )}
      </div>
    </div>
  );
}
