import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { PROFILE, PROJECTS } from "@/data/profile";
import { BrowserFrame, Chips, Status, hostOf } from "@/components/ui";
import { CopyField, JsonBlock, Tabs } from "@/components/client";
import { Topology } from "@/components/ModalBodies";
import { Crumbs, Frame } from "@/components/Frame";

export const dynamicParams = false;

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const p = PROJECTS.find((x) => x.id === id);
  if (!p) return {};
  const title = `${p.name}: ${p.title}`;
  return {
    title,
    description: p.description,
    alternates: { canonical: `/projects/${p.id}/` },
    openGraph: { type: "article", title, description: p.description, url: `/projects/${p.id}/`, images: [`/img/${p.image.slice(1).replace(".webp", "")}-1080.webp`] },
    twitter: { card: "summary_large_image", title, description: p.description },
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const idx = PROJECTS.findIndex((x) => x.id === id);
  if (idx < 0) notFound();
  const p = PROJECTS[idx];
  const prev = PROJECTS[(idx - 1 + PROJECTS.length) % PROJECTS.length];
  const next = PROJECTS[(idx + 1) % PROJECTS.length];
  const cs = p.caseStudy;

  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${PROFILE.site}/` },
          { "@type": "ListItem", position: 2, name: "Projects", item: `${PROFILE.site}/#projects` },
          { "@type": "ListItem", position: 3, name: p.name, item: `${PROFILE.site}/projects/${p.id}/` },
        ],
      },
      { "@id": `${PROFILE.site}/#${p.id}` },
    ],
  };

  return (
    <Frame>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <Crumbs items={[{ label: PROFILE.handle, href: "/" }, { label: "projects", href: "/#projects" }, { label: `prj-${p.id}` }]} />

      <header className="mt-6 flex flex-col lg:flex-row lg:items-end justify-between gap-5 anim-in">
        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-[34px] sm:text-[44px] leading-none font-semibold tracking-[-0.03em] text-fg">{p.name}</h1>
            <Status>{p.status}</Status>
          </div>
          <p className="mt-3 text-[17px] text-fg-2 font-medium tracking-tight">{p.title}</p>
          <p className="mt-2 text-muted max-w-2xl leading-relaxed text-[14px]">{p.description}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link prefetch={false} href="/#projects" className="btn">
            <ArrowLeft className="size-3.5" /> All projects
          </Link>
          <a href={p.url} target="_blank" rel="noopener noreferrer" className="btn-primary">
            Open live site <ArrowUpRight className="size-3.5" />
          </a>
        </div>
      </header>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
        <a href={p.url} target="_blank" rel="noopener noreferrer" className="group block anim-in [animation-delay:80ms]" aria-label={`Open ${p.name}`}>
          <BrowserFrame p={p} sizes="(max-width: 1024px) 100vw, 780px" priority />
        </a>

        <aside className="panel divide-y divide-line lg:sticky lg:top-6">
          {[
            { k: "Resource ID", v: <CopyField value={`prj-${p.id}`} /> },
            { k: "Status", v: <Status>{p.status}</Status> },
            { k: "Type", v: p.type },
            {
              k: "Endpoint",
              v: (
                <a href={p.url} target="_blank" rel="noopener noreferrer" className="link">
                  {hostOf(p.url)}
                </a>
              ),
            },
            { k: "Owner", v: <span className="mono">{PROFILE.accountId}</span> },
          ].map((r) => (
            <div key={r.k} className="flex items-center justify-between gap-4 px-4 min-h-11 py-2">
              <span className="text-muted">{r.k}</span>
              <span className="min-w-0 text-right">{r.v}</span>
            </div>
          ))}
          <div className="px-4 py-3">
            <div className="label mb-2">Stack</div>
            <Chips items={p.stack} />
          </div>
        </aside>
      </div>

      {cs && (
        <section className="mt-12 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6">
          <div className="flex flex-col gap-8 max-w-[720px]">
            {cs.problem && <CaseBlock title="Problem">{cs.problem}</CaseBlock>}
            {cs.approach && <CaseBlock title="Approach">{cs.approach}</CaseBlock>}
            {!!cs.decisions?.length && (
              <div>
                <h2 className="text-[17px] font-semibold tracking-tight mb-3">Key decisions</h2>
                <div className="panel divide-y divide-line">
                  {cs.decisions.map((d) => (
                    <div key={d.title} className="p-4">
                      <div className="font-medium text-fg">{d.title}</div>
                      <p className="text-fg-2 mt-1 leading-relaxed">{d.why}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!!cs.results?.length && (
              <div>
                <h2 className="text-[17px] font-semibold tracking-tight mb-3">Results</h2>
                <ul className="flex flex-col gap-2 pl-5 list-disc marker:text-faint text-fg-2 text-[15px] leading-relaxed">
                  {cs.results.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
            {cs.hindsight && <CaseBlock title="What I'd do differently">{cs.hindsight}</CaseBlock>}
          </div>
        </section>
      )}

      <section className="mt-12">
        <Tabs
          tabs={[
            { id: "topology", label: "Topology", content: <Topology p={p} /> },
            {
              id: "config",
              label: "Configuration",
              content: (
                <JsonBlock
                  data={{ resourceId: `prj-${p.id}`, name: p.name, type: p.type, status: p.status.toLowerCase(), endpoint: p.url, runtime: { stack: p.stack } }}
                  filename={`${p.id}.resource.json`}
                />
              ),
            },
          ]}
        />
      </section>

      {PROJECTS.length > 1 && (
        <nav aria-label="More projects" className={`mt-12 grid gap-4 ${PROJECTS.length > 2 ? "grid-cols-2" : "grid-cols-1 sm:w-1/2 sm:ml-auto"}`}>
          {PROJECTS.length > 2 && (
          <Link prefetch={false} href={`/projects/${prev.id}/`} className="panel p-4 hover:border-line-strong transition-colors group">
            <span className="label flex items-center gap-1">
              <ArrowLeft className="size-3 transition-transform group-hover:-translate-x-0.5" /> Previous
            </span>
            <span className="block mt-1 font-semibold text-fg">{prev.name}</span>
          </Link>
          )}
          <Link prefetch={false} href={`/projects/${next.id}/`} className="panel p-4 text-right hover:border-line-strong transition-colors group">
            <span className="label flex items-center justify-end gap-1">
              Next <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
            </span>
            <span className="block mt-1 font-semibold text-fg">{next.name}</span>
          </Link>
        </nav>
      )}
    </Frame>
  );
}

function CaseBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-[17px] font-semibold tracking-tight mb-2">{title}</h2>
      <p className="text-fg-2 text-[15px] leading-[1.75]">{children}</p>
    </div>
  );
}
