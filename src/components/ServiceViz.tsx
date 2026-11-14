// Small live visuals under each service on the home page, in the same
// language as /blueprint: request hops, packets in flight, measured bars.
// Pure CSS; no client JavaScript.

const RENDER = ["build", "CDN", "server", "browser"];
const PIPE = ["push", "test", "build", "deploy", "live"];

export function ServiceViz({ id }: { id: string }) {
  if (id === "svc-frontend") {
    return (
      <div className="mt-5 max-w-[17rem]" aria-hidden>
        <div className="relative grid grid-cols-4 items-center h-4">
          <span className="absolute left-[12.5%] right-[12.5%] top-1/2 h-px bg-line-strong" />
          {RENDER.map((r) => (
            <span key={r} className="relative flex justify-center">
              <span className="size-1.5 rounded-full bg-line-strong" />
            </span>
          ))}
          <span className="svc-runner absolute top-1/2 size-3 -mt-1.5 -ml-1.5 rounded-full bg-accent ring-4 ring-accent-soft" />
        </div>
        <div className="mt-1.5 grid grid-cols-4 mono text-[10px] text-faint text-center">
          {RENDER.map((r) => (
            <span key={r}>{r}</span>
          ))}
        </div>
      </div>
    );
  }
  if (id === "svc-devops") {
    return (
      <div className="mt-5 flex items-center max-w-full overflow-hidden" aria-hidden>
        {PIPE.map((h, i) => (
          <span key={h} className="flex items-center shrink-0">
            <span
              className={`h-6 px-1.5 inline-flex items-center rounded-[5px] border mono text-[10.5px] ${
                i === PIPE.length - 1 ? "border-ok/40 bg-ok-soft text-fg" : "border-line bg-panel text-fg-2"
              }`}
            >
              {h}
            </span>
            {i < PIPE.length - 1 && (
              <span className="edge relative w-3 h-px">
                <span className="packet absolute -top-[2.5px] size-1.5 rounded-full bg-accent" style={{ animationDelay: `${i * 0.4}s` }} />
              </span>
            )}
          </span>
        ))}
      </div>
    );
  }
  if (id === "svc-perf") {
    // Real numbers from the "cutting mobile LCP" note on this site.
    return (
      <div className="mt-5 max-w-[19rem] flex flex-col gap-1.5" aria-label="Mobile LCP on this site: 7.2 s before, 1.4 s after">
        <div className="flex items-center gap-2.5">
          <span className="mono text-[10.5px] text-faint w-11 shrink-0">before</span>
          <span className="draw h-1.5 flex-1 rounded-full bg-line-strong" style={{ ["--d" as string]: "200ms" }} />
          <span className="mono text-[10.5px] text-muted w-9 text-right tabular-nums">7.2 s</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="mono text-[10.5px] text-faint w-11 shrink-0">after</span>
          <span className="flex-1 h-1.5">
            <span className="draw block h-full w-[19.4%] rounded-full bg-accent" style={{ ["--d" as string]: "700ms" }} />
          </span>
          <span className="mono text-[10.5px] text-fg w-9 text-right tabular-nums">1.4 s</span>
        </div>
        <span className="mono text-[10px] text-faint">mobile LCP, this site</span>
      </div>
    );
  }
  return null;
}
