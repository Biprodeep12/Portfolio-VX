"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { ArrowRight, Lightbulb, Pause, Play, Repeat, RotateCcw, SkipBack, SkipForward } from "lucide-react";
import { SCENES, type Layout, type R, type SceneNode } from "@/data/scenes";
import { audit } from "../audit";

/* ---------------- Geometry ---------------- */

type Pt = [number, number];

/** Cubic link between two boxes, leaving from the facing sides. */
function link(a: R, b: R) {
  const gapX = Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w));
  const gapY = Math.max(b.y - (a.y + a.h), a.y - (b.y + b.h));
  const acx = a.x + a.w / 2;
  const acy = a.y + a.h / 2;
  const bcx = b.x + b.w / 2;
  const bcy = b.y + b.h / 2;
  let p0: Pt, p1: Pt, p2: Pt, p3: Pt;
  if (gapX >= 30 || gapX > gapY) {
    const s = bcx > acx ? 1 : -1;
    p0 = [s > 0 ? a.x + a.w : a.x, acy];
    p3 = [s > 0 ? b.x : b.x + b.w, bcy];
    const k = Math.max(14, Math.abs(p3[0] - p0[0]) / 2);
    p1 = [p0[0] + s * k, p0[1]];
    p2 = [p3[0] - s * k, p3[1]];
  } else {
    const s = bcy > acy ? 1 : -1;
    p0 = [acx, s > 0 ? a.y + a.h : a.y];
    p3 = [bcx, s > 0 ? b.y : b.y + b.h];
    const k = Math.max(14, Math.abs(p3[1] - p0[1]) / 2);
    p1 = [p0[0], p0[1] + s * k];
    p2 = [p3[0], p3[1] - s * k];
  }
  const mid: Pt = [(p0[0] + 3 * p1[0] + 3 * p2[0] + p3[0]) / 8, (p0[1] + 3 * p1[1] + 3 * p2[1] + p3[1]) / 8];
  return { d: `M${p0[0]} ${p0[1]} C${p1[0]} ${p1[1]} ${p2[0]} ${p2[1]} ${p3[0]} ${p3[1]}`, mid };
}

const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const SECTION_INDEX: Record<string, string> = { frontend: "03", backend: "04", data: "05", cloud: "06", devops: "07", security: "08" };

/* ---------------- Component ---------------- */

