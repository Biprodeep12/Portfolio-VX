import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Note } from "@/data/notes";

const fmt = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** List of notes; used on the home page and on /notes. */
export function NoteList({ notes, headingLevel = 3 }: { notes: Note[]; headingLevel?: 2 | 3 }) {
  const H = headingLevel === 2 ? "h2" : "h3";
  return (
    <div className="panel divide-y divide-line overflow-hidden">
      {notes.map((n, i) => (
        <Link prefetch={false}
          key={n.slug}
          href={`/notes/${n.slug}/`}
          style={{ ["--d" as string]: `${i * 90}ms` }}
          className="rise group grid grid-cols-1 md:grid-cols-[150px_minmax(0,1fr)_auto] gap-1 md:gap-6 px-5 py-5 hover:bg-hover/60 transition-colors"
        >
          <div className="flex md:flex-col gap-2 md:gap-1 items-center md:items-start">
            <time dateTime={n.date} className="mono text-[12px] text-muted">
              {fmt(n.date)}
            </time>
            <span className={`mono text-[10.5px] px-1.5 rounded ${n.kind === "ADR" ? "bg-accent-soft text-accent" : "bg-hover text-fg-2"}`}>{n.kind}</span>
          </div>
          <div className="min-w-0">
            <H className="font-semibold text-[15px] tracking-tight text-fg group-hover:text-accent transition-colors">{n.title}</H>
            <p className="mt-1 text-muted leading-relaxed">{n.summary}</p>
          </div>
          <ArrowRight className="hidden md:block size-4 text-faint self-center transition-transform group-hover:translate-x-0.5 group-hover:text-fg" />
        </Link>
      ))}
    </div>
  );
}

export { fmt as formatNoteDate };
