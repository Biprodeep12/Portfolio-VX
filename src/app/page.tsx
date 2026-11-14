import { ArrowUpRight, Github, Lightbulb, Linkedin } from "lucide-react";
import { ABOUT, BUILDING_SINCE, EXPERIENCE, FIRST_ROLE, FIRST_ROLE_START, PROFILE, PROJECTS, SECTIONS, SERVICES, durationSince } from "@/data/profile";
import { Chips, Section, Status } from "@/components/ui";
import { CopyButton, CopyField } from "@/components/client";
import { SupportChannels } from "@/components/Support";
import { Frame } from "@/components/Frame";
import { GitHubActivity } from "@/components/GitHubActivity";
import { FAQ } from "@/data/faq";
import { TESTIMONIALS } from "@/data/testimonials";
import { ChevronRight } from "lucide-react";
import { ProjectsView, ResumeButton } from "@/components/Details";
import { CaseForm } from "@/components/CaseForm";
import { Terminal } from "@/components/Terminal";
import { CountUp, HalftonePortrait } from "@/components/Widgets";
import { StackEditorial } from "@/components/StackEditorial";
import { LAYERS, STACK_COUNT } from "@/data/stack";
import { DeploymentTimeline } from "@/components/Timeline";
import { BlueprintTeaser } from "@/components/BlueprintTeaser";
import { ServiceViz } from "@/components/ServiceViz";

const TOTAL_PRS = EXPERIENCE.reduce((n, r) => n + (r.mergedPRs ?? 0), 0);
const TOTAL_REPOS = EXPERIENCE.reduce((n, r) => n + (r.repos ?? 0), 0);
const SERVICE_PATHS = ["svc/frontend", "svc/infra", "svc/perf"];

