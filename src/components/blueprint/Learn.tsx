"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Check, Lightbulb, RotateCcw, Search, X } from "lucide-react";
import { BP_TOC, GLOSSARY, QUIZ, type PartId } from "@/data/blueprint";
import { audit } from "../audit";

/* ---------------- Load estimator ---------------- */

const USERS = [100_000, 250_000, 500_000, 1_000_000, 2_500_000, 5_000_000, 10_000_000];

function fmt(n: number) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/, "")}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(n >= 1e5 ? 0 : 1).replace(/\.0$/, "")}k`;
  return `${Math.round(n)}`;
}

function Slider({
  label,
  value,
  display,
  min,
  max,
  step = 1,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  hint: string;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-3">
        <span className="text-[13px] font-medium text-fg">{label}</span>
        <span className="mono text-[12.5px] text-accent tabular-nums">{display}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-[var(--accent)] cursor-pointer"
      />
      <span className="block mt-1 text-[11.5px] text-muted leading-snug">{hint}</span>
    </label>
  );
}

export function Estimator() {
  const [u, setU] = useState(3); // index into USERS → 1M
  const [daily, setDaily] = useState(15);
  const [perUser, setPerUser] = useState(130);
  const [peak, setPeak] = useState(8);
  const [cdn, setCdn] = useState(70);
  const [cache, setCache] = useState(80);

  const r = useMemo(() => {
    const mau = USERS[u];
    const dau = mau * (daily / 100);
    const perDay = dau * perUser;
    const avg = perDay / 86_400;
    const peakRps = avg * peak;
    const origin = peakRps * (1 - cdn / 100);
    const queries = origin * 3 * (1 - cache / 100) + origin * 0.1;
    const sockets = dau * 0.13;
    const api = Math.max(2, Math.ceil(origin / 75));
    const gateway = Math.max(2, Math.ceil(sockets / 5000));
    const db =
      queries < 1500
        ? { tone: "ok", text: "One Postgres primary plus a read replica handles this comfortably." }
        : queries < 6000
          ? { tone: "warn", text: "Needs a bigger database instance and more read replicas (or a better cache hit rate)." }
          : { tone: "bad", text: "Past what one primary should carry: cache harder, move hot reads elsewhere, or start sharding." };
    return { mau, dau, perDay, avg, peakRps, origin, queries, sockets, api, gateway, db };
  }, [u, daily, perUser, peak, cdn, cache]);

  const rows = [
    { what: "Daily active users", how: `${fmt(r.mau)} × ${daily}%`, out: fmt(r.dau) },
    { what: "Requests per day", how: `${fmt(r.dau)} × ${perUser}`, out: fmt(r.perDay) },
    { what: "Average load", how: `${fmt(r.perDay)} ÷ 86,400 s`, out: `${fmt(r.avg)}/s` },
    { what: "Peak load", how: `average × ${peak}`, out: `${fmt(r.peakRps)}/s` },
    { what: "Reaching your servers", how: `peak × ${100 - cdn}% not served by the CDN`, out: `${fmt(r.origin)}/s` },
    { what: "Database queries", how: `servers × 3 × ${100 - cache}% cache misses + writes`, out: `${fmt(r.queries)}/s` },
    { what: "Online at once", how: `${fmt(r.dau)} × ~13% in the busiest hour`, out: fmt(r.sockets) },
  ];

  return (
    <div className="panel overflow-hidden grid grid-cols-1 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
      <div className="p-5 sm:p-6 flex flex-col gap-5 border-b lg:border-b-0 lg:border-r border-line bg-subtle/50">
        <div>
          <div className="label">Try it: change the assumptions</div>
          <p className="mt-1 text-[12.5px] text-muted leading-relaxed">Every result is recalculated, step by step, as you move a slider.</p>
        </div>
        <Slider label="Monthly active users" value={u} display={fmt(USERS[u])} min={0} max={USERS.length - 1} onChange={setU} hint="The headline number in most system design questions." />
        <Slider label="Active on a given day" value={daily} display={`${daily}%`} min={5} max={40} onChange={setDaily} hint="Social apps run high; tools people use weekly run low." />
        <Slider label="Requests per user per day" value={perUser} display={`${perUser}`} min={40} max={300} step={10} onChange={setPerUser} hint="Pages, images, scripts and API calls together." />
        <Slider label="Peak vs average" value={peak} display={`${peak}×`} min={2} max={12} onChange={setPeak} hint="Traffic bunches into busy hours; size for the peak." />
        <Slider label="Served by the CDN" value={cdn} display={`${cdn}%`} min={0} max={90} step={5} onChange={setCdn} hint="Static pages, scripts and images answered at the edge." />
        <Slider label="Reads served from cache" value={cache} display={`${cache}%`} min={0} max={95} step={5} onChange={setCache} hint="Redis hits that never reach the database." />
        <button
          className="btn self-start"
          onClick={() => {
            setU(3);
            setDaily(15);
            setPerUser(130);
            setPeak(8);
            setCdn(70);
            setCache(80);
          }}
        >
          <RotateCcw className="size-3.5" /> Reset to this design
        </button>
      </div>

      <div className="p-5 sm:p-6 flex flex-col gap-5 min-w-0">
        <ol className="flex flex-col divide-y divide-line">
          {rows.map((row, i) => (
            <li key={row.what} className="grid grid-cols-[1.5rem_minmax(0,1fr)_auto] gap-3 py-2.5 items-baseline">
              <span className="mono text-[11px] text-faint tabular-nums">{String(i + 1).padStart(2, "0")}</span>
              <span className="min-w-0">
                <span className="block text-[13.5px] text-fg">{row.what}</span>
                <span className="block mono text-[11.5px] text-muted break-words">{row.how}</span>
              </span>
              <span className="mono text-[15px] font-semibold text-fg tabular-nums">{row.out}</span>
            </li>
          ))}
        </ol>

        <div>
          <div className="label mb-2">What that means for the design</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-md border border-line p-3">
              <div className="text-[12px] text-muted">API tasks at peak</div>
              <div className="mt-0.5 text-[20px] font-semibold tabular-nums text-fg">{r.api}</div>
              <div className="text-[11px] text-faint">at ~75 requests/s each</div>
            </div>
            <div className="rounded-md border border-line p-3">
              <div className="text-[12px] text-muted">Gateway tasks at peak</div>
              <div className="mt-0.5 text-[20px] font-semibold tabular-nums text-fg">{r.gateway}</div>
              <div className="text-[11px] text-faint">at ~5k sockets each</div>
            </div>
          </div>
          <p
            className={`mt-2 rounded-md px-3 py-2.5 text-[13px] leading-relaxed border ${
              r.db.tone === "ok" ? "border-ok/40 bg-ok-soft text-fg" : r.db.tone === "warn" ? "border-warn/40 bg-warn-soft text-fg" : "border-warn bg-warn-soft text-warn"
            }`}
          >
            <span className="font-medium">Database: </span>
            {r.db.text}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Check yourself ---------------- */

export function CheckYourself({ part }: { part: PartId }) {
  const quiz = QUIZ[part];
  const [picked, setPicked] = useState<number | null>(null);
  if (!quiz) return null;
  const done = picked !== null;
  const right = picked === quiz.answer;
  return (
    <div className="mt-6 panel p-5 sm:p-6">
      <div className="flex items-center gap-2 label">
        <Lightbulb className="size-3.5 text-accent" /> Check yourself
      </div>
      <p className="mt-2 text-[15px] font-medium text-fg leading-snug">{quiz.q}</p>
      <div className="mt-4 grid grid-cols-1 gap-2">
        {quiz.options.map((o, i) => {
          const isAnswer = i === quiz.answer;
          const isPicked = i === picked;
          return (
            <button
              key={o}
              disabled={done}
              onClick={() => {
                setPicked(i);
                audit("AnswerQuiz", `${part}:${i === quiz.answer ? "right" : "wrong"}`);
              }}
              className={`text-left flex items-start gap-3 rounded-md border px-4 py-3 text-[13.5px] leading-snug transition-colors ${
                !done
                  ? "border-line hover:border-line-strong hover:bg-hover cursor-pointer text-fg-2"
                  : isAnswer
                    ? "border-ok/50 bg-ok-soft text-fg"
                    : isPicked
                      ? "border-warn/50 bg-warn-soft text-fg"
                      : "border-line text-muted opacity-70"
              }`}
            >
              <span
                className={`mt-px size-5 shrink-0 rounded-full border grid place-items-center mono text-[10.5px] ${
                  done && isAnswer ? "border-ok bg-ok text-white" : done && isPicked ? "border-warn bg-warn text-white" : "border-line-strong text-muted"
                }`}
              >
                {done && isAnswer ? <Check className="size-3" /> : done && isPicked ? <X className="size-3" /> : String.fromCharCode(65 + i)}
              </span>
              {o}
            </button>
          );
        })}
      </div>
      {done && (
        <div className="anim-in mt-4 flex flex-col sm:flex-row sm:items-start gap-3 justify-between">
          <p className="text-[13.5px] text-fg-2 leading-relaxed">
            <span className={`font-semibold ${right ? "text-ok" : "text-warn"}`}>{right ? "Right. " : "Not quite. "}</span>
            {quiz.explain}
          </p>
          <button className="btn shrink-0" onClick={() => setPicked(null)}>
            <RotateCcw className="size-3.5" /> Try again
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------------- Glossary ---------------- */

const INDEX = Object.fromEntries(BP_TOC.map((t) => [t.id, t.index]));

export function Glossary() {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? GLOSSARY.filter((g) => `${g.term} ${g.def}`.toLowerCase().includes(s)) : GLOSSARY;
  }, [q]);
  return (
    <div>
      <div className="relative max-w-sm mb-5">
        <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
        <input className="input pl-8" placeholder="Filter terms, e.g. cache" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filter glossary" />
      </div>
      {list.length === 0 ? (
        <p className="text-muted">No terms match “{q}”.</p>
      ) : (
        <dl className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {list.map((g) => (
            <div key={g.term} className="panel p-4 flex flex-col">
              <dt className="font-semibold text-[14px] text-fg">{g.term}</dt>
              <dd className="mt-1 text-[13px] text-fg-2 leading-relaxed flex-1">{g.def}</dd>
              <dd className="mt-3">
                <a href={`#${g.to}`} className="inline-flex items-center gap-1 mono text-[11.5px] text-accent hover:underline">
                  §{INDEX[g.to]} {BP_TOC.find((t) => t.id === g.to)?.label} <ArrowRight className="size-3" />
                </a>
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
