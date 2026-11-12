import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { NOTES, noteBySlug } from "@/data/notes";
import { PROFILE } from "@/data/profile";
import { Crumbs, Frame, Prose } from "@/components/Frame";
import { formatNoteDate } from "@/components/NoteList";

export const dynamicParams = false;

export function generateStaticParams() {
  return NOTES.map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const n = noteBySlug(slug);
  if (!n) return {};
  return {
    title: n.title,
    description: n.summary,
    alternates: { canonical: `/notes/${n.slug}/` },
    openGraph: { type: "article", title: n.title, description: n.summary, url: `/notes/${n.slug}/`, publishedTime: n.date, authors: [PROFILE.name] },
    twitter: { card: "summary_large_image", title: n.title, description: n.summary },
  };
}

export default async function NotePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const n = noteBySlug(slug);
  if (!n) notFound();

  const ld = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: n.title,
    description: n.summary,
    datePublished: n.date,
    url: `${PROFILE.site}/notes/${n.slug}/`,
    keywords: n.tags.join(", "),
    author: { "@id": `${PROFILE.site}/#person` },
    image: `${PROFILE.site}/og.jpg`,
  };

  return (
    <Frame>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <Crumbs items={[{ label: PROFILE.handle, href: "/" }, { label: "notes", href: "/notes/" }, { label: n.slug }]} />
      <article className="mt-6 max-w-[720px] anim-in">
        <header className="mb-8">
          <div className="flex items-center gap-2 mono text-[12px] text-muted">
            <time dateTime={n.date}>{formatNoteDate(n.date)}</time>
            <span className="text-faint">·</span>
            <span>{n.kind}</span>
          </div>
          <h1 className="mt-3 text-[28px] sm:text-[36px] leading-[1.15] font-semibold tracking-[-0.025em] text-fg">{n.title}</h1>
          <p className="mt-3 text-[16px] text-muted leading-relaxed">{n.summary}</p>
          <div className="mt-4 flex flex-wrap gap-1">
            {n.tags.map((t) => (
              <span key={t} className="chip">
                {t}
              </span>
            ))}
          </div>
        </header>
        <Prose blocks={n.body} />
        <footer className="mt-12 pt-6 border-t border-line flex items-center justify-between gap-4 flex-wrap">
          <Link prefetch={false} href="/notes/" className="btn">
            <ArrowLeft className="size-3.5" /> All notes
          </Link>
          <Link prefetch={false} href="/#contact" className="link">
            Questions? Let&apos;s talk →
          </Link>
        </footer>
      </article>
    </Frame>
  );
}
