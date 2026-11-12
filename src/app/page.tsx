import { ArrowUpRight, FileText, Github, Instagram, Linkedin, Mail } from "lucide-react";
import { ABOUT, BUILDING_SINCE, EXPERIENCE, PROFILE, PROJECTS, SERVICES } from "@/data/profile";
import { Chips, Section, Status } from "@/components/ui";
import { CopyButton, CopyField } from "@/components/client";
import { Frame } from "@/components/Frame";
import { GitHubActivity } from "@/components/GitHubActivity";
import { NoteList } from "@/components/NoteList";
import { NOTES } from "@/data/notes";
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

const TOTAL_PRS = EXPERIENCE.reduce((n, r) => n + (r.mergedPRs ?? 0), 0);
const TOTAL_REPOS = EXPERIENCE.reduce((n, r) => n + (r.repos ?? 0), 0);
const SERVICE_PATHS = ["svc/frontend", "svc/infra", "svc/perf"];

const CHANNELS = [
  { name: "Resume", icon: FileText, value: "Resume.pdf", href: "/Resume.pdf", copy: `${PROFILE.site}/Resume.pdf` },
  { name: "Email", icon: Mail, value: PROFILE.email, href: `mailto:${PROFILE.email}`, copy: PROFILE.email },
  { name: "GitHub", icon: Github, value: "Biprodeep12", href: PROFILE.github, copy: PROFILE.github },
  { name: "LinkedIn", icon: Linkedin, value: "biprodeep-bose", href: PROFILE.linkedin, copy: PROFILE.linkedin },
  { name: "Instagram", icon: Instagram, value: "@bosebd", href: PROFILE.instagram, copy: PROFILE.instagram },
];

export default function Home() {

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

        {/* Metric strip */}
        <div data-reveal className="mt-20 sm:mt-24 panel grid grid-cols-2 lg:grid-cols-4 overflow-hidden">
          <div className="px-6 py-6">
            <div className="label">Experience</div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-[28px] leading-none font-semibold tracking-tight tabular-nums">2+</span>
              <span className="text-muted">yrs</span>
            </div>
            <div className="mt-1.5 text-[12px] text-muted">Building since {BUILDING_SINCE.label}</div>
          </div>
          <div className="px-6 py-6 border-l border-line">
            <div className="label">Merged PRs at work</div>
            <div className="mt-2 text-[28px] leading-none font-semibold tracking-tight tabular-nums">
              <CountUp value={TOTAL_PRS} />
            </div>
            <div className="mt-1.5 text-[12px] text-muted">Across {TOTAL_REPOS} production repos</div>
          </div>
          <div className="px-6 py-6 border-t lg:border-t-0 lg:border-l border-line">
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
          <div className="px-6 py-6 border-t border-l lg:border-t-0 border-line">
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
          <div className="panel divide-y divide-line overflow-hidden">
            {SERVICES.map((s, i) => (
              <article key={s.id} style={{ ["--d" as string]: `${i * 90}ms` }} className="rise grid grid-cols-1 md:grid-cols-[170px_minmax(0,1fr)_240px] gap-3 md:gap-10 px-6 sm:px-8 py-7 hover:bg-hover/60 transition-colors">
                <div className="mono text-[12px] text-muted pt-0.5">
                  <span className="text-faint">0{i + 1} </span>
                  {SERVICE_PATHS[i]}
                </div>
                <div>
                  <h3 className="font-semibold text-[15px] tracking-tight text-fg mb-1">{s.name}</h3>
                  <p className="text-muted leading-relaxed max-w-[560px]">{s.description}</p>
                </div>
                <div className="md:pt-0.5">
                  <Chips items={s.tags} />
                </div>
              </article>
            ))}
          </div>
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
                    {!!r.metrics?.length && (
                      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1" aria-label="Measured impact">
                        {r.metrics.map((m) => (
                          <li key={m} className="mono text-[11.5px] text-fg-2 flex items-center gap-1.5">
                            <span className="size-1 rounded-full bg-accent" aria-hidden />
                            {m}
                          </li>
                        ))}
                      </ul>
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
                  <div key={r.k} className={`px-7 sm:px-9 py-4 border-line ${i % 2 ? "border-l" : ""} ${i >= 2 ? "border-t lg:border-t-0" : ""} ${i === 2 ? "lg:border-l" : ""}`}>
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

        {/* 06 Notes */}
        <Section
          id="notes"
          index="06"
          title="Notes"
          description="How things were built and why: numbers, decisions, and what I'd change."
          actions={
            <a href="/notes/" className="btn h-7 px-2.5">
              All notes <ArrowUpRight className="size-3.5" />
            </a>
          }
        >
          <NoteList notes={NOTES.slice(0, 3)} />
        </Section>

        {/* 07 FAQ */}
        <Section id="faq" index="07" title="FAQ" description="Quick answers, based on work he has actually shipped.">
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
          <div className="panel divide-y divide-line overflow-hidden">
            {FAQ.map((f, i) => (
              <details key={f.q} className="rise group" style={{ ["--d" as string]: `${i * 50}ms` }}>
                <summary className="list-none [&::-webkit-details-marker]:hidden cursor-pointer flex items-center gap-4 px-6 sm:px-8 py-5 hover:bg-hover/60 transition-colors">
                  <ChevronRight className="size-4 text-muted shrink-0 transition-transform duration-200 group-open:rotate-90" />
                  <span className="font-medium text-fg">{f.q}</span>
                </summary>
                <p className="pl-[3.75rem] sm:pl-[4.25rem] pr-6 sm:pr-8 pb-6 -mt-1 text-fg-2 leading-relaxed max-w-3xl">{f.a}</p>
              </details>
            ))}
          </div>
        </Section>

        {/* 08 Support */}
        <Section id="contact" index="08" title="Support" description="Opportunities, side projects, or just a hello.">
          <CaseForm />
          <div className="mt-6 panel grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[0.85fr_1.45fr_1fr_1fr_0.9fr] gap-px bg-line overflow-hidden">
            {CHANNELS.map((c, i) => {
              const Icon = c.icon;
              const external = !c.href.startsWith("mailto:");
              return (
                <div
                  key={c.name}
                  className={`flex items-center gap-3 px-5 h-[4.5rem] bg-panel hover:bg-hover transition-colors ${
                    i === CHANNELS.length - 1 && CHANNELS.length % 2 ? "sm:col-span-2 lg:col-span-1" : ""
                  }`}
                >
                  <Icon className="size-4 text-muted shrink-0" />
                  <a href={c.href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="min-w-0 flex-1 group">
                    <span className="block text-[11.5px] text-muted leading-4">{c.name}</span>
                    <span className="block text-fg group-hover:text-accent truncate transition-colors">{c.value}</span>
                  </a>
                  <CopyButton value={c.copy} label={`${c.name} copied`} />
                </div>
              );
            })}
          </div>
        </Section>

    </Frame>
  );
}
