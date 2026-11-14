import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight, MousePointerClick, Play, Puzzle } from "lucide-react";
import { PROFILE } from "@/data/profile";
import { BP_STATS, BP_TOC, PARTS, SCALING_IDEAS, type PartId } from "@/data/blueprint";
import { FLOW_COUNT, SCENES } from "@/data/scenes";
import { Crumbs, Frame } from "@/components/Frame";
import { Section } from "@/components/ui";
import { FlowMap } from "@/components/blueprint/FlowMap";
import { Erd } from "@/components/blueprint/Interactive";
import { CheckYourself, Estimator, Glossary } from "@/components/blueprint/Learn";
import { Capacity, ConceptGrid, DecisionList, Ladder, LearningPath, Requirements, Signals } from "@/components/blueprint/Visuals";

const TITLE = "Learn system design: a full-stack app for 1M users";
const DESCRIPTION =
  "Learn how system design works by walking through one real-world design for 1M monthly users: requirements, estimates, frontend, backend, data, AWS, CI/CD, security, scaling and trade-offs, with interactive maps, a load estimator and quick checks.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/blueprint/" },
  openGraph: { type: "article", title: TITLE, description: DESCRIPTION, url: "/blueprint/" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

// Extra visuals shown under a section's concept cards.
const EXTRA: Partial<Record<PartId, ReactNode>> = {
  data: <Erd />,
  security: <Signals />,
};

const HOW = [
  { icon: Play, text: "Play the flows on each map and watch a request move, one step at a time." },
  { icon: MousePointerClick, text: "Click any component to see what it does and what it trades away." },
  { icon: Puzzle, text: "Each card goes concept → how this design uses it → the common mistake. Then check yourself." },
];

export default function BlueprintPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TechArticle",
        headline: TITLE,
        description: DESCRIPTION,
        url: `${PROFILE.site}/blueprint/`,
        author: { "@type": "Person", name: PROFILE.name, url: PROFILE.site },
        about: ["System design", "Software architecture", "AWS", "DevOps", "PostgreSQL", "Scalability"],
        educationalLevel: "Intermediate",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: PROFILE.name, item: `${PROFILE.site}/` },
          { "@type": "ListItem", position: 2, name: "Blueprint", item: `${PROFILE.site}/blueprint/` },
        ],
      },
    ],
  };

  return (
    <Frame>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Crumbs items={[{ label: PROFILE.handle, href: "/" }, { label: "blueprint" }]} />

      <header className="mt-6 sm:mt-10">
        <div className="hero-in mono text-[12px] text-muted">learn system design · one app, 1M monthly users</div>
        <h1 className="hero-in mt-3 text-[clamp(2.6rem,7vw,4.75rem)] leading-[0.95] font-semibold tracking-[-0.045em] text-fg" style={{ ["--d" as string]: "60ms" }}>
          Blueprint<span className="text-accent">.</span>
        </h1>
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-8 lg:items-end">
          <div className="hero-in max-w-[640px]" style={{ ["--d" as string]: "120ms" }}>
            <p className="text-[16px] sm:text-[17px] leading-relaxed text-fg-2">
              System design is deciding which pieces a product needs, how they talk to each other, and what happens when traffic grows
              or something breaks. This page teaches it by walking through one complete design: an app for a million monthly users,
              built to cost as little as possible without cutting corners.
            </p>
          </div>
          <dl className="hero-in grid grid-cols-2 sm:grid-cols-4 gap-px bg-line rounded-lg overflow-hidden border border-line" style={{ ["--d" as string]: "180ms" }}>
            {[
              { k: "maps", v: Object.keys(SCENES).length },
              { k: "flows", v: FLOW_COUNT },
              { k: "decisions", v: BP_STATS.decisions },
              { k: "terms", v: BP_STATS.terms },
            ].map((s) => (
              <div key={s.k} className="bg-panel px-3 sm:px-5 py-3">
                <dd className="text-[22px] leading-none font-semibold tracking-tight tabular-nums text-fg">{s.v}</dd>
                <dt className="mt-1.5 mono text-[10.5px] text-muted">{s.k}</dt>
              </div>
            ))}
          </dl>
        </div>

        <ul className="hero-in mt-8 grid grid-cols-1 md:grid-cols-3 gap-3" style={{ ["--d" as string]: "220ms" }}>
          {HOW.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-3 rounded-lg border border-line bg-panel/60 px-4 py-3 text-[13.5px] text-fg-2 leading-relaxed">
              <Icon className="size-4 mt-0.5 text-accent shrink-0" aria-hidden />
              {text}
            </li>
          ))}
        </ul>

        <div className="hero-in mt-10" style={{ ["--d" as string]: "260ms" }}>
          <div className="label mb-3">The path: how to approach any system design</div>
          <LearningPath />
        </div>

        <nav aria-label="On this page" className="hero-in mt-6 flex flex-wrap gap-1.5" style={{ ["--d" as string]: "300ms" }}>
          {BP_TOC.map((t) => (
            <a
              key={t.id}
              href={`#${t.id}`}
              className="h-8 px-3 inline-flex items-center gap-2 rounded-[5px] border border-line bg-panel text-[13px] text-fg-2 hover:border-line-strong hover:text-fg transition-colors"
            >
              <span className="mono text-[11px] text-faint">{t.index}</span>
              {t.label}
            </a>
          ))}
        </nav>
      </header>

      <Section
        id="requirements"
        index="01"
        title="Requirements & estimates"
        description="Every design starts with two questions: what must it do, and how big will it get? The estimates are rough on purpose, but they decide everything that follows."
      >
        <Requirements />
        <h3 className="mt-10 mb-2 text-[17px] font-semibold tracking-tight text-fg">Back-of-the-envelope estimate</h3>
        <p className="mb-5 text-muted max-w-2xl leading-relaxed">
          Turn &ldquo;1M users&rdquo; into requests per second, database load and connections. Move the sliders to see how each
          assumption changes the size of the system.
        </p>
        <Estimator />
        <CheckYourself part="requirements" />
      </Section>

      <Section
        id="architecture"
        index="02"
        title="High-level design"
        description="The whole system as boxes and arrows: what each piece does and how a request travels through them. Get this picture right before going deep on any one box."
      >
        <FlowMap sceneId="architecture" />
        <CheckYourself part="architecture" />
      </Section>

      {PARTS.map((p) => (
        <Section key={p.id} id={p.id} index={p.index} title={p.title} description={p.intro} actions={<span className="mono text-[11.5px] text-faint">{p.kicker}</span>}>
          <FlowMap sceneId={p.id} />
          <h3 className="mt-10 mb-4 text-[17px] font-semibold tracking-tight text-fg">Key ideas</h3>
          <ConceptGrid items={p.items} />
          {EXTRA[p.id] && <div className="mt-6">{EXTRA[p.id]}</div>}
          <CheckYourself part={p.id} />
        </Section>
      ))}

      <Section
        id="scaling"
        index="09"
        title="Scaling"
        description="Scaling isn't one technique; it's finding the next bottleneck before your users do. Here's how this design is sized, where it saves money, and what changes as it grows."
      >
        <ConceptGrid items={SCALING_IDEAS} />
        <h3 className="mt-10 mb-4 text-[17px] font-semibold tracking-tight text-fg">How this design is sized</h3>
        <Capacity />
        <h3 className="mt-14 mb-2 text-[17px] font-semibold tracking-tight text-fg">Beyond 1M users</h3>
        <p className="mb-6 text-muted max-w-2xl leading-relaxed">
          The same images and code at every stage; only the infrastructure around them changes. Each step is taken when a measured
          limit says so. User counts are rough orders of magnitude.
        </p>
        <Ladder />
        <CheckYourself part="scaling" />
      </Section>

      <Section
        id="decisions"
        index="10"
        title="Trade-offs"
        description="There are no perfect answers in system design, only trade-offs. For each choice: what was picked, what was passed on, what it costs, and the signal that would change it."
      >
        <DecisionList />
      </Section>

      <Section id="glossary" index="11" title="Glossary" description="The vocabulary used on this page, in plain words. Each term links to where it's used.">
        <Glossary />
      </Section>

      <div data-reveal className="mt-24 panel p-6 sm:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-[20px] sm:text-[22px] font-semibold tracking-tight text-fg">Need this built, or untangled?</h2>
          <p className="mt-2 text-muted max-w-xl leading-relaxed">
            New products, migrations onto AWS, CI/CD that can roll back, or a performance pass on what you already run.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Link prefetch={false} href="/#contact" className="btn-primary h-10 px-4 text-[14px]">
            Start a conversation
          </Link>
          <Link prefetch={false} href="/projects/strux/" className="btn h-10 px-4 text-[14px]">
            See STRUX <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </Frame>
  );
}
