import { ChevronRight } from "lucide-react";
import { ALERTS, BP_TOC, DECISIONS, FUNCTIONAL, LADDER, LEARNING_PATH, LEVERS, NON_FUNCTIONAL, SIZING, SLOS, type Item } from "@/data/blueprint";

export function Signals() {
  return (
    <div className="panel p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <div className="label">Service level objectives</div>
        <span className="mono text-[11px] text-faint">targets</span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {SLOS.map((s, i) => (
          <div key={s.name} style={{ ["--d" as string]: `${i * 60}ms` }} className="rise rounded-md border border-line p-3">
            <div className="text-[12px] text-muted">{s.name}</div>
            <div className="mt-0.5 text-[20px] leading-tight font-semibold tracking-tight text-fg tabular-nums">{s.target}</div>
            <div className="mt-0.5 text-[11.5px] text-faint leading-snug">{s.note}</div>
          </div>
        ))}
      </div>
      <div className="mt-5 label mb-2">Alert rules</div>
      <ul className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-1.5">
        {ALERTS.map((a) => (
          <li key={a.rule} className="flex items-start gap-2.5 text-[12.5px] text-fg-2 leading-snug">
            <span
              className={`mt-px shrink-0 h-5 px-1.5 inline-flex items-center rounded-[4px] mono text-[10px] font-semibold uppercase ${
                a.sev === "page" ? "bg-warn-soft text-warn" : "bg-hover text-muted"
              }`}
            >
              {a.sev}
            </span>
            {a.rule}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- Decisions ---------------- */

export function DecisionList() {
  return (
    <div className="panel divide-y divide-line overflow-hidden">
      {DECISIONS.map((d, i) => (
        <details key={d.area} className="rise group" style={{ ["--d" as string]: `${i * 40}ms` }} open={i === 0}>
          <summary className="list-none [&::-webkit-details-marker]:hidden cursor-pointer grid grid-cols-[1rem_minmax(0,1fr)] sm:grid-cols-[1rem_8.5rem_minmax(0,1fr)] gap-x-4 gap-y-1 items-baseline px-5 sm:px-8 py-4 hover:bg-hover/60 transition-colors">
            <ChevronRight className="size-4 text-muted self-center transition-transform duration-200 group-open:rotate-90" />
            <span className="mono text-[11.5px] text-faint uppercase tracking-[0.06em]">{d.area}</span>
            <span className="col-start-2 sm:col-start-auto min-w-0">
              <span className="font-medium text-fg">{d.chose}</span>
              <span className="text-muted"> over {d.over}</span>
            </span>
          </summary>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 px-5 sm:px-8 pb-6 pt-1 sm:pl-16 md:pl-[13.5rem]">
            {[
              { k: "Why", v: d.why },
              { k: "Cost", v: d.cost },
              { k: "Switch when", v: d.switchWhen },
            ].map((x) => (
              <div key={x.k}>
                <div className="label mb-1">{x.k}</div>
                <p className="text-[13.5px] text-fg-2 leading-relaxed">{x.v}</p>
              </div>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}

export function Ladder() {
  return (
    <div className="relative grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
      {LADDER.map((s, i) => (
        <div key={s.stage} style={{ ["--d" as string]: `${i * 90}ms` }} className="rise panel p-5 flex flex-col">
          <div className="flex items-center gap-3">
            <span className={`h-7 min-w-7 px-2 rounded-full grid place-items-center mono text-[11.5px] font-semibold shrink-0 ${i === 0 ? "bg-accent text-accent-fg" : "bg-hover text-fg-2"}`}>
              {s.stage}
            </span>
            <div className="min-w-0">
              <div className="text-[14px] font-semibold text-fg leading-tight">{s.name}</div>
              <div className="mono text-[11px] text-muted">{s.users}</div>
            </div>
          </div>
          <ul className="mt-4 flex flex-col gap-1.5 flex-1">
            {s.infra.map((x) => (
              <li key={x} className="flex gap-2 text-[13px] text-fg-2 leading-snug">
                <span className="mt-[7px] size-1 rounded-full bg-faint shrink-0" aria-hidden />
                {x}
              </li>
            ))}
          </ul>
          <div className="mt-4 pt-3 border-t border-line text-[12px] leading-snug">
            {i === 0 ? (
              <span className="text-accent font-medium">The design on this page</span>
            ) : (
              <>
                <span className="text-faint">Move on when </span>
                <span className="text-fg-2">{s.next}</span>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Capacity ---------------- */

export function Capacity() {
  return (
    <div className="flex flex-col gap-6">
      <div className="panel overflow-hidden">
        <div className="px-5 sm:px-6 pt-5 pb-3 flex items-baseline justify-between gap-3">
          <div className="label">How each tier is sized</div>
          <span className="mono text-[11px] text-faint">normal → peak</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left border-collapse">
            <thead>
              <tr className="border-y border-line bg-subtle">
                {["Service", "Runs on", "Normal", "Peak", "Scales on"].map((h, i) => (
                  <th key={h} className={`h-9 text-[11.5px] font-semibold text-muted ${i === 0 ? "px-5 sm:px-6" : "px-3"}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SIZING.map((r, i) => (
                <tr key={r.svc} style={{ ["--d" as string]: `${i * 50}ms` }} className="rise border-b border-line last:border-b-0">
                  <td className="py-3 px-5 sm:px-6 font-medium text-fg">{r.svc}</td>
                  <td className="py-3 px-3 text-[13px] text-fg-2">{r.runs}</td>
                  <td className="py-3 px-3 mono text-[12px] text-fg-2">{r.normal}</td>
                  <td className="py-3 px-3 mono text-[12px] text-fg">{r.peak}</td>
                  <td className="py-3 px-3 text-[13px] text-muted">{r.scales}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className="label mb-3">Where the savings come from</div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {LEVERS.map((l, i) => (
            <article key={l.title} style={{ ["--d" as string]: `${i * 60}ms` }} className="rise lift panel p-5 sm:p-6">
              <div className="flex items-baseline gap-2.5">
                <span className="mono text-[11px] text-faint tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="font-semibold text-[15px] tracking-tight text-fg">{l.title}</h3>
              </div>
              <p className="mt-2 text-[13.5px] text-fg-2 leading-relaxed">{l.body}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Learning pieces ---------------- */

/** One idea per card: the concept, how this design applies it, the usual mistake. */
export function ConceptCard({ item, i }: { item: Item; i: number }) {
  return (
    <article style={{ ["--d" as string]: `${i * 60}ms` }} className="rise panel p-5 sm:p-6 flex flex-col">
      <div className="flex items-baseline gap-2.5">
        <span className="mono text-[11px] text-faint tabular-nums">{String(i + 1).padStart(2, "0")}</span>
        <h3 className="font-semibold text-[15.5px] tracking-tight text-fg">{item.title}</h3>
      </div>
      <p className="mt-3 text-[14px] text-fg leading-relaxed">{item.concept}</p>
      <div className="mt-4 pl-3 border-l-2 border-accent/60">
        <div className="mono text-[10.5px] uppercase tracking-[0.08em] text-accent">In this design</div>
        <p className="mt-1 text-[13.5px] text-fg-2 leading-relaxed">{item.here}</p>
      </div>
      <div className="mt-3 pl-3 border-l-2 border-warn/60 flex-1">
        <div className="mono text-[10.5px] uppercase tracking-[0.08em] text-warn">Common mistake</div>
        <p className="mt-1 text-[13.5px] text-fg-2 leading-relaxed">{item.watch}</p>
      </div>
      {item.tags && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {item.tags.map((t) => (
            <span key={t} className="chip">
              {t}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}

export function ConceptGrid({ items }: { items: Item[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {items.map((it, i) => (
        <ConceptCard key={it.title} item={it} i={i} />
      ))}
    </div>
  );
}

const INDEX = Object.fromEntries(BP_TOC.map((t) => [t.id, t.index]));

export function LearningPath() {
  return (
    <ol className="grid grid-cols-2 md:grid-cols-4 gap-px bg-line rounded-lg overflow-hidden border border-line">
      {LEARNING_PATH.map((s) => (
        <li key={s.n} className="bg-panel">
          <a href={`#${s.to}`} className="group flex h-full flex-col gap-1 px-4 py-3.5 hover:bg-hover transition-colors">
            <span className="flex items-center gap-2">
              <span className="size-5 rounded-full bg-accent-soft text-accent grid place-items-center mono text-[10.5px] font-semibold">{s.n}</span>
              <span className="text-[13.5px] font-semibold text-fg">{s.title}</span>
            </span>
            <span className="text-[12.5px] text-muted leading-snug">{s.question}</span>
            <span className="mono text-[10.5px] text-faint group-hover:text-accent">§{INDEX[s.to]}</span>
          </a>
        </li>
      ))}
    </ol>
  );
}

export function Requirements() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="panel p-5 sm:p-6">
        <div className="label">Functional: what it must do</div>
        <ul className="mt-3 flex flex-col gap-2">
          {FUNCTIONAL.map((f) => (
            <li key={f} className="flex gap-2.5 text-[14px] text-fg-2 leading-relaxed">
              <span className="mt-2 size-1.5 rounded-full bg-accent shrink-0" aria-hidden />
              {f}
            </li>
          ))}
        </ul>
      </div>
      <div className="panel p-5 sm:p-6">
        <div className="label">Non-functional: how well it must do it</div>
        <dl className="mt-3 flex flex-col divide-y divide-line">
          {NON_FUNCTIONAL.map((n) => (
            <div key={n.k} className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3 py-2">
              <dt className="text-[13px] font-medium text-fg">{n.k}</dt>
              <dd className="text-[13.5px] text-fg-2">{n.v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
