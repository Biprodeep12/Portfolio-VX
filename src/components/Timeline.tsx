import { BUILDING_SINCE, EXPERIENCE } from "@/data/profile";

/* ================= Deployment timeline ================= */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const toIdx = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return y * 12 + (m - 1);
};

// Server component: rendered at build and refreshed with the page's daily
// revalidation, so it ships no JavaScript.
export function DeploymentTimeline() {
  const now = new Date();

  const nowIdx = now.getFullYear() * 12 + now.getMonth();
  const first = Math.min(toIdx(BUILDING_SINCE.start), ...EXPERIENCE.map((r) => toIdx(r.start))) - 1;
  const last = nowIdx + 2;
  const span = last - first;
  const pct = (i: number) => ((i - first) / span) * 100;
  const nowFrac = pct(nowIdx + now.getDate() / 31);
  const months = Array.from({ length: span }, (_, k) => first + k);
  // Paid roles plus the independent-projects lane that explains "2+ yrs".
  const roles = [
    { id: "dep-independent", company: "Independent", title: "Personal & open-source projects", period: `${BUILDING_SINCE.label} – Present`, start: BUILDING_SINCE.start, self: true },
    ...EXPERIENCE.map((r) => ({ ...r, self: false })),
  ].sort((a, b) => a.start.localeCompare(b.start));

  return (
    <div className="overflow-x-auto">
      <div className="[--lane:118px] sm:[--lane:168px] sm:min-w-[640px] px-4 pt-4 pb-3">
        {/* axis */}
        <div className="relative ml-[var(--lane)] h-6 border-b border-line">
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
            style={{ left: `calc(var(--lane) + (100% - var(--lane)) * ${nowFrac / 100})` }}
          >
            <span className="absolute -top-0.5 left-1.5 mono text-[10px] text-accent whitespace-nowrap">now</span>
          </div>
          {roles.map((r) => {
            const start = toIdx(r.start);
            const months = nowIdx - start + 1;
            return (
              <div key={r.id} style={{ ["--d" as string]: `${300 + roles.indexOf(r) * 180}ms` }} className="flex items-center h-12 border-b border-line last:border-b-0 border-dashed">
                <div className="w-[var(--lane)] shrink-0 pr-3 sm:pr-4 min-w-0">
                  <div className="font-medium text-fg text-[12.5px] sm:text-[13px] leading-tight sm:truncate">{r.company}</div>
                  <div className="mono text-[11px] text-muted hidden sm:block">{r.id}</div>
                </div>
                <div className="relative flex-1 h-full">
                  <div
                    className={`draw absolute top-1/2 -translate-y-1/2 h-6 rounded-[4px] border flex items-center overflow-hidden ${
                      r.self ? "bg-hover border-line-strong border-dashed" : "bg-accent-soft border-accent/40"
                    }`}
                    style={{ left: `${pct(start)}%`, width: `${nowFrac - pct(start)}%` }}
                    title={`${r.title} · ${r.period}`}
                  >
                    <span className={`px-2 text-[11.5px] font-medium truncate ${r.self ? "text-fg-2" : "text-accent"}`}>
                      <span className="hidden sm:inline">{r.title} · </span>
                      {months} mo
                    </span>
                    {!r.self && <span className="ml-auto h-full w-6 shrink-0 ongoing" aria-hidden />}
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