export function FlowMap({ sceneId }: { sceneId: string }) {
  const scene = SCENES[sceneId];
  const layouts: { kind: "wide" | "narrow"; L: Layout }[] = [
    { kind: "wide", L: scene.wide },
    { kind: "narrow", L: scene.narrow },
  ];
  const byId = useMemo(() => Object.fromEntries(scene.nodes.map((x) => [x.id, x])) as Record<string, SceneNode>, [scene]);

  const [flowId, setFlowId] = useState(scene.flows[0].id);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const [loop, setLoop] = useState(true);
  const wrapRef = useRef<HTMLDivElement>(null);
  const userStopped = useRef(false); // the visitor paused or took over; don't auto-resume
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const packetRefs = useRef<(SVGGElement | null)[]>([]);

  const flow = scene.flows.find((f) => f.id === flowId)!;
  const cur = flow.steps[step];
  const stepNode = (cur.at ?? cur.to)!;
  const inspected = byId[pinned ?? stepNode];

  const flowPairs = useMemo(() => new Set(flow.steps.filter((s) => s.from && s.to).map((s) => pairKey(s.from!, s.to!))), [flow]);
  const flowNodes = useMemo(() => new Set(flow.steps.flatMap((s) => [s.from, s.to, s.at].filter(Boolean) as string[])), [flow]);
  const neighbours = useMemo(() => {
    if (!hover) return null;
    const set = new Set<string>([hover]);
    scene.edges.forEach((e) => {
      if (e.a === hover) set.add(e.b);
      if (e.b === hover) set.add(e.a);
    });
    return set;
  }, [hover, scene]);

  // Play while the map is on screen, pause when it scrolls away (no work off-screen).
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          if (!userStopped.current) setPlaying(true);
        } else setPlaying(false);
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Move the packet along the current hop, then advance.
  useEffect(() => {
    const s = flow.steps[step];
    const place = (t: number) =>
      pathRefs.current.forEach((p, i) => {
        const g = packetRefs.current[i];
        if (!p || !g) return;
        const pt = p.getPointAtLength(p.getTotalLength() * t);
        g.setAttribute("transform", `translate(${pt.x} ${pt.y})`);
      });
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hop = Boolean(s.from && s.to);
    const travel = hop && playing && !reduce ? 850 : 0;
    let raf = 0;
    let timer = 0;
    if (hop) {
      if (travel) {
        place(0);
        const t0 = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - t0) / travel);
          place(ease(t));
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      } else place(1);
    }
    if (playing) {
      const last = step === flow.steps.length - 1;
      timer = window.setTimeout(
        () => {
          if (!last) setStep(step + 1);
          else if (loop) {
            // Loop: move on to the next flow, wrapping round to the first.
            const i = scene.flows.findIndex((f) => f.id === flow.id);
            setFlowId(scene.flows[(i + 1) % scene.flows.length].id);
            setStep(0);
            setPinned(null);
          } else setPlaying(false);
        },
        travel + (hop ? 900 : 1700) + (last && loop ? 1600 : 0),
      );
    }
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [flow, step, playing, loop, scene]);

  const pickFlow = (id: string) => {
    userStopped.current = false;
    setFlowId(id);
    setStep(0);
    setPinned(null);
    setPlaying(true);
    audit("RunFlow", `${sceneId}/${id}`.slice(0, 24));
  };
  const goto = (i: number) => {
    userStopped.current = true;
    setPlaying(false);
    setPinned(null);
    setStep(Math.max(0, Math.min(flow.steps.length - 1, i)));
  };
  const pick = (id: string) => {
    userStopped.current = true;
    setPlaying(false);
    setPinned(id);
    audit("DescribeComponent", id);
  };
  const atEnd = step === flow.steps.length - 1 && !playing && !loop;
  const totalMs = flow.steps.reduce((t, s) => t + (s.ms ?? 0), 0);
  const label = (id: string) => byId[id].short ?? byId[id].title;

  return (
    <div ref={wrapRef}>
      {/* Flow picker + transport */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div role="tablist" aria-label="Flows" className="flex gap-1 overflow-x-auto -mx-1 px-1 pb-1 sm:pb-0">
          {scene.flows.map((f) => {
            const on = f.id === flowId;
            return (
              <button
                key={f.id}
                role="tab"
                aria-selected={on}
                onClick={() => pickFlow(f.id)}
                className={`h-8 px-3 rounded-[5px] border text-[13px] font-medium whitespace-nowrap cursor-pointer transition-colors ${
                  on ? "border-accent bg-accent-soft text-fg" : "border-line bg-panel text-fg-2 hover:border-line-strong hover:text-fg"
                }`}
              >
                {f.name}
              </button>
            );
          })}
        </div>
        <div className="sm:ml-auto flex items-center gap-1 shrink-0">
          <button className="btn-icon" onClick={() => goto(step - 1)} disabled={step === 0} aria-label="Previous step">
            <SkipBack className="size-4" />
          </button>
          <button
            className="btn h-8 w-[5.5rem] justify-center"
            onClick={() => {
              setPinned(null);
              if (atEnd) {
                userStopped.current = false;
                setStep(0);
                setPlaying(true);
              } else {
                userStopped.current = playing;
                setPlaying(!playing);
              }
            }}
          >
            {playing ? <Pause className="size-3.5" /> : atEnd ? <RotateCcw className="size-3.5" /> : <Play className="size-3.5" />}
            {playing ? "Pause" : atEnd ? "Replay" : "Play"}
          </button>
          <button className="btn-icon" onClick={() => goto(step + 1)} disabled={step === flow.steps.length - 1} aria-label="Next step">
            <SkipForward className="size-4" />
          </button>
          <button
            className={`btn-icon ${loop ? "text-accent bg-accent-soft hover:bg-accent-soft hover:text-accent" : ""}`}
            onClick={() => setLoop((l) => !l)}
            aria-pressed={loop}
            aria-label="Loop through all flows"
            title={loop ? "Looping through all flows" : "Loop off"}
          >
            <Repeat className="size-4" />
          </button>
          <span className="mono text-[11.5px] text-faint tabular-nums ml-1.5">
            {step + 1}/{flow.steps.length}
          </span>
        </div>
      </div>

      <p className="mb-4 flex items-start gap-2 text-[13px] text-fg-2 leading-relaxed">
        <Lightbulb className="size-4 mt-0.5 text-accent shrink-0" aria-hidden />
        <span>
          <span className="font-medium text-fg">Try this: </span>
          {scene.tryThis}
        </span>
      </p>

      {/* The map */}
      <div className="panel p-2 sm:p-4 overflow-hidden">
        {layouts.map(({ kind, L }, li) => (
          <svg
            key={kind}
            viewBox={`0 0 ${L.W} ${L.H}`}
            className={kind === "wide" ? "hidden lg:block w-full h-auto select-none" : "lg:hidden block w-full max-w-[440px] mx-auto h-auto select-none"}
            role="group"
            aria-label={`${scene.label}. Components are buttons; choose one to read its breakdown.`}
          >
            {L.zones?.map((z, i) =>
              z.style === "dashed" ? (
                <rect key={i} x={z.x} y={z.y} width={z.w} height={z.h} rx={14} fill="none" strokeDasharray="5 5" className="stroke-line-strong" />
              ) : (
                <rect key={i} x={z.x} y={z.y} width={z.w} height={z.h} rx={14} className="fill-subtle stroke-line" />
              ),
            )}
            {L.labels?.map((t) => (
              <text key={t.text} x={t.x} y={t.y} textAnchor={t.anchor ?? "start"} fontSize={10.5} className="font-mono fill-faint">
                {t.text}
              </text>
            ))}

            {L.legend && (
              <g transform="translate(16 30)" fontSize={10.5} className="font-mono fill-muted">
                <line x1={0} y1={0} x2={26} y2={0} strokeWidth={1.25} className="stroke-line-strong" />
                <text x={36} y={0} dominantBaseline="central">request path</text>
                <line x1={0} y1={24} x2={26} y2={24} strokeWidth={1.25} strokeDasharray="4 4" className="stroke-line-strong" />
                <text x={36} y={24} dominantBaseline="central">control plane</text>
                <line x1={0} y1={48} x2={26} y2={48} strokeWidth={2} strokeDasharray="6 6" className="stroke-accent" />
                <text x={36} y={48} dominantBaseline="central">active flow</text>
                <circle cx={13} cy={72} r={4.5} className="fill-accent" />
                <text x={36} y={72} dominantBaseline="central">request in flight</text>
              </g>
            )}

            {/* Control-plane connectors (architecture only) */}
            {L.stubs?.map((c) => {
              const r = L.nodes[c.node];
              const above = r.y < c.y;
              const x = r.x + r.w / 2;
              const y1 = above ? r.y + r.h : r.y;
              const y2 = c.y;
              const tipY = c.into ? y2 : y1;
              const pointsDown = tipY > (c.into ? y1 : y2);
              const on = stepNode === c.node || hover === c.node || pinned === c.node;
              return (
                <g key={c.node} className={on ? "stroke-accent fill-accent" : "stroke-line-strong fill-line-strong"}>
                  <line x1={x} y1={y1} x2={x} y2={y2} strokeWidth={1.25} strokeDasharray="4 4" />
                  <path
                    d={pointsDown ? `M${x - 4} ${tipY - 6} L${x + 4} ${tipY - 6} L${x} ${tipY} Z` : `M${x - 4} ${tipY + 6} L${x + 4} ${tipY + 6} L${x} ${tipY} Z`}
                    stroke="none"
                  />
                  {L.edgeLabels && (
                    <text x={x + 8} y={(y1 + y2) / 2} dominantBaseline="central" fontSize={10} stroke="none" className="font-mono fill-faint">
                      {c.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Edges */}
            {scene.edges.map((e) => {
              const { d, mid } = link(L.nodes[e.a], L.nodes[e.b]);
              const k = pairKey(e.a, e.b);
              const inFlow = flowPairs.has(k);
              const near = neighbours ? neighbours.has(e.a) && neighbours.has(e.b) && (e.a === hover || e.b === hover) : false;
              const dim = neighbours && !near;
              return (
                <g key={k} className={`transition-opacity duration-200 ${dim ? "opacity-30" : ""}`}>
                  <path
                    d={d}
                    fill="none"
                    strokeWidth={inFlow || near ? 1.75 : 1.25}
                    className={`${inFlow ? "stroke-accent/45 bp-flow" : near ? "stroke-fg-2" : "stroke-line-strong"} transition-[stroke] duration-200`}
                  />
                  {L.edgeLabels && e.label && (
                    <text
                      x={mid[0]}
                      y={mid[1]}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={10}
                      stroke="var(--panel)"
                      strokeWidth={5}
                      style={{ paintOrder: "stroke" }}
                      className={`font-mono ${inFlow ? "fill-accent" : "fill-muted"}`}
                    >
                      {e.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Current hop */}
            {cur.from && cur.to && (
              <path
                key={`${flowId}-${step}`}
                ref={(el) => {
                  pathRefs.current[li] = el;
                }}
                d={link(L.nodes[cur.from], L.nodes[cur.to]).d}
                fill="none"
                strokeWidth={2.25}
                className={`${byId[cur.to].tone === "warn" ? "stroke-warn" : "stroke-accent"} bp-flow`}
              />
            )}

            {/* Nodes */}
            {scene.nodes.map((node) => (
              <NodeBox
                key={node.id}
                node={node}
                r={L.nodes[node.id]}
                narrow={kind === "narrow"}
                current={stepNode === node.id || cur.from === node.id}
                inFlow={flowNodes.has(node.id)}
                selected={(pinned ?? stepNode) === node.id}
                dim={Boolean(neighbours && !neighbours.has(node.id))}
                pulseKey={cur.at === node.id ? `${flowId}-${step}` : null}
                onPick={() => pick(node.id)}
                onHover={(on) => setHover(on ? node.id : null)}
              />
            ))}

            {/* Packet */}
            {cur.from && cur.to && (
              <g
                ref={(el) => {
                  packetRefs.current[li] = el;
                }}
                transform="translate(-50 -50)"
                className="pointer-events-none"
              >
                <circle r={11} className={byId[cur.to].tone === "warn" ? "fill-warn/20" : "fill-accent/20"} />
                <circle r={5} className={byId[cur.to].tone === "warn" ? "fill-warn" : "fill-accent"} />
              </g>
            )}
          </svg>
        ))}
      </div>

      {/* Steps + inspector */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="panel overflow-hidden">
          <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-line">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-[15px] font-semibold text-fg">{flow.name}</h3>
              {totalMs > 0 && <span className="mono text-[11.5px] text-muted whitespace-nowrap">budget ≈ {Math.round(totalMs * 10) / 10} ms</span>}
            </div>
            <p className="mt-1 text-[13.5px] text-muted leading-relaxed">{flow.summary}</p>
            {totalMs > 0 && (
              <div className="mt-3 flex h-1.5 gap-px rounded-full overflow-hidden" aria-hidden>
                {flow.steps.map((s, i) =>
                  s.ms ? (
                    <span
                      key={i}
                      style={{ flex: s.ms }}
                      className={`min-w-[3px] transition-colors duration-300 ${i === step ? "bg-accent" : i < step ? "bg-accent/40" : "bg-line-strong"}`}
                    />
                  ) : null,
                )}
              </div>
            )}
          </div>
          <ol className="py-2">
            {flow.steps.map((s, i) => {
              const on = i === step;
              const done = i < step;
              const warn = s.to ? byId[s.to].tone === "warn" : false;
              return (
                <li key={i}>
                  <button
                    onClick={() => goto(i)}
                    aria-current={on ? "step" : undefined}
                    className={`w-full text-left grid grid-cols-[1.5rem_minmax(0,1fr)_auto] gap-3 px-5 sm:px-6 py-2.5 cursor-pointer transition-colors ${
                      on ? (warn ? "bg-warn-soft" : "bg-accent-soft") : "hover:bg-hover"
                    }`}
                  >
                    <span
                      className={`mono text-[11.5px] pt-0.5 tabular-nums ${on ? (warn ? "text-warn font-semibold" : "text-accent font-semibold") : done ? "text-fg-2" : "text-faint"}`}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 mono text-[11.5px] text-muted">
                        {s.from && s.to ? (
                          <>
                            {label(s.from)}
                            <ArrowRight className="size-3 shrink-0" />
                            {label(s.to)}
                          </>
                        ) : (
                          <>at {label(s.at!)}</>
                        )}
                      </span>
                      <span className={`block text-[13.5px] leading-snug mt-0.5 ${on ? "text-fg" : "text-fg-2"}`}>{s.text}</span>
                    </span>
                    <span className="mono text-[11px] text-faint tabular-nums pt-0.5">{s.ms ? `${s.ms} ms` : ""}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        <Inspector node={inspected} pinned={Boolean(pinned)} />
      </div>
    </div>
  );
}

function NodeBox({
  node,
  r,
  narrow,
  current,
  inFlow,
  selected,
  dim,
  pulseKey,
  onPick,
  onHover,
}: {
  node: SceneNode;
  r: R;
  narrow: boolean;
  current: boolean;
  inFlow: boolean;
  selected: boolean;
  dim: boolean;
  pulseKey: string | null;
  onPick: () => void;
  onHover: (on: boolean) => void;
}) {
  const showSub = narrow ? r.w >= 140 && r.h >= 56 : r.h >= 60;
  const title = r.w < 140 ? (node.short ?? node.title) : node.title;
  const titleY = showSub ? (narrow ? 33 : 38) : Math.min(38, r.h - 12);
  const warn = node.tone === "warn";
  const ok = node.tone === "ok";
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onPick();
    }
  };
  const fillOn = warn ? "fill-warn-soft stroke-warn" : ok ? "fill-ok-soft stroke-ok" : "fill-accent-soft stroke-accent";
  return (
    <g
      transform={`translate(${r.x} ${r.y})`}
      role="button"
      tabIndex={0}
      aria-label={`${node.title}: ${node.sub}`}
      aria-pressed={selected}
      onClick={onPick}
      onKeyDown={onKey}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onFocus={() => onHover(true)}
      onBlur={() => onHover(false)}
      className={`group cursor-pointer outline-none transition-opacity duration-200 ${dim ? "opacity-40" : ""}`}
    >
      {pulseKey && (
        <rect key={pulseKey} width={r.w} height={r.h} rx={10} fill="none" strokeWidth={2} className={`${warn ? "stroke-warn" : ok ? "stroke-ok" : "stroke-accent"} bp-pulse`} />
      )}
      <rect
        width={r.w}
        height={r.h}
        rx={10}
        strokeWidth={current || selected ? 1.75 : 1.25}
        className={`transition-[fill,stroke] duration-200 ${
          current ? fillOn : selected ? "fill-panel stroke-fg-2" : `fill-panel ${warn ? "stroke-warn/40" : "stroke-line-strong"} group-hover:stroke-fg-2`
        }`}
      />
      <rect x={-4} y={-4} width={r.w + 8} height={r.h + 8} rx={13} fill="none" strokeWidth={2} className="stroke-accent opacity-0 group-focus-visible:opacity-100" />
      <text x={12} y={narrow ? 16 : 18} fontSize={9.5} letterSpacing="0.08em" className={`font-mono uppercase ${warn ? "fill-warn" : "fill-faint"}`}>
        {node.tag}
      </text>
      <circle
        cx={r.w - 12}
        cy={narrow ? 13 : 14}
        r={3}
        className={current ? (warn ? "fill-warn" : ok ? "fill-ok" : "fill-accent") : inFlow ? (warn ? "fill-warn" : "fill-ok") : "fill-line-strong"}
      />
      <text x={12} y={titleY} fontSize={narrow ? 12.5 : 13.5} fontWeight={600} className="fill-fg">
        {title}
      </text>
      {showSub && (
        <text x={12} y={narrow ? 47 : 54} fontSize={10.5} className="font-mono fill-muted">
          {node.sub}
        </text>
      )}
    </g>
  );
}

function Inspector({ node, pinned }: { node: SceneNode; pinned: boolean }) {
  const index = node.part ? SECTION_INDEX[node.part] : undefined;
  return (
    <aside key={node.id} className="panel anim-in" aria-live="polite">
      <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-line flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className={`mono text-[11px] uppercase tracking-[0.08em] ${node.tone === "warn" ? "text-warn" : "text-faint"}`}>
            {node.tag} · {pinned ? "selected" : "following the flow"}
          </div>
          <h3 className="mt-1 text-[17px] font-semibold tracking-tight text-fg">{node.title}</h3>
          <div className="mono text-[12px] text-muted">{node.sub}</div>
        </div>
        {index && (
          <a href={`#${node.part}`} className="btn h-7 px-2.5 shrink-0">
            §{index} <ArrowRight className="size-3.5" />
          </a>
        )}
      </div>
      <div className="px-5 sm:px-6 py-5 flex flex-col gap-4">
        <p className="text-fg-2 leading-relaxed">{node.what}</p>
        <ul className="flex flex-col gap-2">
          {node.points.map((p) => (
            <li key={p} className="flex gap-2.5 text-[13.5px] text-fg-2 leading-relaxed">
              <span className={`mt-2 size-1 rounded-full shrink-0 ${node.tone === "warn" ? "bg-warn" : "bg-accent"}`} aria-hidden />
              {p}
            </li>
          ))}
        </ul>
        {node.tradeoff && (
          <div className="rounded-md bg-subtle border border-line px-4 py-3">
            <div className="label mb-1">Trade-off</div>
            <p className="text-[13.5px] text-fg-2 leading-relaxed">{node.tradeoff}</p>
          </div>
        )}
      </div>
    </aside>
  );
}
