"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PROFILE } from "@/data/profile";
import { evaluate } from "@/data/policy";
import { audit, getSession } from "./audit";

/* ================= Policy simulator ================= */

const EXAMPLES = ["docker", "postgres", "kubernetes", "go", "rust", "redis"];

export function PolicySimulator() {
  const [q, setQ] = useState("");
  const [last, setLast] = useState<string | null>(null);
  // Until the visitor types, show a worked example so the panel isn't empty.
  const shown = q.trim() || "docker";
  const isExample = !q.trim();
  const decision = useMemo(() => evaluate(shown), [shown]);

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
      <div className="p-4 mono text-[12px] leading-[1.7] bg-code min-h-[96px] md:min-h-[148px]">
        {isExample && <div className="text-faint">// example: try your own on the left</div>}
        {decision && (
          <div className={`anim-in ${isExample ? "opacity-70" : ""}`} key={shown}>
            <div>
              <span className="text-muted">principal </span>
              <span className="text-fg-2">{PROFILE.accountId}</span>
            </div>
            <div>
              <span className="text-muted">request{"   "}</span>
              <span className="text-fg-2">&quot;{shown}&quot;</span>
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
  const [on, setOn] = useState(false);
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
      if (w < 1 || h < 1) return; // detached or hidden (e.g. mid route change)
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
    <div
      ref={wrapRef}
      role="button"
      tabIndex={0}
      aria-pressed={on}
      aria-label="Toggle between dithered and real photo"
      onClick={() => setOn((v) => !v)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setOn((v) => !v))}
      className="group relative w-full h-full overflow-hidden cursor-pointer"
    >
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 size-full transition-opacity duration-500 [@media(hover:hover)]:group-hover:opacity-0 ${on ? "opacity-0" : ""}`}
        aria-hidden
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={full}
        alt={alt}
        loading="lazy"
        decoding="async"
        width={640}
        height={857}
        className={`absolute inset-0 size-full object-cover transition-opacity duration-500 [@media(hover:hover)]:group-hover:opacity-100 ${on ? "opacity-100" : "opacity-0"}`}
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
