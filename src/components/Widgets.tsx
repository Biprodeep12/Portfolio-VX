"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { EXPERIENCE, PROFILE } from "@/data/profile";
import { evaluate } from "@/data/policy";
import { audit, getSession } from "./audit";

/* ================= Deployment timeline ================= */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const toIdx = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return y * 12 + (m - 1);
};

export function DeploymentTimeline({ builtAt }: { builtAt: string }) {
  const [now, setNow] = useState(() => new Date(builtAt));
  useEffect(() => setNow(new Date()), []);

  const nowIdx = now.getFullYear() * 12 + now.getMonth();
  const first = Math.min(...EXPERIENCE.map((r) => toIdx(r.start))) - 1;
  const last = nowIdx + 2;
  const span = last - first;
  const pct = (i: number) => ((i - first) / span) * 100;
  const nowFrac = pct(nowIdx + now.getDate() / 31);
  const months = Array.from({ length: span }, (_, k) => first + k);
  const roles = [...EXPERIENCE].sort((a, b) => a.start.localeCompare(b.start));

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px] px-4 pt-4 pb-3">
        {/* axis */}
        <div className="relative ml-[168px] h-6 border-b border-line">
          {months.map((m) => {
            const isJan = m % 12 === 0;
            return (
              <div key={m} className="absolute bottom-0 h-full" style={{ left: `${pct(m)}%` }}>
                <div className={`absolute bottom-0 w-px ${isJan ? "h-3 bg-line-strong" : "h-1.5 bg-line"}`} />
                {(isJan || m % 3 === 0) && (
                  <span className={`absolute bottom-3 -translate-x-1/2 mono text-[10.5px] whitespace-nowrap ${isJan ? "text-fg-2" : "text-faint"}`}>
                    {isJan ? Math.floor(m / 12) : MONTHS[m % 12]}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* lanes */}
        <div className="relative">
          <div
            className="absolute top-0 bottom-0 w-px bg-accent z-10 pointer-events-none"
            style={{ left: `calc(168px + (100% - 168px) * ${nowFrac / 100})` }}
          >
            <span className="absolute -top-0.5 left-1.5 mono text-[10px] text-accent whitespace-nowrap">now</span>
          </div>
          {roles.map((r) => {
            const start = toIdx(r.start);
            const months = nowIdx - start + 1;
            return (
              <div key={r.id} style={{ ["--d" as string]: `${300 + roles.indexOf(r) * 180}ms` }} className="flex items-center h-12 border-b border-line last:border-b-0 border-dashed">
                <div className="w-[168px] shrink-0 pr-4 min-w-0">
                  <div className="font-medium text-fg truncate">{r.company}</div>
                  <div className="mono text-[11px] text-muted">{r.id}</div>
                </div>
                <div className="relative flex-1 h-full">
                  <div
                    className="draw absolute top-1/2 -translate-y-1/2 h-6 rounded-[4px] bg-accent-soft border border-accent/40 flex items-center overflow-hidden"
                    style={{ left: `${pct(start)}%`, width: `${nowFrac - pct(start)}%` }}
                    title={`${r.title} · ${r.period}`}
                  >
                    <span className="px-2 text-[11.5px] font-medium text-accent truncate">
                      {r.title} · {months} mo
                    </span>
                    <span className="ml-auto h-full w-6 shrink-0 ongoing" aria-hidden />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ================= Policy simulator ================= */

const EXAMPLES = ["docker", "postgres", "kubernetes", "go", "rust", "redis"];

export function PolicySimulator() {
  const [q, setQ] = useState("");
  const [last, setLast] = useState<string | null>(null);
  const decision = useMemo(() => (q.trim() ? evaluate(q) : null), [q]);

  const commit = (v: string) => {
    if (!v.trim() || v === last) return;
    setLast(v);
    const d = evaluate(v);
    audit("SimulatePolicy", v.slice(0, 16), d.effect === "Allow" ? 200 : 403);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="p-4 md:border-r border-b md:border-b-0 border-line">
        <label className="label block mb-2" htmlFor="sim">
          Can Biprodeep work with…
        </label>
        <input
          id="sim"
          className="input mono"
          placeholder="type anything, e.g. docker"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && commit(q)}
          onBlur={() => commit(q)}
          autoComplete="off"
          spellCheck={false}
        />
        <div className="mt-3 flex flex-wrap gap-1.5">
          {EXAMPLES.map((x) => (
            <button
              key={x}
              onClick={() => {
                setQ(x);
                commit(x);
              }}
              className="mono text-[11.5px] h-6 px-2 rounded border border-line text-fg-2 hover:bg-hover hover:border-line-strong cursor-pointer transition-colors"
            >
              {x}
            </button>
          ))}
        </div>
      </div>
      <div className="p-4 mono text-[12px] leading-[1.7] bg-code min-h-[148px]">
        {!decision && <div className="text-faint">// result of the policy evaluation shows up here</div>}
        {decision && (
          <div className="anim-in" key={q}>
            <div>
              <span className="text-muted">principal </span>
              <span className="text-fg-2">{PROFILE.accountId}</span>
            </div>
            <div>
              <span className="text-muted">request{"   "}</span>
              <span className="text-fg-2">&quot;{q.trim()}&quot;</span>
            </div>
            {decision.effect === "Allow" ? (
              <>
                <div>
                  <span className="text-muted">action{"    "}</span>
                  <span className="text-accent">{decision.action}</span>
                </div>
                <div>
                  <span className="text-muted">matched{"   "}</span>
                  <span className="text-fg-2">Statement[{decision.sid}]</span>
                </div>
                <div className="mt-2 inline-flex items-center gap-2 h-6 px-2 rounded bg-ok-soft text-ok font-semibold">
                  ✓ Allowed
                </div>
              </>
            ) : (
              <>
                <div>
                  <span className="text-muted">matched{"   "}</span>
                  <span className="text-faint">none</span>
                </div>
                <div className="mt-2 inline-flex items-center gap-2 h-6 px-2 rounded bg-warn-soft text-warn font-semibold">
                  Implicit deny
                </div>
                <div className="mt-1.5 text-muted font-sans text-[12px]">
                  Not in the policy yet. Policies get updated, though:{" "}
                  <a href="#contact" className="link">
                    request access
                  </a>
                  .
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= Halftone portrait ================= */

export function HalftonePortrait({ src, full, alt }: { src: string; full: string; alt: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const img = new window.Image();
    img.decoding = "async";

    const draw = () => {
      if (!img.complete || !img.naturalWidth) return;
      const { width: w, height: h } = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const cell = 5;
      const cols = Math.ceil(w / cell);
      const rows = Math.ceil(h / cell);
      const off = document.createElement("canvas");
      off.width = cols;
      off.height = rows;
      const octx = off.getContext("2d", { willReadFrequently: true });
      if (!octx) return;
      // object-fit: cover
      const s = Math.max(cols / img.naturalWidth, rows / img.naturalHeight);
      const dw = img.naturalWidth * s;
      const dh = img.naturalHeight * s;
      octx.drawImage(img, (cols - dw) / 2, (rows - dh) / 2, dw, dh);
      const data = octx.getImageData(0, 0, cols, rows).data;

      const fg = getComputedStyle(document.documentElement).getPropertyValue("--fg").trim() || "#101828";
      ctx.fillStyle = fg;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = (y * cols + x) * 4;
          const lum = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
          const dark = Math.pow(1 - lum, 1.15);
          const r = dark * cell * 0.62;
          if (r < 0.35) continue;
          ctx.beginPath();
          ctx.arc(x * cell + cell / 2, y * cell + cell / 2, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    img.onload = draw;
    // Don't fetch or draw anything until the portrait is close to the viewport.
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        img.src = src;
      },
      { rootMargin: "400px 0px" },
    );
    io.observe(wrap);
    const ro = new ResizeObserver(draw);
    ro.observe(wrap);
    const mo = new MutationObserver(draw);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      io.disconnect();
      ro.disconnect();
      mo.disconnect();
    };
  }, [src]);

  return (
    <div ref={wrapRef} className="group relative w-full h-full overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 size-full transition-opacity duration-500 group-hover:opacity-0" aria-hidden />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={full}
        alt={alt}
        loading="lazy"
        decoding="async"
        width={640}
        height={857}
        className="absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      />
    </div>
  );
}

/* ================= Session meter (footer) ================= */

export function SessionMeter() {
  const [state, setState] = useState<{ id: string; secs: number } | null>(null);
  useEffect(() => {
    const s = getSession();
    const tick = () => setState({ id: s.id, secs: Math.floor((Date.now() - s.started) / 1000) });
    tick();
    const t = window.setInterval(tick, 1000);
    return () => window.clearInterval(t);
  }, []);
  if (!state) return <span className="mono">session —</span>;
  const m = Math.floor(state.secs / 60);
  const s = state.secs % 60;
  return (
    <span className="mono tabular-nums">
      {state.id} · {m}m {String(s).padStart(2, "0")}s billed · $0.00 (free tier)
    </span>
  );
}

/* ================= Count-up number ================= */

export function CountUp({ value, duration = 1100 }: { value: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(value);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setN(0);
    let raf = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const tick = (t: number) => {
          const k = Math.min(1, (t - t0) / duration);
          setN(Math.round(value * (1 - Math.pow(1 - k, 3))));
          if (k < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, duration]);
  return (
    <span ref={ref} className="tabular-nums">
      {n}
    </span>
  );
}
