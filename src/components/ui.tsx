import Image from "next/image";
import type { ReactNode } from "react";
import type { Project } from "@/data/profile";

export function Section({
  id,
  index,
  title,
  description,
  actions,
  children,
}: {
  id: string;
  index: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-8 pt-14">
      <div data-reveal className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2.5">
            <span className="mono text-[11px] text-faint tabular-nums">{index}</span>
            <h2 className="text-[16px] font-semibold tracking-tight text-fg">
              <a href={`#${id}`} className="hover:underline underline-offset-4 decoration-line-strong">
                {title}
              </a>
            </h2>
          </div>
          {description && <p className="text-muted mt-1 max-w-2xl">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0 flex-wrap">{actions}</div>}
      </div>
      <div data-reveal style={{ ["--d" as string]: "90ms" }}>
        {children}
      </div>
    </section>
  );
}

const STATUS_STYLES = {
  ok: "text-ok",
  warn: "text-warn",
  info: "text-accent",
  neutral: "text-muted",
} as const;

export function Status({ tone = "ok", children }: { tone?: keyof typeof STATUS_STYLES; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium whitespace-nowrap ${STATUS_STYLES[tone]}`}>
      <span className="relative flex size-2" aria-hidden>
        {tone === "ok" && <span className="ping absolute inset-0 rounded-full bg-current opacity-40" />}
        <span className="relative size-2 rounded-full bg-current" />
      </span>
      <span className="text-fg-2">{children}</span>
    </span>
  );
}

export function KeyValue({ rows, cols = 2 }: { rows: { k: string; v: ReactNode }[]; cols?: 1 | 2 | 3 }) {
  const grid = cols === 3 ? "sm:grid-cols-3" : cols === 2 ? "sm:grid-cols-2" : "";
  return (
    <dl className={`grid grid-cols-1 ${grid} gap-x-8 gap-y-4`}>
      {rows.map((r) => (
        <div key={r.k} className="min-w-0">
          <dt className="label mb-1">{r.k}</dt>
          <dd className="text-fg break-words">{r.v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Chips({ items }: { items: readonly string[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((s) => (
        <span key={s} className="chip">
          {s}
        </span>
      ))}
    </div>
  );
}

export const hostOf = (url: string) => new URL(url).host;

export function BrowserFrame({ p, sizes, priority }: { p: Project; sizes: string; priority?: boolean }) {
  return (
    <div className="rounded-lg border border-line overflow-hidden bg-subtle">
      <div className="flex items-center gap-1.5 h-7 px-3 border-b border-line">
        <span className="size-2 rounded-full bg-line-strong" />
        <span className="size-2 rounded-full bg-line-strong" />
        <span className="size-2 rounded-full bg-line-strong" />
        <span className="mono text-[10.5px] text-muted ml-2 truncate">{hostOf(p.url)}</span>
      </div>
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={p.image}
          alt={`${p.name} screenshot`}
          fill
          priority={priority}
          sizes={sizes}
          className="object-cover object-top transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
        />
      </div>
    </div>
  );
}