export default function Home() {
  // Recomputed on every (daily) regeneration, so the numbers stay true.
  const PRO = durationSince(FIRST_ROLE_START);
  const BUILD = durationSince(BUILDING_SINCE.start);

  return (
    <Frame>
        {/* Hero: editorial name, role + actions below; the shell docks under the stats */}
        <header className="pt-14 sm:pt-24">
          <div className="hero-in flex flex-wrap items-center gap-x-4 gap-y-2 mono text-[12px] text-muted">
            <span className="inline-flex items-center gap-1 min-w-0">
              <span className="truncate">
                arn:bb:iam::0412:user/<span className="text-fg-2">{PROFILE.handle}</span>
              </span>
              <CopyButton value={`arn:bb:iam::0412:user/${PROFILE.handle}`} label="ARN copied" />
            </span>
            <span className="hidden sm:inline-flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-ok" aria-hidden />
              {PROFILE.location} · {EXPERIENCE.length} active roles
            </span>
          </div>

          <h1 className="mt-6 sm:mt-8 text-[clamp(3.25rem,10vw,7.5rem)] leading-[0.9] font-semibold tracking-[-0.05em] text-fg">
            Biprodeep <br className="sm:hidden" />
            Bose<span className="text-accent">.</span>
          </h1>

          <div className="mt-10 sm:mt-14 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-8 lg:gap-16 lg:items-end">
            <div className="max-w-[580px]">
              <p className="text-[19px] sm:text-[22px] font-medium tracking-[-0.015em] text-fg">{PROFILE.role}</p>
              <p className="mt-3 text-[15px] leading-relaxed text-muted">{PROFILE.summary}</p>
            </div>
            <div style={{ ["--d" as string]: "200ms" }} className="hero-in flex flex-wrap items-center gap-2 lg:justify-end">
              <a href="#contact" className="btn-primary h-10 px-4 text-[14px] max-sm:w-full max-sm:justify-center">
                Let&apos;s work together
              </a>
              <ResumeButton className="btn h-10 px-4 text-[14px] max-sm:flex-1 max-sm:justify-center" />
              <a href={PROFILE.github} target="_blank" rel="noopener noreferrer" className="btn-icon size-10 border border-line-strong" aria-label="GitHub">
                <Github className="size-4" />
              </a>
              <a href={PROFILE.linkedin} target="_blank" rel="noopener noreferrer" className="btn-icon size-10 border border-line-strong" aria-label="LinkedIn">
                <Linkedin className="size-4" />
              </a>
            </div>
          </div>
        </header>

        <nav aria-label="On this page" className="hero-in mt-12 flex flex-wrap gap-1.5" style={{ ["--d" as string]: "260ms" }}>
          {SECTIONS.map((sec, i) => (
            <a
              key={sec.id}
              href={`#${sec.id}`}
              className="h-8 px-3 inline-flex items-center gap-2 rounded-[5px] border border-line bg-panel text-[13px] text-fg-2 hover:border-line-strong hover:text-fg transition-colors"
            >
              <span className="mono text-[11px] text-faint">{String(i + 1).padStart(2, "0")}</span>
              {sec.label}
            </a>
          ))}
          <a
            href="/blueprint/"
            className="h-8 px-3 inline-flex items-center gap-2 rounded-[5px] border border-accent/40 bg-accent-soft text-[13px] text-fg hover:border-accent transition-colors"
          >
            <span className="mono text-[11px] text-accent">→</span>
            Blueprint
          </a>
        </nav>

        {/* Metric strip */}
        <div data-reveal className="mt-10 sm:mt-12 panel grid grid-cols-2 lg:grid-cols-4 overflow-hidden">
          <div className="px-4 sm:px-6 py-5 sm:py-6">
            <div className="label">Experience</div>
            <div className="mt-2 flex items-baseline gap-1">
              {PRO.years > 0 && (
                <>
                  <span className="text-[28px] leading-none font-semibold tracking-tight tabular-nums">{PRO.years}</span>
                  <span className="text-muted mr-1.5">yr{PRO.years > 1 ? "s" : ""}</span>
                </>
              )}
              <span className="text-[28px] leading-none font-semibold tracking-tight tabular-nums">{PRO.months}</span>
              <span className="text-muted">mo</span>
            </div>
            <div className="mt-1.5 text-[12px] text-muted" title={`Building software for ${BUILD.label} (since ${BUILDING_SINCE.label})`}>
              Professional, since {FIRST_ROLE}
            </div>
          </div>
          <div className="px-4 sm:px-6 py-5 sm:py-6 border-l border-line">
            <div className="label">Merged PRs at work</div>
            <div className="mt-2 text-[28px] leading-none font-semibold tracking-tight tabular-nums">
              <CountUp value={TOTAL_PRS} />
            </div>
            <div className="mt-1.5 text-[12px] text-muted">Across {TOTAL_REPOS} production repos</div>
          </div>
          <div className="px-4 sm:px-6 py-5 sm:py-6 border-t lg:border-t-0 lg:border-l border-line">
            <div className="label">Live projects</div>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-[28px] leading-none font-semibold tracking-tight tabular-nums">
                <CountUp value={PROJECTS.length} />
              </span>
              <span className="flex gap-1">
                {PROJECTS.map((p) => (
                  <span key={p.id} className="size-2.5 rounded-[3px] bg-ok/80" title={p.name} />
                ))}
              </span>
            </div>
            <div className="mt-1.5 text-[12px] text-muted">{PROJECTS.map((p) => p.name).join(" · ")}</div>
          </div>
          <div className="px-4 sm:px-6 py-5 sm:py-6 border-t border-l lg:border-t-0 border-line">
            <div className="label">Stack</div>
            <div className="mt-2 text-[28px] leading-none font-semibold tracking-tight tabular-nums">
              <CountUp value={STACK_COUNT} />
            </div>
            <div className="mt-2.5 flex h-1.5 rounded-full overflow-hidden gap-px" aria-label="Stack by layer">
              {LAYERS.map((l, i) => (
                <span
                  key={l.id}
                  title={`${l.name}: ${l.skills.length}`}
                  style={{ flex: l.skills.length, opacity: 1 - i * 0.13 }}
                  className="bg-fg"
                />
              ))}
            </div>
          </div>
        </div>

        {/* CloudShell dock */}
        <div data-reveal style={{ ["--d" as string]: "80ms" }} className="mt-6">
          <Terminal />
        </div>

        {/* 01 Services */}
        <Section
          id="services"
          index="01"
          title="Services"
          description="The three things I get called in for."
          actions={<span className="text-[12px] text-muted">3 of 3 healthy</span>}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {SERVICES.map((s, i) => (
              <article key={s.id} style={{ ["--d" as string]: `${i * 90}ms` }} className="rise lift panel p-5 sm:p-6 flex flex-col">
                <div className="mono text-[12px] text-muted">
                  <span className="text-faint">0{i + 1} </span>
                  {SERVICE_PATHS[i]}
                </div>
                <h3 className="mt-2 font-semibold text-[16px] tracking-tight text-fg">{s.name}</h3>
                <p className="mt-2 text-[14px] text-fg-2 leading-relaxed">{s.description}</p>
                <ServiceViz id={s.id} />
                <div className="mt-5 pl-3 border-l-2 border-accent/60 flex-1">
                  <div className="mono text-[10.5px] uppercase tracking-[0.08em] text-accent">In practice</div>
                  <p className="mt-1 text-[13.5px] text-fg-2 leading-relaxed">{s.proof}</p>
                </div>
                <div className="mt-4">
                  <Chips items={s.tags} />
                </div>
              </article>
            ))}
          </div>
          <BlueprintTeaser />
        </Section>

        {/* 02 Projects */}
        <Section
          id="projects"
          index="02"
          title="Projects"
          description="Built by me, still serving traffic. Open one to look inside."
          actions={
            <a href={PROFILE.github} target="_blank" rel="noopener noreferrer" className="btn h-7 px-2.5">
              Archive on GitHub <ArrowUpRight className="size-3.5" />
            </a>
          }
        >
          <ProjectsView />
          <GitHubActivity />
        </Section>

        {/* 03 Deployments */}
        <Section id="deployments" index="03" title="Deployments" description="Two remote roles in parallel, on top of independent projects since Aug 2024.">
          <div className="panel overflow-hidden">
            <DeploymentTimeline />
            <div className="grid grid-cols-1 md:grid-cols-2 border-t border-line divide-y md:divide-y-0 md:divide-x divide-line">
              {[...EXPERIENCE]
                .sort((a, b) => b.start.localeCompare(a.start))
                .map((r, i) => (
                  <article key={r.id} style={{ ["--d" as string]: `${500 + i * 120}ms` }} className="rise p-6 sm:p-8">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-[14px] text-fg">{r.title}</h3>
                        <div className="text-fg-2">
                          {r.company} <span className="text-faint">·</span> <span className="text-muted">{r.period}</span>
                        </div>
                      </div>
                      <Status>{r.status}</Status>
                    </div>
                    {r.mergedPRs ? (
                      <dl className="mt-4 grid grid-cols-3 gap-px bg-line rounded-md overflow-hidden border border-line" aria-label="Measured impact">
                        {[
                          { k: "merged PRs", v: r.mergedPRs.toLocaleString("en-US") },
                          { k: "commits", v: `${(r.commits ?? 0).toLocaleString("en-US")}+` },
                          { k: "repositories", v: String(r.repos ?? 0) },
                        ].map((m) => (
                          <div key={m.k} className="bg-panel px-3 py-2.5">
                            <dd className="text-[18px] leading-none font-semibold tabular-nums text-fg">{m.v}</dd>
                            <dt className="mt-1 mono text-[10.5px] text-muted">{m.k}</dt>
                          </div>
                        ))}
                      </dl>
                    ) : null}
                    {r.scope && (
                      <div className="mt-4 pl-3 border-l-2 border-accent/60">
                        <div className="mono text-[10.5px] uppercase tracking-[0.08em] text-accent">Scope</div>
                        <p className="mt-0.5 text-[13.5px] text-fg-2">{r.scope}</p>
                      </div>
                    )}
                    <p className="mt-3 text-muted leading-relaxed">{r.description}</p>
                    <div className="mt-3">
                      <Chips items={r.skills} />
                    </div>
                  </article>
                ))}
            </div>
          </div>
        </Section>

        {/* 04 Stack */}
        <Section
          id="stack"
          index="04"
          title="Stack"
          description="What I reach for, front to back. Hover any of it to see where it has shipped."
        >
          <StackEditorial />
        </Section>

        {/* 05 Account */}
        <Section id="about" index="05" title="Account" description="The human behind the account ID.">
          <div className="panel overflow-hidden grid grid-cols-1 md:grid-cols-[280px_minmax(0,1fr)]">
            <div className="relative aspect-[4/5] md:aspect-auto md:min-h-[380px] border-b md:border-b-0 md:border-r border-line bg-subtle">
              <HalftonePortrait src="/img/pfp-320.webp" full="/img/pfp-640.webp" alt={PROFILE.name} />
              <span className="absolute left-3 bottom-3 mono text-[10.5px] text-muted bg-panel/90 border border-line rounded px-1.5 py-0.5 pointer-events-none">
                <span className="only-hover">hover</span>
                <span className="only-touch">tap</span> to de-dither
              </span>
            </div>
            <div className="flex flex-col">
              <div className="px-7 sm:px-9 py-8 border-b border-line">
                <div className="label mb-2">Philosophy</div>
                <p className="text-[20px] sm:text-[22px] leading-snug font-medium tracking-tight text-fg max-w-[560px]">
                  “{ABOUT.philosophy}”
                </p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-line flex-1">
                {[
                  { k: "Background", v: ABOUT.background },
                  { k: "Approach", v: ABOUT.approach },
                  { k: "Off the clock", v: ABOUT.outside },
                ].map((r) => (
                  <div key={r.k} className="px-7 sm:px-9 py-7">
                    <div className="label mb-2">{r.k}</div>
                    <p className="text-fg-2 leading-relaxed">{r.v}</p>
                  </div>
                ))}
              </div>
              <dl className="grid grid-cols-2 lg:grid-cols-4 border-t border-line bg-subtle/60">
                {[
                  { k: "Account ID", v: <CopyField value={PROFILE.accountId} /> },
                  { k: "Region", v: PROFILE.location },
                  { k: "Username", v: <span className="mono">{PROFILE.handle}</span> },
                  {
                    k: "Website",
                    v: (
                      <a className="link" href={PROFILE.site}>
                        {new URL(PROFILE.site).host}
                      </a>
                    ),
                  },
                ].map((r, i) => (
                  <div key={r.k} className={`px-5 sm:px-9 py-4 border-line ${i % 2 ? "border-l" : ""} ${i >= 2 ? "border-t lg:border-t-0" : ""} ${i === 2 ? "lg:border-l" : ""}`}>
                    <dt className="label mb-0.5">{r.k}</dt>
                    <dd className="text-fg min-h-6 flex items-center">{r.v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
          {TESTIMONIALS.length > 0 && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {TESTIMONIALS.map((t) => (
                <figure key={t.name} className="rise panel p-6 sm:p-8 flex flex-col">
                  <blockquote className="text-fg-2 leading-relaxed">“{t.quote}”</blockquote>
                  <figcaption className="mt-4 text-[12.5px]">
                    {t.link ? (
                      <a href={t.link} target="_blank" rel="noopener noreferrer" className="font-medium text-fg hover:text-accent">
                        {t.name}
                      </a>
                    ) : (
                      <span className="font-medium text-fg">{t.name}</span>
                    )}
                    <span className="text-muted">
                      {" "}
                      · {t.role}, {t.company}
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </Section>

        {/* 06 FAQ */}
        <Section id="faq" index="06" title="FAQ" description="Quick answers, based on work he has actually shipped.">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
              }),
            }}
          />
          <p className="mb-4 flex items-start gap-2 text-[13px] text-fg-2 leading-relaxed">
            <Lightbulb className="size-4 mt-0.5 text-accent shrink-0" aria-hidden />
            <span>
              <span className="font-medium text-fg">Not here? </span>
              Ask the assistant in the bottom-right corner; it answers from the same facts as this page.
            </span>
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
            {FAQ.map((f, i) => (
              <details key={f.q} className="rise group panel overflow-hidden" style={{ ["--d" as string]: `${i * 50}ms` }}>
                <summary className="list-none [&::-webkit-details-marker]:hidden cursor-pointer flex items-center gap-3 px-5 sm:px-6 py-4 hover:bg-hover/60 transition-colors">
                  <span className="mono text-[11px] text-faint tabular-nums w-5 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                  <span className="font-medium text-fg flex-1">{f.q}</span>
                  <ChevronRight className="size-4 text-muted shrink-0 transition-transform duration-200 group-open:rotate-90" />
                </summary>
                <p className="pl-[3.25rem] sm:pl-[3.5rem] pr-5 sm:pr-6 pb-5 -mt-1 text-[14px] text-fg-2 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </Section>

        {/* 07 Support */}
        <Section id="contact" index="07" title="Support" description="Opportunities, side projects, or just a hello. Pick whichever way suits you.">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)] gap-6 items-start">
            <SupportChannels />
            <CaseForm />
          </div>
        </Section>

    </Frame>
  );
}
